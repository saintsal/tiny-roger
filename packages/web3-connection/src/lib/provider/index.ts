import type {
	EIP1193Provider,
	EIP1193TransactionData,
	EIP1193Request,
	EIP1193TransactionRequest,
} from '$lib/types/eip1193';

export type EIP1193TransactionRequestWithMetadata = {
	readonly method: 'eth_sendTransaction';
	params: [EIP1193TransactionData, any];
};

export type EIP1193TransactionWithMetadata = EIP1193TransactionData & {
	metadata?: any;
};

export type SignatureRequest = { from: string; message: unknown; metadata?: any };

export interface EIP1193Observers {
	onTxRequested?: (tx: EIP1193TransactionWithMetadata) => void;
	onTxCancelled?: (tx: EIP1193TransactionWithMetadata) => void;
	onTxSent?: (tx: EIP1193TransactionWithMetadata, hash: string) => void;
	onSignatureRequest?: (request: SignatureRequest) => void;
	onSignatureCancelled?: (request: SignatureRequest) => void;
	onSignatureResponse?: (request: SignatureRequest, signature: string) => void;
}

export function wrapProvider(
	ethereum: EIP1193Provider,
	observers: EIP1193Observers
): EIP1193Provider {
	let currentObservers = observers;
	if ((ethereum as any).__web3_connection__) {
		// do not rewrap if already an 1193 Proxy, but set the new observers
		(ethereum as any).setObservers(observers);
		return ethereum;
	}

	let nextMetadata: any | undefined;

	async function handleSignedMessage(
		args: EIP1193Request,
		from: string,
		message: unknown,
		metadata?: any
	) {
		if (!metadata) {
			if (nextMetadata) {
				metadata = nextMetadata;
				nextMetadata = undefined;
			}
		} else if (nextMetadata) {
			throw new Error(
				`conflicting metadata, metadata was set via "setNextMetadata" but it was also provided as part of the request data`
			);
		}

		let messageWithMetadata = { from, message, metadata };

		if (currentObservers?.onSignatureRequest) {
			currentObservers?.onSignatureRequest(messageWithMetadata);
		}

		try {
			const signature = (await _request(args)) as string;

			if (currentObservers?.onSignatureResponse) {
				currentObservers?.onSignatureResponse(messageWithMetadata, signature);
			}

			return signature;
		} catch (err) {
			if (currentObservers?.onSignatureCancelled) {
				currentObservers?.onSignatureCancelled(messageWithMetadata);
			}
			throw err;
		}
	}

	function getMetadata(metadataArg: unknown) {
		let metadata = metadataArg;
		if (!metadata) {
			if (nextMetadata) {
				metadata = nextMetadata;
				nextMetadata = undefined;
			}
		} else if (nextMetadata) {
			throw new Error(
				`conflicting metadata, metadata was set via "setNextMetadata" but it was also provided as part of the request data`
			);
		}
	}

	function _request(args: EIP1193Request): Promise<unknown> {
		if (ethereum.request) {
			return ethereum.request(args);
		} else {
			const ethereumSendAsync = ethereum as unknown as {
				sendAsync: (
					request: { method: string; params?: Array<any> },
					callback: (error: any, response: any) => void
				) => void;
				enable?(): Promise<unknown>;
			};
			const ethereumSend = ethereum as unknown as {
				send: (
					request: { method: string; params?: Array<any> },
					callback: (error: any, response: any) => void
				) => void;
				enable?(): Promise<unknown>;
			};
			if (ethereumSendAsync.sendAsync) {
				return new Promise<unknown>((resolve, reject) => {
					if (args.method === 'eth_requestAccounts' && ethereumSendAsync.enable) {
						ethereumSendAsync.enable().then(resolve);
					} else {
						ethereumSendAsync.sendAsync(args, (error: any, response: unknown) => {
							if (error) {
								reject(error);
							} else {
								resolve(
									(response as any).id && (response as any).result
										? (response as any).result
										: response
								);
							}
						});
					}
				});
			} else if (ethereumSend.send) {
				return new Promise<unknown>((resolve, reject) => {
					if (args.method === 'eth_requestAccounts' && ethereumSendAsync.enable) {
						ethereumSendAsync.enable().then(resolve);
					} else {
						ethereumSend.send(args, (error: any, response: unknown) => {
							if (error) {
								reject(error);
							} else {
								resolve(
									(response as any).id && (response as any).result
										? (response as any).result
										: response
								);
							}
						});
					}
				});
			} else {
				return Promise.reject();
			}

			// const ethereumSendAsync = ethereum as unknown as {
			// 	sendAsync(request: Object, callback: Function): void;
			// };
			// const ethereumSend = ethereum as unknown as {
			// 	send(method: String, params: any[]): Promise<unknown>;
			// };
			// if (ethereumSendAsync.sendAsync) {
			// 	return new Promise<unknown>((resolve, reject) => {
			// 		ethereumSendAsync.sendAsync(args, (response: unknown, error: any) => {
			// 			if (error) {
			// 				reject(error);
			// 			} else {
			// 				resolve(response);
			// 			}
			// 		});
			// 	});
			// } else if (ethereumSend.send) {
			// 	return ethereumSend.send(args.method, (args as any).params || []).then((v) => {
			// 		console.log({ v });
			// 		return v;
			// 	});
			// } else {
			// 	return Promise.reject();
			// }
		}
	}

	async function request(args: EIP1193Request) {
		switch (args.method) {
			case 'eth_sendTransaction':
				const tx = args.params[0];
				const metadata = getMetadata(
					(args as unknown as EIP1193TransactionRequestWithMetadata).params[1]
				);

				let txWithMetadata = { ...tx, metadata };

				if (currentObservers?.onTxRequested) {
					currentObservers?.onTxRequested(txWithMetadata);
				}

				try {
					const hash = await _request({ method: args.method, params: [tx] });

					if (currentObservers?.onTxSent) {
						currentObservers?.onTxSent(txWithMetadata, hash as string);
					}

					return hash;
				} catch (err) {
					if (currentObservers?.onTxCancelled) {
						currentObservers?.onTxCancelled(txWithMetadata);
					}
					throw err;
				}
			case 'eth_sign':
				return handleSignedMessage(
					args,
					args.params[0],
					args.params[1],
					getMetadata((args as any).params[2])
				);
			case 'personal_sign':
				// Note: we reverse the order of param here as personal_sign expect from as 2nd param
				return handleSignedMessage(
					args,
					args.params[1],
					args.params[0],
					getMetadata((args as any).params[2])
				);
			case 'eth_signTypedData':
				return handleSignedMessage(
					args,
					args.params[0],
					args.params[1],
					getMetadata((args as any).params[2])
				);
			case 'eth_signTypedData_v4':
				return handleSignedMessage(
					args,
					args.params[0],
					args.params[1],
					getMetadata((args as any).params[2])
				);
		}

		// TODO handle unlocking via 'eth_requestAccounts ?

		return _request(args);
	}

	function setNextMetadata(metadata: any) {
		if (nextMetadata) {
			throw new Error(`previous metadata was not consumed. Please resolve the issue.`);
		}
	}

	function setObservers(observers: EIP1193Observers) {
		currentObservers = observers;
	}

	return new Proxy(ethereum, {
		get: function (target, property, receiver) {
			switch (property) {
				case 'request':
					return request;
				case 'setNextMetadata':
					return setNextMetadata;
				case '__web3_connection__':
					return true;
				case 'setObservers':
					return setObservers;
			}
			return (target as any)[property];
		},
	});
}
