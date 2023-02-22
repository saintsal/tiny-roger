export async function moreTests(window: WindowWithEthereum) {
	const ethereum = window.ethereum;

	ethereum.on("chainChanged", (message) => {
		console.log("chainChanged", message);
	});
	const accounts = await ethereum.request({ method: "eth_requestAccounts" });
	console.log({ accounts });
}
