import { execute } from '.';
import { BrowserProvider, Contract } from 'ethers';
import type {
	ConnectedState,
	ConnectedAccountState,
	ConnectedAndSupportedNetworkState,
} from 'web3-connection';

// const contracts: { [name: string]: Contract } = {};
// export const ethersContracts = derived(
// 	[connection, account, network],
// 	async ([$connection, $account, $network]) => {
// 		if ($connection.state === 'Connected') {
// 			// TODO cache
// 			const signer = await new BrowserProvider($connection.provider as any).getSigner(
// 				$account.address
// 			);
// 			if ($network.contracts) {
// 				for (const name of Object.keys($network.contracts)) {
// 					const contract = new Contract(
// 						$network.contracts[name].address,
// 						$network.contracts[name].abi,
// 						signer
// 					);
// 					contracts[name] = contract;
// 				}
// 			}
// 		}
// 		return contracts;
// 	}
// );
export const contracts = {
	execute<T>(
		callback: (state: {
			connection: ConnectedState;
			network: ConnectedAndSupportedNetworkState;
			account: ConnectedAccountState;
			contracts: { [name: string]: Contract };
		}) => Promise<T>
	) {
		return execute(async ({ connection, network, account }) => {
			const contracts: { [name: string]: Contract } = {};
			const signer = await new BrowserProvider(connection.provider).getSigner(account.address);
			if (network.contracts) {
				for (const name of Object.keys(network.contracts)) {
					const contract = new Contract(
						network.contracts[name].address,
						network.contracts[name].abi,
						signer
					);
					contracts[name] = contract;
				}
			}
			return callback({
				connection,
				network,
				account,
				contracts,
			});
		});
	},
};
