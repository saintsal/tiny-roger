import type { EIP1193Provider, EIP1193ProviderRpcError } from '$lib/types/eip1193';
import type { Web3WModule, Web3WModuleLoader } from '$lib/types/modules';
import { MODULE_ERROR } from '$lib/utils/errors';
import { createStore } from '$lib/utils/stores';
import { createBuiltinStore } from './builtin';
import { logs } from 'named-logs';
import { wait } from '$lib/utils/time';
import { browser } from '$app/environment';
import { formatChainId } from '$lib/utils/ethereum';
import { wrapProvider } from '$lib/provider';

const logger = logs('1193-connection');

export type ConnectionState = {
	state: 'Idle' | 'Locked' | 'Ready';
	connecting: boolean;
	unlocking: boolean;
	loadingModule?: boolean;
	provider?: EIP1193Provider;
	chainId?: string;
	address?: string;
	options: string[];
	selected?: string;
	currentModule?: Web3WModule;
	error?: { title?: string; message: string; code: number };
	listenning: boolean;
	walletName?: string;
	requireSelection: boolean;
	initialised: boolean; // to avoid flash by not displaying connect button until this is executed
	toJSON(): Partial<ConnectionState>;
};

export type ConnectionConfig = {
	options?: (string | Web3WModule | Web3WModuleLoader)[];
};

// let LOCAL_STORAGE_TRANSACTIONS_SLOT = '_web3w_transactions';
let LOCAL_STORAGE_PREVIOUS_WALLET_SLOT = '_web3w_previous_wallet_type';
function recordSelection(type: string) {
	try {
		localStorage.setItem(LOCAL_STORAGE_PREVIOUS_WALLET_SLOT, type);
	} catch (e) {}
}

function fetchPreviousSelection() {
	try {
		return localStorage.getItem(LOCAL_STORAGE_PREVIOUS_WALLET_SLOT);
	} catch (e) {
		return null;
	}
}

export function init(config: ConnectionConfig) {
	const options = config.options || ['builtin'];
	try {
		if (globalThis.window.ethereum) {
			// try to wrap the ethereum object if possible
			globalThis.window.ethereum = wrapProvider(globalThis.window.ethereum, {
				onSignatureRequest: console.log,
			});
		}
	} catch (err) {
		logger.info(err);
	}
	const builtin = createBuiltinStore(globalThis.window);

	const { $state, set, readable } = createStore<ConnectionState>({
		state: 'Idle',
		options: options.map((m) => {
			if (typeof m === 'object') {
				if (!m.id) {
					throw new Error('options need to be string or have an id');
				}
				return m.id;
			}
			return m;
		}),
		connecting: false,
		listenning: false,
		requireSelection: false,
		unlocking: false,
		initialised: false,

		toJSON(): Partial<ConnectionState> {
			return {
				state: $state.state,
				connecting: $state.connecting,
				unlocking: $state.unlocking,
				loadingModule: $state.loadingModule,
				chainId: $state.chainId,
				address: $state.address,
				options: $state.options,
				selected: $state.selected,
				error: $state.error,
				listenning: $state.listenning,
				walletName: $state.walletName,
				requireSelection: $state.requireSelection,
				initialised: $state.initialised,
			};
		},
	});

	function hasChainChanged(chainId: string): boolean {
		return chainId !== $state.chainId;
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
			set({ chainId: chainIdAsDecimal });
		}
	}

	async function pollAccountsChanged(callback: (accounts: string[]) => void) {
		while ($state.provider) {
			await wait(3000); // TODO config
			if (!$state.listenning) {
				break;
			}

			let accounts: string[] = [];
			try {
				accounts = await $state.provider.request({ method: 'eth_accounts' });
			} catch (e) {}

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
		return accounts[0] !== $state.address;
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
			set({ address, state: 'Ready', error: undefined });
		} else {
			set({ address: undefined, state: 'Locked', error: undefined });
		}
		// TODO balance ?
	}

	function listenForChanges() {
		if ($state.provider && !$state.listenning) {
			logger.log('LISTENNING');
			$state.provider.on('chainChanged', onChainChanged);
			$state.provider.on('accountsChanged', onAccountsChanged);

			set({ listenning: true });

			// still poll has accountsChanged does not seem to be triggered all the time
			// this issue was tested in Metamask back in web3w, // TOCHECK
			// in Brave this issue happen for lock when invoked first time, see : https://github.com/brave/brave-browser/issues/28688
			pollAccountsChanged(onAccountsChanged);
		}
	}

	function stopListeningForChanges() {
		if ($state.provider && $state.listenning) {
			logger.log('STOP LISTENNING');
			$state.provider.removeListener('chainChanged', onChainChanged);
			$state.provider.removeListener('accountsChanged', onAccountsChanged);
			set({ listenning: false });
		}
	}

	async function fetchChainId() {
		try {
			const chainId = await $state.provider?.request({ method: 'eth_chainId' });
			if (chainId) {
				const chainIdAsDecimal = formatChainId(chainId);
				set({ chainId: chainIdAsDecimal });
			}
		} catch (e) {}
	}

	async function select(type: string, moduleConfig?: any) {
		try {
			if ($state.selected && ($state.state === 'Ready' || $state.state === 'Locked')) {
				// disconnect first
				await disconnect();
			}

			let typeOrModule: string | Web3WModule | Web3WModuleLoader = type;

			if (!typeOrModule) {
				if (options.length === 0) {
					typeOrModule = 'builtin';
				} else if (options.length === 1) {
					typeOrModule = options[0];
				} else {
					const message = `No Wallet Type Specified, choose from ${$state.options}`;
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

			set({ connecting: true });
			if (typeOrModule === 'builtin') {
				const provider = await builtin.probe();
				set({
					requireSelection: false,
					address: undefined,
					selected: type,
					state: 'Idle',
					provider,
					currentModule: undefined,
					walletName: walletName(type),
					error: undefined,
				});
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
						requireSelection: false,
						error: { message, code: 1 },
						selected: undefined,
						walletName: undefined,
						connecting: false,
					}); // TODO code
					throw new Error(message);
				}

				try {
					if ('load' in module) {
						// if (module.loaded) {
						//   module = module.loaded;
						// } else {
						set({ loadingModule: true });
						module = await module.load();
						set({ loadingModule: false });
						// }
					}
					logger.log(`setting up module`);
					const { eip1193Provider } = await module.setup(moduleConfig); // TODO pass config in select to choose network
					set({
						address: undefined,
						selected: type,
						state: 'Idle',
						walletName: walletName(type),
						provider: eip1193Provider,
						currentModule: module,
						error: undefined,
					});
					logger.log(`module setup`);
				} catch (err) {
					if ((err as any).message === 'USER_CANCELED') {
						set({
							connecting: false,
							selected: undefined,
							walletName: undefined,
							loadingModule: false,
						});
					} else {
						set({
							error: { code: MODULE_ERROR, message: (err as any).message },
							selected: undefined,
							walletName: undefined,
							connecting: false,
							loadingModule: false,
						});
					}
					throw err;
				}
			}

			if (!$state.provider) {
				const message = `no provider found for wallet type ${type}`;
				set({
					error: { message, code: 1 }, // TODO code
					selected: undefined,
					walletName: undefined,
					connecting: false,
				});
				throw new Error(message);
			}

			// TODO ?
			// listenForConnection();

			let accounts: string[];
			try {
				// TODO Metamask ?
				// if (type === 'builtin' && builtin.$state.vendor === 'Metamask') {
				// 	accounts = await timeout(4000, _ethersProvider.listAccounts(), {
				// 		error: `Metamask timed out. Please reload the page (see <a href="https://github.com/MetaMask/metamask-extension/issues/7221">here</a>)`,
				// 	}); // TODO timeout checks (Metamask, Portis)
				// } else {
				// TODO timeout warning
				logger.log(`fetching accounts...`);
				try {
					accounts = await $state.provider.request({ method: 'eth_accounts' });
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
				set({ error: errWithCode, selected: undefined, walletName: undefined, connecting: false });
				throw err;
			}
			logger.debug({ accounts });
			recordSelection(type);
			fetchChainId();
			const address = accounts && accounts[0];
			if (address) {
				set({
					address,
					state: 'Ready',
					connecting: false,
					error: undefined,
				});
				listenForChanges();
				logger.log('SETUP_CHAIN from select');
				// await setupChain(address, false);
			} else {
				listenForChanges();
				set({
					address: undefined,
					state: 'Locked',
					connecting: false,
					error: undefined,
				});
			}
		} catch (err) {
			set({ connecting: false, error: (err as any).message || err });
			throw err;
		}
	}

	async function disconnect(): Promise<void> {
		stopListeningForChanges();
		set({
			connecting: false,
			error: undefined,
			selected: undefined,
			chainId: undefined,
			state: 'Idle',
		});
	}

	let connect_resolve: (() => void) | undefined;
	let connect_reject: ((err: unknown) => void) | undefined;
	function resolve_connect() {
		const resolve = connect_resolve;
		connect_resolve = undefined;
		connect_reject = undefined;
		if (resolve) {
			resolve();
		}
	}
	function reject_connect(err: unknown) {
		const reject = connect_reject;
		connect_resolve = undefined;
		connect_reject = undefined;
		if (reject) {
			reject(err);
		}
	}
	function connect(): Promise<void> {
		return new Promise<void>(async (resolve, reject) => {
			let type: string | undefined;
			if (!type) {
				if ($state.options.length === 0) {
					type = 'builtin';
				} else if ($state.options.length === 1) {
					type = $state.options[0];
				}
			}
			if (!type) {
				set({ connecting: true });
				await builtin.probe();
				set({ requireSelection: true });
				connect_resolve = resolve;
				connect_reject = reject;
			} else {
				set({ connecting: true });
				select(type)
					.catch((err) => {
						reject_connect(err);
						throw err;
					})
					.then(() => {
						resolve_connect();
						if ($state.state === 'Locked') {
							return unlock();
						}
					});
			}
		});
	}

	function cancel() {
		set({ requireSelection: false, connecting: false });
		resolve_connect();
	}

	function walletName(type: string): string | undefined {
		return type === 'builtin' ? builtin.$state.vendor : type;
	}

	async function unlock() {
		if ($state.state === 'Locked') {
			set({ unlocking: true });
			let accounts: string[] | undefined;
			try {
				accounts = await $state.provider?.request({ method: 'eth_requestAccounts' });
				accounts = accounts || [];
			} catch (err) {
				const errWithCode = err as EIP1193ProviderRpcError;
				switch ($state.walletName) {
					case 'Metamask':
						if (
							errWithCode.code === -32002 &&
							// TODO do not make this dependent on message but need to ensure 32002 will not be triggered there for other cases
							errWithCode.message.includes('Already processing eth_requestAccounts. Please wait.')
						) {
							set({
								error: {
									message: `To unlock your wallet, please click on the Metamask add-on's icon and unlock from there.`,
									code: 10000,
								},
							});
							// we ignore the error
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
							return;
						}
						break;
				}

				logger.error(err); // TODO Frame account selection ?
				accounts = [];
			}
			if (accounts.length > 0) {
				const address = accounts[0];
				set({
					address,
					state: 'Ready',
					unlocking: false,
					error: undefined,
				});
				logger.log('SETUP_CHAIN from unlock');
				// await setupChain(address, true); // TODO try catch ?
			} else {
				set({ unlocking: false });

				return;
			}
			return;
		} else {
			throw new Error(`Not Locked`);
		}
	}

	async function autoStart() {
		const type = fetchPreviousSelection();
		if (type && type !== '') {
			await select(type);
		}
	}

	if (browser) {
		// if (config.autoSelectPrevious) {
		autoStart();
		// }
		set({ initialised: true });
	}

	return {
		...readable,
		acknowledgeError() {
			set({ error: undefined, unlocking: false });
		},
		builtin,
		connect,
		select,
		cancel,
		disconnect,
		unlock,
	};
}
