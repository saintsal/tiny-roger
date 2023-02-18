<script>
	import '@skeletonlabs/skeleton/themes/theme-skeleton.css';
	// import '@skeletonlabs/skeleton/themes/theme-seafoam.css';
	import '@skeletonlabs/skeleton/styles/all.css';
	import '../app.postcss';

	import { AppBar, AppShell, LightSwitch } from '@skeletonlabs/skeleton';
	import NavElement from '$lib/components/ui/NavElement.svelte';
</script>

<AppShell slotHeader="bg-surface-500/5 w-56 p-4">
	<svelte:fragment slot="pageHeader">
		<AppBar>
			<svelte:fragment slot="lead">
				<NavElement href="/">Home</NavElement>
				<NavElement href="/demo/">Demo</NavElement>
				<NavElement href="/test/">Test</NavElement>
			</svelte:fragment>

			<svelte:fragment slot="trail"><LightSwitch /></svelte:fragment>
			<!-- <svelte:fragment slot="headline">(headline)</svelte:fragment> -->
		</AppBar>
	</svelte:fragment>

	<slot />
</AppShell>
