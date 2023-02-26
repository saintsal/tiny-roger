<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { fade, fly } from 'svelte/transition';

	const dispatch = createEventDispatcher();

	import { modalStore } from './stores';

	let content: HTMLDivElement;
	$: if (content && $modalStore[0]) {
		content.appendChild($modalStore[0].element);
	}

	export let duration = 150;
	export let flyOpacity = 0;
	export let flyX = 0;
	export let flyY = 100;

	// ----------------------------------------------------------------------------------------------
	// Event Handlers
	// ----------------------------------------------------------------------------------------------
	function onBackdropInteraction(event: MouseEvent | TouchEvent): void {
		if (!(event.target instanceof Element)) {
			return;
		}
		if (event.target.classList.contains('modal')) {
			cancel();
		}
		/** @event {{ event }} backdrop - Fires on backdrop interaction.  */
		dispatch('backdrop', event);
	}

	function cancel(): void {
		if ($modalStore[0].response) {
			if ($modalStore[0].response(false)) {
				// modalStore.close();
			}
		} else {
			// modalStore.close();
		}
	}

	function onKeyDown(event: KeyboardEvent): void {
		if (!$modalStore.length) return;
		if (event.code === 'Escape') {
			cancel();
		}
	}
	// ----------------------------------------------------------------------------------------------
</script>

<svelte:window on:keydown={onKeyDown} />

{#if $modalStore.length > 0}
	{#key $modalStore}
		<div
			style="pointer-events: auto; visibility: visible; opacity: 1;"
			class="modal modal-bottom sm:modal-middle cursor-pointer"
			on:mousedown={onBackdropInteraction}
			on:touchstart={onBackdropInteraction}
			transition:fade={{ duration }}
		>
			<div
				class="modal-box relative"
				transition:fly={{ duration, opacity: flyOpacity, x: flyX, y: flyY }}
				bind:this={content}
			/>
		</div>
	{/key}
{/if}
