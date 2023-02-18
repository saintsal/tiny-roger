<script lang="ts">
	import { page } from '$app/stores';
	import { pathname, isSameURL } from '$lib/utils/url';

	export let href: string;
</script>

<a href={pathname(href)}
	><span
		class={`chip mx-2 ${
			isSameURL($page.url.pathname, href) ? 'variant-filled-surface' : 'variant-soft-surface'
		}`}><slot /></span
	></a
>
