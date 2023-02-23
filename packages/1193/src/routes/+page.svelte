<script lang="ts">
	import JsonAsTable from '$test/JSONAsTable.svelte';
	import Web3Connection from '$test/Web3Connection.svelte';
	import { connection } from '../app/web3';
</script>

<Web3Connection {connection} />

{#if $connection.state === 'Idle'}
	<button class="m-2 btn btn-primary" on:click={() => connection.connect()}>connect</button>
{:else if $connection.state === 'Locked'}
	{#if $connection.unlocking}
		<p>To unlock your wallet, please refers to its menus.</p>
	{/if}
	<button
		class="m-2 btn btn-primary"
		disabled={$connection.unlocking}
		on:click={() => connection.unlock()}>unlock</button
	>
{:else if $connection.state === 'Ready'}
	<button class="m-2 btn btn-error" on:click={() => connection.disconnect()}>disconnect</button>
{/if}

<!-- <p>{JSON.stringify($connection)}</p> -->

<JsonAsTable value={$connection.toJSON()} />
