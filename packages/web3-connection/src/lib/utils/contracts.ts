import type { ContractsInfos, MultiNetworkConfigs, NetworkConfig } from '$lib/stores/connection';
import { formatChainId, toHex } from './ethereum';

export function getContractInfos(
	networkConfigs: MultiNetworkConfigs | NetworkConfig,
	chainId: string
): ContractsInfos | undefined {
	if (networkConfigs.chainId) {
		const networkConfig = networkConfigs as NetworkConfig;

		if (chainId === networkConfig.chainId || chainId == formatChainId(networkConfig.chainId)) {
			return networkConfig.contracts;
		} else {
			return undefined;
		}
	} else {
		const multinetworkConfigs = networkConfigs as MultiNetworkConfigs;
		const networkConfig = multinetworkConfigs[chainId] || multinetworkConfigs[toHex(chainId)];
		if (!networkConfig) {
			return undefined;
		} else {
			return networkConfig.contracts;
		}
	}
}
