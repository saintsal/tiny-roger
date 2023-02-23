export function formatChainId(chainId: string): string {
	return parseInt(chainId.slice(2), 16).toString();
}
