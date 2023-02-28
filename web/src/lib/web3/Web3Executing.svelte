<script lang="ts">
	import { contractsInfos } from '$lib/blockchain/contracts';
	import Modal from '$lib/components/modals/Modal.svelte';
	import type { connection as Connection, network as Network } from './';

	export let connection: typeof Connection;
	export let network: typeof Network;
</script>

{#if $connection.executing}
	{#if $network.notSupported}
		<Modal cancelation={{ cancelable: false }}>
			<h3 class="text-lg font-bold">You are connected to unsupported network</h3>
			<p class="py-4">Proceed to switch to the Goerli testnet.</p>
			<div class="modal-action">
				<button
					on:click={async () => {
						console.log('switching...');
						await network.switchTo($contractsInfos.chainId);
						console.log('switched');
					}}
					class="btn">Switch</button
				>
			</div>
		</Modal>
	{/if}
{/if}
