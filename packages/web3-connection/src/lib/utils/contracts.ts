import type { ContractsInfos, MultiNetworkConfigs, NetworkConfig } from '$lib/stores/connection';
import { formatChainId, toHex } from './ethereum';

export function getContractInfos(
	networkConfigs: MultiNetworkConfigs | NetworkConfig,
	chainId: string
): ContractsInfos {
	if (networkConfigs.chainId) {
		const networkConfig = networkConfigs as NetworkConfig;

		if (chainId === networkConfig.chainId || chainId == formatChainId(networkConfig.chainId)) {
			return networkConfig.contracts;
		} else {
			const error = {
				code: 1, // TODO error code
				message: `networkConfig only available for ${networkConfig.chainId}, not available for ${chainId}`,
			};
			throw error;
		}
	} else {
		const multinetworkConfigs = networkConfigs as MultiNetworkConfigs;
		const networkConfig = multinetworkConfigs[chainId] || multinetworkConfigs[toHex(chainId)];
		if (!networkConfig) {
			const error = {
				code: 1, // TODO error code
				message: `networkConfig not available for ${chainId}`,
			};
			throw error; // TODO remove ?
		} else {
			return networkConfig.contracts;
		}
	}
}
