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

export type EIP1193TransactionSent = EIP1193TransactionWithMetadata & {
	hash: string;
};

export type SignatureRequest = { from: string; message: unknown; metadata?: any };
export type SignatureResponse = {
	from: string;
	message: unknown;
	signature: string;
	metadata?: any;
};

export interface EIP1193Observers {
	onTxRequested?: (txData: EIP1193TransactionWithMetadata) => void;
	onTxCancelled?: (txData: EIP1193TransactionWithMetadata) => void;
	onTxSent?: (tx: EIP1193TransactionSent) => void;
	onSignatureRequest?: (fsignature: SignatureRequest) => void;
	onSignatureCancelled?: (sigRequest: SignatureRequest) => void;
	onSignatureResponse?: (sigResponse: SignatureResponse) => void;
}

export function wrapProvider(
	ethereum: EIP1193Provider,
	observers: EIP1193Observers
): EIP1193Provider {
	let currentObservers = observers;
	if ((ethereum as any).__1193__) {
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
			const signature = (await ethereum.request(args)) as string;

			if (currentObservers?.onSignatureResponse) {
				currentObservers?.onSignatureResponse({ ...messageWithMetadata, signature });
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

	async function request(args: EIP1193Request) {
		switch (args.method) {
			case 'eth_sendTransaction':
				const tx = args.params[0];
				const metadata = getMetadata(
					(tx as unknown as EIP1193TransactionRequestWithMetadata).params[1]
				);

				let txWithMetadata = { ...tx, metadata };

				if (currentObservers?.onTxRequested) {
					currentObservers?.onTxRequested(txWithMetadata);
				}

				try {
					const hash = await ethereum.request({ method: args.method, params: [tx] });

					if (currentObservers?.onTxSent) {
						currentObservers?.onTxSent({ ...txWithMetadata, hash });
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

		return ethereum.request(args);
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
				case '__1193__':
					return true;
				case 'setObservers':
					return setObservers;
			}
			return (target as any)[property];
		},
	});
}
