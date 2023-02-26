<script>
	import ConnectButton from '$lib/web3/ConnectButton.svelte';
	import Web3Connection from '$lib/web3/Web3Connection.svelte';
	import Modals from '$lib/components/modals/Modals.svelte';
	import { connection } from '$lib/web3';
</script>

<div class="navbar bg-base-100">
	<div class="navbar-start">
		<span class="normal-case text-xl">Testing</span>
	</div>
	<div class="navbar-center hidden lg:flex" />
	<div class="navbar-end">
		<ConnectButton />
	</div>
</div>

<Web3Connection {connection} />

<Modals />
