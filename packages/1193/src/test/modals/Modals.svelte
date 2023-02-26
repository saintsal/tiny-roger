<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';

	const dispatch = createEventDispatcher();

	import { modalStore } from './stores';

	let content: HTMLDivElement;
	$: if (content && $modalStore[0]) {
		content.appendChild($modalStore[0].element);
	}

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
	// ----------------------------------------------------------------------------------------------
</script>

{#if $modalStore.length > 0}
	{#key $modalStore}
		<div
			style="pointer-events: auto; visibility: visible; opacity: 1;"
			class="modal modal-bottom sm:modal-middle cursor-pointer"
			on:mousedown={onBackdropInteraction}
			on:touchstart={onBackdropInteraction}
		>
			<div class="modal-box relative" bind:this={content}>
				<!-- <p>Title</p>
				<p>content</p>
				>
				<div class="modal-action">
					<button class="btn btn-primary">action</button>
				</div> -->
			</div>
		</div>
	{/key}
{/if}
