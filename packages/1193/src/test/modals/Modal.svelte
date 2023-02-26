<script lang="ts">
	export let onCancelRequest: (() => boolean | undefined | void) | undefined;

	import { onMount } from 'svelte';
	import { onDestroy } from 'svelte/internal';
	import { modalStore } from './stores';

	export let id: string;

	let component: HTMLElement;
	onMount(() => {
		console.log(`trigger modal ${id}`);
		modalStore.trigger({
			id,
			element: component,
			response(confirm: boolean) {
				console.log(`close modal ${id}`);
				if (!confirm) {
					if (onCancelRequest) {
						const result = onCancelRequest();
						if (result === undefined) {
							return true;
						} else {
							return result;
						}
					} else {
						return true;
					}
				}
				return true;
			},
		});
	});

	onDestroy(() => {
		modalStore.close();
	});
</script>

<div bind:this={component}><slot /></div>
