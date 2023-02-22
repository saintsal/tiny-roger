import type { EIP1193Provider } from '../lib/types';

export async function moreTests(ethereum: EIP1193Provider) {
	ethereum.on('chainChanged', (message) => {
		console.log('chainChanged', message);
	});
	const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
	console.log({ accounts });
}
