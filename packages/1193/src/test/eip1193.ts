import type {
	EIP1193Accounts,
	EIP1193Block,
	EIP1193EthSubscription,
	EIP1193Provider
} from '../lib/types';

export function testEIP1193(ethereum: EIP1193Provider) {
	console.log(`testing EIP-1193...`);

	// Example 1: Log chainId
	ethereum
		.request({ method: 'eth_chainId' })
		.then((chainId) => {
			console.log(`hexadecimal string: ${chainId}`);
			console.log(`decimal number: ${parseInt(chainId as string, 16)}`);
		})
		.catch((error) => {
			console.error(`Error fetching chainId: ${error.code}: ${error.message}`);
		});

	// Example 2: Log last block
	ethereum
		.request({
			method: 'eth_getBlockByNumber',
			params: ['latest', true]
		})
		.then((block) => {
			console.log(`Block ${(block as EIP1193Block).number}:`, block);
		})
		.catch((error) => {
			console.error(
				`Error fetching last block: ${error.message}.
       Code: ${error.code}. Data: ${error.data}`
			);
		});

	// Example 3: Log available accounts
	ethereum
		.request({ method: 'eth_accounts' })
		.then((accounts) => {
			console.log(`Accounts:\n${(accounts as EIP1193Accounts).join('\n')}`);
		})
		.catch((error) => {
			console.error(
				`Error fetching accounts: ${error.message}.
       Code: ${error.code}. Data: ${error.data}`
			);
		});

	// Example 4: Log new blocks
	ethereum
		.request({
			method: 'eth_subscribe',
			params: ['newHeads']
		})
		.then((subscriptionId) => {
			ethereum.on('message', (message) => {
				if (message.type === 'eth_subscription') {
					const { data } = message as EIP1193EthSubscription;
					if (data.subscription === subscriptionId) {
						if ('result' in data && typeof data.result === 'object') {
							const block = data.result as EIP1193Block;
							console.log(`New block ${block.number}:`, block);
						} else {
							console.error(`Something went wrong: ${data.result}`);
						}
					}
				}
			});
		})
		.catch((error) => {
			console.error(
				`Error making newHeads subscription: ${error.message}.
       Code: ${error.code}. Data: ${error.data}`
			);
		});

	// Example 5: Log when accounts change
	const logAccounts = (accounts: any) => {
		console.log(`Accounts:\n${accounts.join('\n')}`);
	};
	ethereum.on('accountsChanged', logAccounts);
	// to unsubscribe
	ethereum.removeListener('accountsChanged', logAccounts);

	// Example 6: Log if connection ends
	(ethereum as any).on('disconnect', (code: any, reason: any) => {
		console.log(`Ethereum Provider connection closed: ${reason}. Code: ${code}`);
	});
}
