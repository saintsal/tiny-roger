<script lang="ts">
	import ConnectButton from '$lib/web3/ConnectButton.svelte';
	import Web3Connection from '$lib/web3/Web3Connection.svelte';
	import Modals from '$lib/components/modals/Modals.svelte';
	import { connection, pendingActions } from '$lib/web3';
	import { contracts } from '$lib/web3/ethers';

	let messageToSend: string;
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

<div class="inline-block form-control w-full max-w-xs">
	<label for="message" class="label !inline">
		<span class="label-text">Say something to the world</span>
	</label>
	<input
		id="message"
		type="text"
		bind:value={messageToSend}
		placeholder="Type here"
		class="!inline input input-bordered w-full max-w-xs"
	/>
</div>
<button
	on:click={() =>
		contracts.execute(async ({ contracts }) => {
			console.log({ contracts });
			contracts.GreetingsRegistry.setMessage(messageToSend);
		})}
	class="m-1 btn btn-primary">Say it!</button
>

<Web3Connection {connection} {pendingActions} />

<Modals />
