<script>
	import '../app.postcss';

	import Web3Connection from '$test/Web3Connection.svelte';
	import { connection } from '../app/web3';
	import InlineAlert from '$test/InlineInfo.svelte';
	import Alert from '$test/Alert.svelte';
</script>

<Web3Connection {connection} />

{#if $connection.state === 'Idle'}
	<button
		disabled={$connection.connecting}
		class={`${$connection.initialised ? '' : '!invisible'} m-2 btn btn-primary`}
		on:click={() => connection.connect()}
		>{$connection.connecting ? 'Connecting' : 'Connect'}</button
	>
{:else if $connection.state === 'Locked'}
	{#if $connection.unlocking}
		<Alert
			data={{ message: 'if the wallet unlock screen did not popup, please refers to its menus.' }}
			bgBorderText="bg-warning border-warning-content text-warning-content"
		/>
	{/if}
	<button
		class="m-2 btn btn-primary"
		disabled={$connection.unlocking}
		on:click={() => connection.unlock()}>unlock</button
	>
{:else if $connection.state === 'Ready'}
	<button class="m-2 btn btn-error" on:click={() => connection.disconnect()}>disconnect</button>
{/if}

<slot />
