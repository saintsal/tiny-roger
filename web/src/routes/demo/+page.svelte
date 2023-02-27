<script lang="ts">
	import ConnectButton from '$lib/web3/ConnectButton.svelte';
	import Web3Connection from '$lib/web3/Web3Connection.svelte';
	import Modals from '$lib/components/modals/Modals.svelte';
	import { connection, pendingActions } from '$lib/web3';
	import { BrowserProvider, Contract } from 'ethers';

	let messageToSend: string;
	function sayHello() {
		connection.execute(async ({ connection, network, account }) => {
			const signer = await new BrowserProvider(connection.provider).getSigner(account.address);
			console.log(`executing...`);
			const GreetingsRegistry = network.contracts?.GreetingsRegistry;

			if (GreetingsRegistry) {
				const contract = new Contract(GreetingsRegistry.address, GreetingsRegistry.abi, signer);
				return contract.setMessage(messageToSend);
			}
		});
	}
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
<button on:click={() => sayHello()} class="m-1 btn btn-primary">Say it!</button>

<Web3Connection {connection} {pendingActions} />

<Modals />
