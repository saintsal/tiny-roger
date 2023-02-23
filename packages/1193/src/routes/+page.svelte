<script lang="ts">
	import JsonAsTable from '$test/JSONAsTable.svelte';
	import { connection } from '../app/web3';
</script>

<JsonAsTable value={$connection.toJSON()} />
