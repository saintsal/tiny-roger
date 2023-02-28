export type EIP1193TransactionRequest = {
	readonly method: 'eth_sendTransaction';
	params: [EIP1193TransactionData];
};

export type EIP1193LegacySignRequest = {
	readonly method: 'eth_sign';
	params: [string, string]; // from, hex
};
export type EIP1193PersonalSignRequest = {
	readonly method: 'personal_sign';
	params: [string, string]; // hex, from
};

export type EIP1193PTypedSignv4Request = {
	readonly method: 'eth_signTypedData_v4';
	params: [string, { [field: string]: any }]; // from, json
};

export type EIP1193PTypedSignRequest = {
	readonly method: 'eth_signTypedData';
	params: [string, { [field: string]: any }]; // from, json
};

export type EIP1193SignTransactionRequest = {
	readonly method: 'eth_signTransaction';
	params: [string];
};

export type EIP1193GenericRequest = {
	readonly method: string;
	readonly params?: readonly unknown[] | object;
};

export type EIP1193ChainIdRequest = { method: 'eth_chainId' };
export type EIP1193AccountsRequest = { method: 'eth_accounts' };
export type EIP1193RequestAccountsRequest = { method: 'eth_requestAccounts' };

export type ERIP1193SwitchChainRequest = {
	method: 'wallet_switchEthereumChain';
	params: [
		{
			chainId: string; // TODO `0x${string}`
		}
	];
};
export type ERIP1193AddChainRequest = {
	method: 'wallet_addEthereumChain';
	params: [
		{
			chainId: string; // TODO `0x${string}`
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
	];
};

export type EIP1193Request =
	| EIP1193TransactionRequest
	| EIP1193LegacySignRequest
	| EIP1193PersonalSignRequest
	| EIP1193PTypedSignv4Request
	| EIP1193PTypedSignRequest
	| EIP1193ChainIdRequest
	| EIP1193AccountsRequest
	| EIP1193RequestAccountsRequest
	| ERIP1193AddChainRequest
	| ERIP1193SwitchChainRequest;

export interface EIP1193ProviderRpcError extends Error {
	message: string;
	code: number;
	data?: unknown;
}

export interface EIP1193ProviderMessage {
	readonly type: string;
	readonly data: unknown;
}

export interface EIP1193EthSubscription extends EIP1193ProviderMessage {
	readonly type: 'eth_subscription';
	readonly data: {
		readonly subscription: string;
		readonly result: unknown;
	};
}

type EIP1193BaseTransactionData = {
	gas?: string;
	gasPrice?: string;
	value?: string;
	data?: string;
	nonce?: string;
};

export type EIP1193TransactionData =
	| EIP1193NormalTransactionData
	| EIP1193TransactionContractCreationData;

export type EIP1193NormalTransactionData = EIP1193BaseTransactionData & {
	from: string;
	to: string;
};

export type EIP1193TransactionContractCreationData = EIP1193BaseTransactionData & {
	from: string;
	data: string;
};

export interface EIP1193ProviderConnectInfo {
	readonly chainId: string;
}

/*
4001	User Rejected Request	The user rejected the request.
4100	Unauthorized	The requested method and/or account has not been authorized by the user.
4200	Unsupported Method	The Provider does not support the requested method.
4900	Disconnected	The Provider is disconnected from all chains.
4901	Chain Disconnected	The Provider is not connected to the requested chain.
*/

type Listener<Message> = (message: Message) => unknown | Promise<unknown>;

export interface EIP1193Provider {
	on(
		eventName: 'message' | 'disconnect',
		listener: Listener<EIP1193ProviderMessage | EIP1193EthSubscription>
	): EIP1193Provider;
	on(eventName: 'accountsChanged', listener: Listener<string[]>): EIP1193Provider;
	on(eventName: 'chainChanged', listener: Listener<string>): EIP1193Provider;
	on(eventName: 'connect', listener: Listener<EIP1193ProviderConnectInfo>): EIP1193Provider;
	removeListener(
		eventName: string | symbol,
		listener:
			| Listener<string>
			| Listener<string[]>
			| Listener<EIP1193ProviderMessage | EIP1193EthSubscription | EIP1193ProviderConnectInfo>
	): EIP1193Provider;
	request(args: EIP1193ChainIdRequest): Promise<string>;
	request(args: EIP1193AccountsRequest): Promise<string[]>;
	request(args: EIP1193RequestAccountsRequest): Promise<string[]>;
	request(args: EIP1193LegacySignRequest): Promise<string[]>;
	request(args: EIP1193PersonalSignRequest): Promise<string[]>;
	request(args: EIP1193PTypedSignv4Request): Promise<string[]>;
	request(args: EIP1193PTypedSignRequest): Promise<string[]>;
	request(args: EIP1193TransactionRequest): Promise<string>;
	request(args: EIP1193Request): Promise<unknown>;
}

export type EIP1193Block = {
	number: string;
	// TODO more
};

export type EIP1193Account = string;
export type EIP1193Accounts = string[];
