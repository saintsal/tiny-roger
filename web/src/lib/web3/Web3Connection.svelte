<script lang="ts">
	import type { connection as Connection, pendingActions as PendingActions } from './';
	export let connection: typeof Connection;
	export let pendingActions: typeof PendingActions;
	import Web3ConnectionError from './Web3ConnectionError.svelte';
	import Web3PendingActions from './Web3PendingActions.svelte';
	import Web3WalletSelection from './Web3WalletSelection.svelte';
</script>

<Web3ConnectionError {connection} />

<Web3WalletSelection {connection} />

<Web3PendingActions {pendingActions} />
