<script lang="ts">
	export let href: string;
	export let preview: string;
	export let name: string;
	export let title: string;
	export let description: string;
	export let source: string | undefined = undefined;
</script>

<div class="flex flex-col rounded-lg shadow-lg bg-base-200 overflow-hidden">
	<div class="flex-shrink-0">
		<a {href} target="_blank" rel="noreferrer"
			><img class="h-48 w-full object-cover" src={preview} alt={name} /></a
		>
	</div>
	<div class="flex-1 p-6 flex flex-col justify-between">
		<div class="flex-1">
			<p class="text-xl font-medium">
				<a {href} target="_blank" rel="noreferrer" class="link primary-link text-primary">
					{name}
				</a>
			</p>
			<div class="block mt-2">
				<p class="text-xl font-semibold">
					{title}
				</p>
				<p class="mt-3 text-base">
					{description}
				</p>
				<p class="mt-3 text-base">
					{#if source}
						Source code available <a
							href={source}
							target="_blank"
							rel="noreferrer"
							class="underline">here</a
						>
					{:else}Source code not yet available{/if}
				</p>
			</div>
		</div>
	</div>
</div>
