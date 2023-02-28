import type { EIP1193Provider, EIP1193ProviderRpcError } from '$lib/types/eip1193';
import type { Web3WModule, Web3WModuleLoader } from '$lib/types/modules';
import { createStore } from '$lib/utils/stores';
import { createBuiltinStore } from './builtin';
import { logs } from 'named-logs';
import { wait } from '$lib/utils/time';
import { formatChainId } from '$lib/utils/ethereum';
import { wrapProvider } from '$lib/provider';
import { createPendingActionsStore } from './pending-actions';
import { createManageablePromiseWithId } from '$lib/utils/promises';
import { getContractInfos } from '$lib/utils/contracts';
import { fetchPreviousSelection, recordSelection } from './localStorage';

const logger = logs('1193-connection');

export type ConnectionRequirements =
	| 'connection' // only connected to perform raw read-only calls, any network
	| 'connection+network' // connected to perform contract read-only call to supported network
	| 'connection+account' // connected to perform raw call, including write one, any network
	| 'connection+network+account'; // connected to perform contract read and write call to supported network

// TODO ABI type
type Abi = any[];
export type ContractsInfos = { [name: string]: { address: string; abi: Abi } };
export type NetworkConfig<ContractTypes extends ContractsInfos = ContractsInfos> = {
	chainId: string;
	name?: string;
	contracts: ContractTypes;
};

// TODO rethink this : or support array too ?
export type MultiNetworkConfigs<ContractTypes extends ContractsInfos = ContractsInfos> = {
	[chainId: string]: NetworkConfig<ContractTypes>;
};

export type NetworkConfigs<ContractTypes extends ContractsInfos = ContractsInfos> =
	| MultiNetworkConfigs<ContractTypes>
	| NetworkConfig<ContractTypes>
	| ((
			chainId: string
	  ) => Promise<NetworkConfig<ContractTypes> | MultiNetworkConfigs<ContractTypes>>);

export type ConnectionError = { title?: string; message: string; code: number };

type BaseConnectionState = {
	// executionRequireUserConfirmation?: boolean;
	error?: ConnectionError;
	toJSON?(): Partial<ConnectionState>;
};

export type ConnectedState = BaseConnectionState & {
	state: 'Connected';
	initialised: true;
	connecting: false;
	requireSelection: false;
	loadingModule: false;
	executing: boolean;
	walletType: { type: string; name?: string };
	provider: EIP1193Provider;
};

export type DisconnectedState = BaseConnectionState & {
	state: 'Disconnected';
	initialised: boolean; // COuld be an Idle state instead ?
	connecting: boolean;
	requireSelection: boolean;
	loadingModule: boolean;
	executing: false;
	walletType?: { type: string; name?: string };
	provider?: EIP1193Provider;
};

export type ConnectionState = ConnectedState | DisconnectedState;

// TODO types: <ContractTypes extends ContractsInfos = ContractsInfos>
export type NetworkState = DisconectedNetworkState | ConnectedNetworkState;

type BaseNetworkState = {
	error?: ConnectionError;
};

export type DisconectedNetworkState = BaseNetworkState & {
	state: 'Disconnected';
	fetchingChainId: boolean;
	chainId?: string;
	loading: boolean;
	notSupported: undefined | true;
	contracts: undefined;
};

export type ConnectedNetworkState = BaseNetworkState & {
	state: 'Connected';
	fetchingChainId: false;
	chainId: string;
	loading: false;
	notSupported: false;
	contracts: ContractsInfos;
};

type BaseAccountState = {
	error?: ConnectionError;
};

export type AccountState = ConnectedAccountState | DisconnectedAccountState;

export type ConnectedAccountState = BaseAccountState & {
	state: 'Connected';
	locked: false;
	unlocking: false;
	address: string; // `0x${string}`;
};

export type DisconnectedAccountState = BaseAccountState & {
	state: 'Disconnected';
	locked: boolean;
	unlocking: boolean;
	address?: string; // keep it as before
};

export type OnConnectionExecuteState = {
	connection: ConnectedState;
};
export type ConnectAndExecuteCallback<T> = (state: OnConnectionExecuteState) => Promise<T>;

export type OnExecuteState = {
	connection: ConnectedState;
	account: ConnectedAccountState;
	network: ConnectedNetworkState;
};
export type ExecuteCallback<T> = (state: OnExecuteState) => Promise<T>;

export type ConnectionConfig = {
	options?: (string | Web3WModule | Web3WModuleLoader)[];
	autoConnectUsingPrevious?: boolean;
	networks?: NetworkConfigs;
};

export function init(config: ConnectionConfig) {
	// ----------------------------------------------------------------------------------------------
	// Arguments Consumption
	// ----------------------------------------------------------------------------------------------
	const options =
		!config.options || config.options.length === 0 ? ['builtin'] : [...config.options];
	const optionsAsStringArray = options.map((m) => {
		if (typeof m === 'object') {
			if (!m.id) {
				throw new Error('options need to be string or have an id');
			}
			return m.id;
		}
		return m;
	});
	// ----------------------------------------------------------------------------------------------

	// ----------------------------------------------------------------------------------------------
	// private state
	// ----------------------------------------------------------------------------------------------
	let listening: boolean = false;
	let currentModule: Web3WModule | undefined;
	// ----------------------------------------------------------------------------------------------

	// ----------------------------------------------------------------------------------------------
	// STORES
	// ----------------------------------------------------------------------------------------------
	const builtin = createBuiltinStore(globalThis.window);

	const { $state, set, readable } = createStore<ConnectionState>({
		state: 'Disconnected',
		initialised: false,
		connecting: false,
		requireSelection: false,
		loadingModule: false,
		executing: false,
		provider: undefined,
		walletType: undefined,

		toJSON(): Partial<ConnectionState> {
			return <ConnectionState>{
				state: $state.state,
				initialised: $state.initialised,
				connecting: $state.connecting,
				requireSelection: $state.requireSelection,
				loadingModule: $state.loadingModule,
				executing: $state.executing,
				walletType: $state.walletType,
				error: $state.error,
			};
		},
	});

	const {
		$state: $network,
		set: setNetwork,
		readable: readableNetwork,
	} = createStore<NetworkState>({
		state: 'Disconnected',
		fetchingChainId: false,
		loading: false,
		chainId: undefined,
		notSupported: undefined,
		contracts: undefined,
	});
	const {
		$state: $account,
		set: setAccount,
		readable: readableAccount,
	} = createStore<AccountState>({
		state: 'Disconnected',
		locked: false,
		unlocking: false,
	});

	const { observers, pendingActions } = createPendingActionsStore();
	// ----------------------------------------------------------------------------------------------

	// ----------------------------------------------------------------------------------------------
	// function to create the provider
	// ----------------------------------------------------------------------------------------------
	function createProvider(ethereum: EIP1193Provider): EIP1193Provider {
		return wrapProvider(ethereum, observers);
	}
	// ----------------------------------------------------------------------------------------------

	// ----------------------------------------------------------------------------------------------
	// attempt to wrap window.ethereum so all request are captured, no matter how you want to handle it
	// ----------------------------------------------------------------------------------------------
	try {
		if (globalThis.window.ethereum) {
			// try to wrap the ethereum object if possible
			globalThis.window.ethereum = createProvider(globalThis.window.ethereum);
		}
	} catch (err) {
		logger.info(err);
	}
	// ----------------------------------------------------------------------------------------------

	function hasChainChanged(chainId: string): boolean {
		return chainId !== $network.chainId;
	}

	async function onChainChanged(chainId: string) {
		if (chainId === '0xNaN') {
			logger.warn('onChainChanged bug (return 0xNaN), Metamask bug?');
			if (!$state.provider) {
				throw new Error('no provider to get chainId');
			}
			chainId = await $state.provider.request({ method: 'eth_chainId' });
		}
		const chainIdAsDecimal = formatChainId(chainId);
		if (hasChainChanged(chainIdAsDecimal)) {
			logger.debug('onChainChanged', { chainId, chainIdAsDecimal });
			handleNetwork(chainIdAsDecimal);
		}
	}

	async function handleNetwork(chainId: string) {
		try {
			if (!config.networks) {
				setNetwork({
					state: 'Connected',
					chainId,
					notSupported: false,
					contracts: {},
				});
			} else {
				let networkConfigs = config.networks;
				if (typeof networkConfigs === 'function') {
					setNetwork({
						chainId,
						loading: true,
					});
					networkConfigs = await networkConfigs(chainId);
				}

				// TODO cache
				const contractsInfos = getContractInfos(networkConfigs, chainId);
				if (contractsInfos) {
					setNetwork({
						state: 'Connected',
						chainId,
						loading: false,
						notSupported: false,
						contracts: contractsInfos,
					});
				} else {
					setNetwork({
						state: 'Disconnected',
						chainId,
						loading: false,
						notSupported: true,
						contracts: undefined,
					});
				}
			}
			if (!$network.notSupported) {
				if ($account.state === 'Connected') {
					_connect.resolve('connection+network+account', true);
				} else {
					_connect.resolve('connection+network', true);
				}
			}
		} catch (err) {
			_connect.reject(['connection+network+account', 'connection+network'], err);
			throw err;
		}
	}

	async function pollAccountsChanged(callback: (accounts: string[]) => void) {
		while ($state.provider) {
			await wait(3000); // TODO config
			if (!listening) {
				break;
			}

			if (!$state.provider) {
				logger.error(`no provider anymore, but we are still listening !!!???`);
			}
			let accounts: string[] = [];
			try {
				accounts = await $state.provider.request({ method: 'eth_accounts' });
			} catch (err) {
				logger.error(err);
			}

			// logger.debug({ accounts }); // TODO remove
			if (hasAccountsChanged(accounts)) {
				try {
					callback(accounts);
				} catch (e) {
					logger.error(e);
					// TODO error in $connection.error ?
				}
			}
		}
	}

	function hasAccountsChanged(accounts: string[]): boolean {
		return accounts[0] !== $account.address;
		// TODO multi account support ?
	}

	async function onAccountsChanged(accounts: string[]) {
		if (!hasAccountsChanged(accounts)) {
			logger.debug('false account changed', accounts);
			return;
		}
		logger.debug('onAccountsChanged', { accounts }); // TODO
		const address = accounts[0];
		if (address) {
			setAccount({ state: 'Connected', locked: false, unlocking: false, address });
		} else {
			// we keep the last address here : ($account.address)
			setAccount({
				state: 'Disconnected',
				locked: true,
				address: $account.address,
			});
		}
		// TODO? nativeTOken balance, token balances ?
	}

	function listenForChanges() {
		if ($state.provider && !listening) {
			logger.log('LISTENNING');
			$state.provider.on('chainChanged', onChainChanged);
			$state.provider.on('accountsChanged', onAccountsChanged);

			listening = true;

			// still poll has accountsChanged does not seem to be triggered all the time
			// this issue was tested in Metamask back in web3w, // TOCHECK
			// in Brave this issue happen for lock when invoked first time, see : https://github.com/brave/brave-browser/issues/28688
			pollAccountsChanged(onAccountsChanged);
		}
	}

	function stopListeningForChanges() {
		if ($state.provider && listening) {
			logger.log('STOP LISTENNING');
			$state.provider.removeListener('chainChanged', onChainChanged);
			$state.provider.removeListener('accountsChanged', onAccountsChanged);
			listening = false;
		}
	}

	async function fetchChainId() {
		// TODO check if reseting to Disconnected is good here
		// for now we assert
		if ($network.state === 'Connected') {
			throw new Error(`supposed to fetch chain id only when disconnected`);
		}
		try {
			setNetwork({
				state: 'Disconnected',
				fetchingChainId: true,
				chainId: undefined,
				loading: false,
				notSupported: undefined,
				contracts: undefined,
			});
			const chainId = await $state.provider?.request({ method: 'eth_chainId' });
			if (chainId) {
				const chainIdAsDecimal = formatChainId(chainId);
				setNetwork({
					state: 'Disconnected',
					fetchingChainId: false,
					chainId: chainIdAsDecimal,
					loading: false,
					notSupported: undefined,
					contracts: undefined,
				});
			}
		} catch (err) {
			setNetwork({
				state: 'Disconnected',
				fetchingChainId: false,
				chainId: undefined,
				loading: false,
				notSupported: undefined,
				contracts: undefined,
			});
			throw err;
		}
	}

	async function select(type: string, config?: { moduleConfig?: any; autoUnlock: boolean }) {
		const { moduleConfig, autoUnlock: autoUnlockFromConfig } = config || { autoUnlock: true };
		const autoUnlock = autoUnlockFromConfig === undefined ? true : autoUnlockFromConfig;

		logger.log(`select...`);
		try {
			if ($state.state === 'Connected') {
				// disconnect first
				logger.log(`disconnecting for select...`);
				await disconnect();
			}

			let typeOrModule: string | Web3WModule | Web3WModuleLoader = type;

			if (!typeOrModule) {
				if (options.length === 0) {
					typeOrModule = 'builtin';
				} else if (options.length === 1) {
					typeOrModule = options[0];
				} else {
					const message = `No Wallet Type Specified, choose from ${optionsAsStringArray}`;
					// set(walletStore, {error: {message, code: 1}}); // TODO code
					throw new Error(message);
				}
			}
			if (
				typeOrModule == 'builtin' &&
				builtin.$state.state === 'Ready' &&
				!builtin.$state.available
			) {
				const message = `No Builtin Wallet`;
				// set(walletStore, {error: {message, code: 1}}); // TODO code
				throw new Error(message);
			} // TODO other type: check if module registered

			set({
				connecting: true,
			});
			if (typeOrModule === 'builtin') {
				logger.log(`probing window.ethereum...`);
				const builtinProvider = await builtin.probe();
				logger.log(builtinProvider);
				if (!builtinProvider) {
					const message = `no window.ethereum found!`;
					set({
						connecting: false,
						error: { message, code: 1 }, // TODO code
					});
					throw new Error(message);
				}

				set({
					requireSelection: false,
					walletType: { type, name: walletName(type) },
					provider: createProvider(builtinProvider),
				});

				currentModule = undefined;
			} else {
				let module: Web3WModule | Web3WModuleLoader | undefined;
				if (typeof typeOrModule === 'string') {
					if (options) {
						for (const choice of options) {
							if (typeof choice !== 'string' && choice.id === type) {
								module = choice;
							}
						}
					}
				} else {
					module = typeOrModule;
					type = module.id;
				}

				if (!module) {
					const message = `no module found: ${type}`;
					set({
						connecting: false,
						error: { message, code: 1 }, // TODO code
					});
					throw new Error(message);
				}

				try {
					set({
						loadingModule: true,
					});
					if ('load' in module) {
						// if (module.loaded) {
						//   module = module.loaded;
						// } else {

						module = await module.load();

						// }
					}

					logger.log(`setting up module`);
					const moduleSetup = await module.setup(moduleConfig); // TODO pass config in select to choose network

					set({
						loadingModule: false,
					});

					currentModule = module;
					await handleNetwork(moduleConfig.chainId);
					set({
						requireSelection: false,
						walletType: { type, name: walletName(type) },
						provider: createProvider(
							(moduleSetup as any).eip1193Provider || (moduleSetup as any).web3Provider
						),
					});
					logger.log(`module setup`);
				} catch (err) {
					currentModule = undefined;
					set({
						connecting: false,
						requireSelection: false,
						loadingModule: false,
					});
					_connect.reject('*', err);
					return;
					// TODO detect real errors vs cancellation
					// if ((err as any).message === 'USER_CANCELED') {
					// 	set({
					// 		connecting: false,
					// 		selected: undefined,
					// 		walletName: undefined,
					// 		loadingModule: false,
					// 	});
					// } else {
					// 	set({
					// 		error: { code: MODULE_ERROR, message: (err as any).message },
					// 		selected: undefined,
					// 		walletName: undefined,
					// 		connecting: false,
					// 		loadingModule: false,
					// 	});
					// }
					// throw err;
				}
			}

			if (!$state.provider || !$state.walletType) {
				const message = `no wallet found for wallet type ${type}`;
				set({
					connecting: false,
					error: { message, code: 1 }, // TODO code
				});
				throw new Error(message);
			}

			recordSelection(type);

			// TODO better naming/flow ?
			try {
				await fetchChainId();
			} catch (err) {
				// cannot fetch chainId, this means we are not connected
				set({
					connecting: false,
					walletType: $state.walletType,
					provider: $state.provider,
				});
				_connect.reject('*', err);
				return;
			}

			if (!$network.chainId) {
				const message = `no chainId set`;
				set({
					connecting: false,
					error: { message, code: 1 }, // TODO code
				});
				throw new Error(message);
			}

			// everything passed
			set({
				state: 'Connected',
				connecting: false,
				requireSelection: false,
				loadingModule: false,
				walletType: $state.walletType,
				provider: $state.provider,
				// error: undefined, // DO we need that ?
			});
			listenForChanges();
			_connect.resolve('connection', true);

			handleNetwork($network.chainId);
			handleAccount($state.provider, autoUnlock);
		} catch (err) {
			logger.log(`select error`, err);
			set({
				state: 'Disconnected',
				connecting: false,
				requireSelection: false,
				loadingModule: false,
				walletType: $state.walletType,
				provider: $state.provider,
				error: (err as any).message || err,
			});
			throw err;
		}
	}

	async function handleAccount(provider: EIP1193Provider, autoUnlock: boolean) {
		let accounts: string[];
		try {
			// TODO Metamask ?
			// if (type === 'builtin' && builtin.$state.vendor === 'Metamask') {
			// 	accounts = await timeout(4000, _ethersProvider.listAccounts(), {
			// 		error: `Metamask timed out. Please reload the page (see <a href="https://github.com/MetaMask/metamask-extension/issues/7221">here</a>)`,
			// 	}); // TODO timeout checks (Metamask, Portis)
			// } else {
			// TODO timeout warning

			try {
				// even with that issue 7221 remains
				// accounts =
				// 	(await waitReadyState().then(() => {
				// 		logger.log(`fetching accounts...`);
				// 		return $state.provider?.request({ method: 'eth_accounts' });
				// 	})) || [];
				logger.log(`fetching accounts...`);
				accounts = await provider.request({ method: 'eth_accounts' });
			} catch (err) {
				const errWithCode = err as { code: number; message: string };
				if (errWithCode.code === 4100) {
					logger.log(`4100 ${errWithCode.message || (errWithCode as any).name}`); // TOCHECK why name here ?
					// status-im throw such error if eth_requestAccounts was not called first
					accounts = [];
				} else if (errWithCode.code === -32500 && errWithCode.message === 'permission denied') {
					// TODO Opera
					// if (builtin.$state.vendor === 'Opera') {
					// 	logger.log(`permission denied (opera) crypto wallet not enabled?)`);
					// } else {
					// 	logger.log(`permission denied`);
					// }
					accounts = [];
				} else if (errWithCode.code === 4001) {
					// "No Frame account selected" (frame.sh)
					accounts = [];
				} else {
					throw err;
				}
			}
			logger.log(`accounts: ${accounts}`);
			// }
		} catch (err) {
			const errWithCode = err as { code: number; message: string };
			set({
				error: errWithCode, // TODO remove $account.error and $network.error ?
			});
			_connect.reject(['connection+account', 'connection+network+account'], err);
			throw err;
		}
		logger.debug({ accounts });
		const address = accounts && accounts[0];
		if (address) {
			setAccount({ state: 'Connected', locked: false, unlocking: false, address });
			if ($network.state === 'Connected') {
				_connect.resolve('connection+network+account', true);
			} else {
				_connect.resolve('connection+account', true);
			}
		} else {
			setAccount({ state: 'Disconnected', locked: true, unlocking: false, address: undefined });
			if (autoUnlock) {
				return unlock();
			}
		}
	}

	async function disconnect(): Promise<void> {
		stopListeningForChanges();
		setAccount({ state: 'Disconnected', locked: false, unlocking: false, address: undefined });
		setNetwork({
			state: 'Disconnected',
			fetchingChainId: false,
			chainId: undefined,
			loading: false,
			notSupported: undefined,
			contracts: undefined,
		});
		const moduleToDisconnect = currentModule;
		currentModule = undefined;
		set({
			state: 'Disconnected',
			connecting: false,
			requireSelection: false,
			loadingModule: false,
			executing: false,
			walletType: undefined,
			provider: undefined,
		});
		recordSelection('');
		if (moduleToDisconnect) {
			await moduleToDisconnect.disconnect();
		}
	}

	const _connect = createManageablePromiseWithId<boolean>();

	function connect(
		requirements: ConnectionRequirements = 'connection+network+account'
	): Promise<boolean> {
		return _connect.promise(requirements, async (resolve, reject) => {
			let type: string | undefined;
			if (!type) {
				if (optionsAsStringArray.length === 0) {
					type = 'builtin';
				} else if (optionsAsStringArray.length === 1) {
					type = optionsAsStringArray[0];
				}
			}
			if ($state.state === 'Connected') {
				if ($network.state === 'Connected') {
					if ($account.locked) {
						await unlock();
					}
				} else {
					if ($network.chainId) {
						await handleNetwork($network.chainId);
					} else {
						await fetchChainId();
						await handleNetwork($network.chainId as string); // should be good
					}
					if ($account.locked) {
						await unlock();
					}
				}
			} else {
				set({
					connecting: true,
				});
				if (!type) {
					await builtin.probe();
					set({
						requireSelection: true,
					});
				} else {
					select(type).catch((err) => {
						_connect.reject('*', err);
						throw err;
					});
				}
			}
		});
	}

	function cancel() {
		set({
			state: 'Disconnected',
			connecting: false,
			requireSelection: false,
			loadingModule: false,
			executing: false,
			walletType: undefined,
			provider: undefined,
		});
		// resolve all connection attempt as false, including execution
		_connect.resolve('*', false);
	}

	function walletName(type: string): string | undefined {
		return type === 'builtin' ? builtin.$state.vendor : type;
	}

	async function unlock() {
		if ($account.locked) {
			setAccount({
				state: 'Disconnected',
				locked: true,
				unlocking: true,
				address: $account.address,
			});
			let accounts: string[] | undefined;
			try {
				accounts = await $state.provider?.request({ method: 'eth_requestAccounts' });
				accounts = accounts || [];
			} catch (err) {
				const errWithCode = err as EIP1193ProviderRpcError;
				switch ($state.walletType?.name) {
					case 'Metamask':
						if (
							errWithCode.code === -32002 &&
							// TODO do not make this dependent on message but need to ensure 32002 will not be triggered there for other cases
							(errWithCode.message.includes(
								'Already processing eth_requestAccounts. Please wait.'
							) ||
								errWithCode.message.includes(
									`Request of type 'wallet_requestPermissions' already pending`
								))
						) {
							set({
								error: {
									message: `To unlock your wallet, please click on the Metamask add-on's icon and unlock from there.`,
									code: 10000,
								},
							});
							// we ignore the error
							_connect.resolve(['connection+account', 'connection+network+account'], false);
							return;
						}
						break;
					case 'Brave':
						if (
							errWithCode.code === 4001 &&
							// TODO this is silly, Brave reject this error if the lock screen is dismissed, yet it does not even highlight that a request was there, like Metamask do
							errWithCode.message.includes('The user rejected the request.')
						) {
							set({
								error: {
									message: `To unlock your wallet, please click on the Brave wallet's icon and unlock from there.`,
									code: 1000,
								},
							});
							// we ignore the error
							_connect.resolve(['connection+account', 'connection+network+account'], false);
							return;
						}
						break;
				}

				logger.error(err); // TODO Frame account selection ?
				accounts = [];
			}
			if (accounts.length > 0) {
				const address = accounts[0];
				setAccount({ state: 'Connected', locked: false, unlocking: false, address });
				logger.log('SETUP_CHAIN from unlock');
				if ($network.state === 'Connected') {
					_connect.resolve('connection+network+account', true);
				} else {
					_connect.resolve('connection+account', true);
				}

				// await setupChain(address, true); // TODO try catch ?
			} else {
				setAccount({ state: 'Disconnected', locked: true, unlocking: false, address: undefined });
				_connect.resolve(['connection+account', 'connection+network+account'], false);
			}
		} else {
			const message = `Not Locked`;
			_connect.reject(['connection+account', 'connection+network+account'], { message, code: 1 }); // TODO code
			throw new Error(message);
		}
	}

	async function connectAndExecute<T>(
		callback: ConnectAndExecuteCallback<T>
	): Promise<T | undefined> {
		if ($state.state === 'Connected') {
			return callback({
				connection: $state as ConnectedState,
			});
		}
		return new Promise((resolve, reject) => {
			connect('connection')
				.then((connected) => {
					if (connected) {
						callback({
							connection: $state as unknown as ConnectedState, // this is because connected means we are in "Connected" state // TODO double check or assert
						}).then(resolve);
					} else {
						resolve(undefined); // resolve silently without executing
						// reject(new Error(`not connected`));
					}
				})
				.catch((err) => {
					reject(err);
				});
		});
	}

	async function execute<T>(
		callback: ExecuteCallback<T>
		//options?: { requireUserConfirmation?: boolean }
	): Promise<T | undefined> {
		set({ executing: true });
		if (
			$state.state === 'Connected' &&
			$network.state === 'Connected' &&
			$account.state === 'Connected'
		) {
			// TODO remove this or above (above should be another state : executeRequirements or we could have a separate store for execution)
			set({ executing: true });
			return callback({
				connection: $state as ConnectedState,
				account: $account as ConnectedAccountState,
				network: $network as ConnectedNetworkState,
			}).finally(() => {
				set({ executing: false });
			});
		}
		// if (options?.requireUserConfirmation) {
		// 	set({ executionRequireUserConfirmation: true });
		// }
		return new Promise((resolve, reject) => {
			connect('connection+network+account')
				.then((connected) => {
					if (connected) {
						// TODO remove this or above (above should be another state : executeRequirements or we could have a separate store for execution)
						set({ executing: true });
						callback({
							connection: $state as unknown as ConnectedState, // this is because connected means we are in "Connected" state // TODO double check or assert
							account: $account as ConnectedAccountState,
							network: $network as ConnectedNetworkState,
						})
							.finally(() => {
								set({ executing: false });
							})
							.then(resolve);
					} else {
						set({ executing: false });
						resolve(undefined); // resolve silently without executing
						// reject(new Error(`not connected`));
					}
				})
				.catch((err) => {
					set({ executing: false });
					reject(err);
				});
		});
	}

	async function switchTo(
		chainId: string,
		config?: {
			rpcUrls?: string[];
			blockExplorerUrls?: string[];
			chainName?: string;
			iconUrls?: string[];
			nativeCurrency?: {
				name: string;
				symbol: string;
				decimals: number;
			};
		}
	) {
		if (!$state.provider) {
			// TODO? autoConnect ?
			throw new Error(`no provider setup`);
		}
		try {
			// attempt to switch...
			await $state.provider.request({
				method: 'wallet_switchEthereumChain',
				params: [
					{
						chainId: '0x' + parseInt(chainId).toString(16),
					},
				],
			});
		} catch (err) {
			if ((err as any).code === 4902) {
				if (config && config.rpcUrls && config.rpcUrls.length > 0) {
					try {
						await $state.provider.request({
							method: 'wallet_addEthereumChain',
							params: [
								{
									chainId: '0x' + parseInt(chainId).toString(16),
									rpcUrls: config.rpcUrls,
									chainName: config.chainName,
									blockExplorerUrls: config.blockExplorerUrls,
									iconUrls: config.iconUrls,
									nativeCurrency: config.nativeCurrency,
								},
							],
						});
					} catch (err) {
						if ((err as any).code !== 4001) {
							set({
								error: err as any, // TODO
							});
						} else {
							return;
						}
					}
				} else {
					set({
						error: {
							code: 1, // TODO CHAIN_NOT_AVAILABLE_ON_WALLET,
							message: 'Chain not available on your wallet',
						},
					});
				}
			} else {
				if ((err as any).code !== 4001) {
					set({
						error: err as any, // TODO
					});
				} else {
					return;
				}
			}
		}
	}

	async function autoStart() {
		let timeout: NodeJS.Timeout | undefined;
		try {
			timeout = setTimeout(() => {
				// set({
				// 	initialised: true,
				// 	error: {
				// 		code: 7221,
				// 		message: 'Your wallet seems to not respond, please reload.',
				// 	},
				// });
				set({ initialised: true, connecting: false });
			}, 2000);
			const type = fetchPreviousSelection();
			if (type && type !== '') {
				await select(type, { autoUnlock: false });
			}
		} finally {
			clearTimeout(timeout);
			set({
				initialised: true,
			});
		}
	}

	if (typeof window !== 'undefined') {
		if (config.autoConnectUsingPrevious) {
			autoStart();
		} else {
			set({
				initialised: true,
			} as any); // TODO ensure we can set initilaized alone
		}
	}

	// TODO reorg
	// connection, renamed to web3 ?
	// global object for
	// - `execute`
	// - builtin ?
	// - errors ?
	// - options
	// - connect ?
	return {
		connection: {
			...readable,
			acknowledgeError() {
				set({ error: undefined, unlocking: false } as any); // TODO Remove any
			},
			// confirmExecution() {
			// 	set({ executionRequireUserConfirmation: false });
			// },
			// TODO cancelExecution
			builtin,
			connect,
			select,
			cancel,
			disconnect,
			// connectAndExecute, // TODO rename
			options: optionsAsStringArray,
		},
		network: {
			...readableNetwork,
			switchTo,
		},
		account: {
			...readableAccount,
			unlock,
			// TODO cancel?
		},
		pendingActions,
		execute,
	};
}
