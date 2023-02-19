<script>
	import '../app.postcss';
	import ThemeChanger from '$lib/components/daisyui/ThemeChanger.svelte';
	import NavTabs from '$lib/components/daisyui/NavTabs.svelte';
</script>

<div class="navbar bg-base-100 min-h-0 p-1 border-b-2">
	<div class="flex-1">
		<NavTabs
			pages={[
				{ pathname: '/', title: 'Home' },
				{ pathname: '/demo/', title: 'Demo' },
				{ pathname: '/test/', title: 'Test' },
			]}
		/>
	</div>
	<div class="flex-none">
		<ThemeChanger />
	</div>
</div>

<slot />
