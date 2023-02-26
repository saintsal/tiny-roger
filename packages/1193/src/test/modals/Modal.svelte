<script lang="ts">
	export let onResponse: ((response: boolean) => boolean | undefined | void) | undefined;

	import { onMount } from 'svelte';
	import { onDestroy } from 'svelte/internal';
	import { modalStore } from './stores';
	import type { ModalCancelationMode, ModalContentSettings } from './types';
	import { focusTrap } from '../skeleton/actions/FocusTrap/focusTrap';

	export let id: string;
	export let settings: ModalContentSettings | undefined = undefined;
	export let cancelation:
		| ({ button: boolean; clickOutside?: boolean } | { cancelable: false })
		| undefined = undefined;

	let component: HTMLElement;
	onMount(() => {
		console.log(`trigger modal ${id}`);
		modalStore.trigger({
			id,
			element: component,
			response(confirm: boolean, mode: ModalCancelationMode) {
				if (cancelation) {
					if ('cancelable' in cancelation && cancelation.cancelable) {
						return false;
					}
					if (mode === 'clickOutside') {
						if ('clickOutside' in cancelation) {
							if (!cancelation.clickOutside) {
								return false;
							}
						}
					}
				}

				console.log(`close modal ${id}`);
				if (onResponse) {
					const result = onResponse(confirm);
					if (result === undefined) {
						return true;
					} else {
						return result;
					}
				} else {
					return true;
				}
			},
		});
	});

	onDestroy(() => {
		modalStore.close();
	});
</script>

<div bind:this={component} use:focusTrap={true}>
	{#if (cancelation && 'button' in cancelation && cancelation.button) || (settings?.type === 'info' && (!cancelation || !('button' in cancelation)))}
		<button
			on:click={() => (onResponse ? onResponse(false) : modalStore.close())}
			class="btn btn-sm btn-circle absolute right-2 top-2">✕</button
		>
	{/if}
	{#if settings?.type && settings.type !== 'custom'}
		{#if settings.type === 'info'}
			{#if settings.title}
				<h3 class="text-lg font-bold">{settings.title}</h3>
			{/if}
			<p class="py-4">
				{settings.message}
			</p>
		{:else if settings.type === 'confirm'}
			{#if settings.title}
				<h3 class="font-bold text-lg">{settings.title}</h3>
			{/if}
			<p class="py-4">
				{settings.message}
			</p>
			<div class="modal-action">
				<button
					on:click={() => (onResponse ? onResponse(false) : modalStore.close())}
					class="btn btn-error">Cancel</button
				>
				<button
					on:click={() => (onResponse ? onResponse(true) : modalStore.close())}
					class="btn btn-success">Confirm</button
				>
			</div>
		{:else}
			<!-- TODO more -->
			<slot />
		{/if}
	{:else}
		<slot />
	{/if}
</div>
