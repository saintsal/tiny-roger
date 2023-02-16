<script>
	// import '@skeletonlabs/skeleton/themes/theme-skeleton.css';
	import '@skeletonlabs/skeleton/themes/theme-seafoam.css';
	import '@skeletonlabs/skeleton/styles/all.css';
	import '../app.postcss';

	import { AppBar, AppShell, LightSwitch } from '@skeletonlabs/skeleton';
</script>

<AppShell slotHeader="bg-surface-500/5 w-56 p-4">
	<svelte:fragment slot="pageHeader">
		<AppBar>
			<svelte:fragment slot="lead">
				<a href="/"><span class="chip variant-filled-surface mx-2">Home</span></a>
				<a href="/about/"><span class="chip variant-soft-surface mx-2">Demo</span></a>
				<a href="/test/"><span class="chip variant-soft-surface mx-2">Test</span></a>
			</svelte:fragment>

			<svelte:fragment slot="trail"><LightSwitch /></svelte:fragment>
			<!-- <svelte:fragment slot="headline">(headline)</svelte:fragment> -->
		</AppBar>
	</svelte:fragment>

	<slot />
</AppShell>
