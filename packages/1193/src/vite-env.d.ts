/// <reference types="vite/client" />

import { EIP1193Provider } from "./types";

declare global {
	interface Window {
		ethereum?: EIP1193Provider;
	}
	interface WindowWithEthereum extends Window {
		ethereum: EIP1193Provider;
	}
}
