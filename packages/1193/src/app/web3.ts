import { init } from '$lib/stores/connection';
import { PortisModuleLoader } from 'web3w-portis-loader';

export const connection = init({
	options: [
		'builtin',
		new PortisModuleLoader('c6931c16-5c47-4e03-ad80-126af916f557', { chainId: '5' }),
	],
});
