<script lang="ts">
	import JsonAsTable from '$test/JSONAsTable.svelte';
	import { connection } from '../app/web3';
</script>

<p>
	<button
		on:click={() =>
			$connection.provider?.request({
				method: 'personal_sign',
				params: ['0xdeadbeef', $connection.address || ''],
			})}
		class="m-1 btn btn-primary btn-sm rounded-box">sign</button
	>

	<button
		on:click={() =>
			$connection.provider?.request({
				method: 'eth_sendTransaction',
				params: [{ from: $connection.address || '', to: $connection.address || '', value: '0x01' }],
			})}
		class="m-1 btn btn-primary btn-sm rounded-box">tx</button
	>
</p>

<JsonAsTable value={$connection.toJSON()} />
