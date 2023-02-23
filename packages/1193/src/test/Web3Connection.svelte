<script lang="ts">
	import type { connection as conn } from '../app/web3';
	export let connection: typeof conn;
	import Alert from './Alert.svelte';
</script>

{#if $connection.error}
	<Alert data={$connection.error} onClose={connection.acknowledgeError} />
{/if}
