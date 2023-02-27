<script lang="ts">
	import Modal from '$lib/components/modals/Modal.svelte';
	import type { account as Account } from './';
	export let account: typeof Account;
</script>

{#if $account.unlocking}
	<Modal
		cancelation={{ cancelable: false }}
		settings={{ type: 'info', message: 'Please unlock' }}
	/>
{/if}
