import { init } from '$lib/stores/connection';
import { WalletConnectModuleLoader } from 'web3w-walletconnect-loader';

// TODO get chainIds from contracts data
const chainIds = ['5'];

const stores = init({
	autoConnectUsingPrevious: true,
	options: [
		'builtin',
		new WalletConnectModuleLoader({
			projectId: '355ea1b63e40657f5b5ce459292375bd',
			chains: chainIds.map((v) => parseInt(v)),
		}),
	],
});

export const { connection, network, account, pendingActions } = stores;
