<script lang="ts">
	import { connection } from '../app/web3';
</script>

<p>{JSON.stringify($connection)}</p>

{#if $connection.state === 'Idle'}
	<button on:click={() => connection.connect('builtin')}>connect</button>
{:else if $connection.state === 'Locked'}
	{#if $connection.unlocking}
		<p>To unlock your wallet, please refers to its menus.</p>
	{/if}
	<button disable={$connection.unlocking} on:click={() => connection.unlock()}>unlock</button>
{:else if $connection.state === 'Ready'}
	<button on:click={() => connection.disconnect()}>disconnect</button>
{/if}
