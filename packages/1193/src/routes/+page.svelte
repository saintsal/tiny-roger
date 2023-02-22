<script lang="ts">
	import { testEIP1193 } from '$test/eip1193';
	import { moreTests } from '$test/moreTests';
	import type { EIP1193Provider } from '$lib/types';
	import { onMount } from 'svelte';
	let ethereum: EIP1193Provider;
	let loaded = false;
	onMount(() => {
		ethereum = window.ethereum as EIP1193Provider;
		loaded = true;
	});
</script>

{#if ethereum}
	<button on:click={() => testEIP1193(ethereum)}>EIP1193</button>
	<button on:click={() => moreTests(ethereum)}>more</button>
{:else if loaded}
	No Ethereum Wallet Found
{:else}
	Loading...
{/if}
