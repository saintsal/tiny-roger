<script lang="ts">
	import type { EIP1193Provider } from '$lib/types/eip1193';
	import { onMount } from 'svelte';
	let ethereum: EIP1193Provider;
	let loaded = false;
	onMount(() => {
		ethereum = window.ethereum as EIP1193Provider;
		loaded = true;
	});

	let result: any;
	let error: any;

	const tests: { [name: string]: (ethereum: EIP1193Provider) => Promise<any> } = {
		requestAccounts: async (ethereum) => {
			return ethereum.request({ method: 'eth_requestAccounts' });
		},
		ethAccounts: async (ethereum) => {
			return ethereum.request({ method: 'eth_accounts' });
		},
		walletPermission: async (ethereum) => {
			return ethereum.request({
				method: 'wallet_requestPermissions',
				params: [
					{
						eth_accounts: {
							requiredMethods: ['signTypedData_v3'],
						},
					},
				],
			});
		},
	};

	async function execute(name: string, ethereum: EIP1193Provider) {
		result = 'loading...';
		try {
			result = await tests[name](ethereum);
		} catch (err) {
			result = undefined;
			error = err;
		}
	}

	$: console.log(result);

	let listenForChainChanged: boolean = false;
	let listenerForChainId: ((message: any) => void) | undefined;
	$: if (listenForChainChanged) {
		if (!listenerForChainId) {
			listenerForChainId = (message) => {
				console.log({ message });
			};
			ethereum.on('chainChanged', listenerForChainId);
		}
	} else {
		if (listenerForChainId) {
			ethereum.removeListener('chainChanged', listenerForChainId);
			listenerForChainId = undefined;
		}
	}

	let listenForAccountsChanged: boolean = false;
	let listenerForAccountsChanged: ((message: any) => void) | undefined;
	$: if (listenForAccountsChanged) {
		if (!listenerForAccountsChanged) {
			listenerForAccountsChanged = (message) => {
				console.log({ message });
			};
			ethereum.on('accountsChanged', listenerForAccountsChanged);
		}
	} else {
		if (listenerForAccountsChanged) {
			ethereum.removeListener('chainChanged', listenerForAccountsChanged);
			listenerForAccountsChanged = undefined;
		}
	}
</script>

{#if ethereum}
	<div style="position:sticky; height: 10em; border-bottom: 2px solid blue;">
		<p>Result: {result ? result : ''}</p>
		{#if error}
			<p style="color: red; background-color: black;">
				Error: {error.message || error.toString()}
				<button on:click={() => (error = undefined)}>OK</button>
			</p>
		{:else}
			<p>Error:</p>
		{/if}
		<p><input type="checkbox" bind:checked={listenForChainChanged} /> chainChanged</p>
		<p><input type="checkbox" bind:checked={listenForAccountsChanged} /> AccountsChanged</p>
	</div>

	<h1>Tests</h1>
	<ul>
		{#each Object.keys(tests) as testName}
			<li><button on:click={() => execute(testName, ethereum)}>{testName}</button></li>
		{/each}
	</ul>
{:else if loaded}
	No Ethereum Wallet Found
{:else}
	Loading...
{/if}
