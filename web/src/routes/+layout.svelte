<script>
	import '../app.postcss';
	import ThemeChanger from '$lib/components/daisyui/ThemeChanger.svelte';
	import NavTabs from '$lib/components/daisyui/NavTabs.svelte';

	import { appDescription, url as appUrl } from '../application.json';

	const title = 'Jolly Roger, Template for Decentralised Applications.';
	const description = appDescription;
	const host = appUrl.endsWith('/') ? appUrl : appUrl + '/';
	const previewImage = host + 'preview.png';
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="title" content={title} />
	<meta name="description" content={description} />
	<meta property="og:type" content="website" />
	<meta property="og:url" content={host} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:image" content={previewImage} />
	<meta property="twitter:card" content="summary_large_image" />
	<meta property="twitter:url" content={host} />
	<meta property="twitter:title" content={title} />
	<meta property="twitter:description" content={description} />
	<meta property="twitter:image" content={previewImage} />
</svelte:head>

<div class="sticky top-0 z-50 navbar bg-base-100 min-h-0 p-1 border-b-2 border-primary">
	<div class="flex-1">
		<NavTabs
			pages={[
				{ pathname: '/', title: 'Home' },
				{ pathname: '/demo/', title: 'Demo' },
				{ pathname: '/about/', title: 'About' },
			]}
		/>
	</div>
	<div class="flex-none">
		<ThemeChanger />
	</div>
</div>

<slot />
