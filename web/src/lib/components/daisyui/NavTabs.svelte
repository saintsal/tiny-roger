<script lang="ts">
	import PageLink from '$lib/components/navigation/PageLink.svelte';

	export let pages: { pathname: string; title: string }[];
</script>

<div class="tabs tabs-boxed bg-base-100">
	{#each pages as page}
		<PageLink class="tab" whenSelected="tab-active" href={page.pathname}>{page.title}</PageLink>
	{/each}
</div>
