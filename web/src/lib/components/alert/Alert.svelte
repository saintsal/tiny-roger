<script lang="ts">
	export let data: { title?: string; message: string; code?: number };
	export let onClose: (() => void) | undefined = undefined;
	export let bgBorderText = 'bg-error border-error-content text-error-content';
</script>

<!-- class="fixed top-0 px-4 py-3 m-2 border rounded bg-red-100 border-red-400 text-red-700" -->
<!-- class="fixed top-0 alert alert-error shadow-lg m-2" -->
<!-- class="fixed top-0 px-4 py-3 m-2 rounded-box bg-error text-error-content" -->
<div
	style="width: auto; left: 0px; right: 0px; max-width: 100%;"
	class={`fixed top-0 z-50 px-4 py-3 m-2 border-2 rounded-box ${bgBorderText}`}
	role="alert"
>
	<p>
		<strong class="font-bold">{data.title ? data.title : data.message}</strong>
	</p>
	{#if data.title}
		<p>
			<span class="block sm:inline">{data.message}</span>
		</p>
	{/if}

	{#if onClose}
		<!-- svelte-ignore a11y-click-events-have-key-events-->
		<span class="absolute top-0 bottom-0 right-0 px-4 py-3" on:click={() => onClose && onClose()}>
			<svg
				class="fill-current h-6 w-6"
				role="button"
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 20 20"
				><title>Close</title><path
					d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"
				/></svg
			>
		</span>
	{/if}
</div>
