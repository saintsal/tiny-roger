export interface EIP1193RequestArguments {
	readonly method: string;
	readonly params?: readonly unknown[] | object;
}

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
	request(args: { method: 'eth_chainId' }): Promise<string>;
	request(args: { method: 'eth_accounts' }): Promise<string[]>;
	request(args: { method: 'eth_requestAccounts' }): Promise<string[]>;
	request(args: EIP1193RequestArguments): Promise<unknown>;
}

export type EIP1193Block = {
	number: string;
	// TODO more
};

export type EIP1193Account = string;
export type EIP1193Accounts = string[];
