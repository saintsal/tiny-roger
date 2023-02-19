<script>
	import '../app.postcss';
	import NavElement from '$lib/components/ui/NavElement.svelte';
	import ThemeChanger from '$lib/components/website/themes/ThemeChanger.svelte';
</script>

<div class="navbar bg-base-100 min-h-0 p-1 border-b-2">
	<div class="flex-1">
		<div class="tabs tabs-boxed bg-base-100">
			<NavElement class="tab" selected="tab-active" href="/">Home</NavElement>
			<NavElement class="tab" selected="tab-active" href="/demo/">Demo</NavElement>
			<NavElement class="tab" selected="tab-active" href="/test/">Test</NavElement>
		</div>
	</div>
	<div class="flex-none">
		<ThemeChanger />
	</div>
</div>

<slot />
