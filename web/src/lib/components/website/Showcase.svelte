<script lang="ts">
	export let href: string;
	export let preview: string;
	export let name: string;
	export let title: string;
	export let description: string;
	export let source: string | undefined = undefined;
</script>

<div
	class="flex flex-col rounded-lg shadow-lg dark:shadow-slate-400 dark:shadow-sm overflow-hidden"
>
	<div class="flex-shrink-0">
		<a {href} target="_blank" rel="noreferrer"
			><img class="h-48 w-full object-cover" src={preview} alt={name} /></a
		>
	</div>
	<div class="flex-1 bg-surface-50 dark:bg-gray-800 p-6 flex flex-col justify-between">
		<div class="flex-1">
			<p class="text-xl font-medium text-pink-600">
				<a {href} target="_blank" rel="noreferrer" class="underline">
					{name}
				</a>
			</p>
			<div class="block mt-2">
				<p class="text-xl font-semibold text-gray-900 dark:text-gray-100">
					{title}
				</p>
				<p class="mt-3 text-base text-gray-700 dark:text-gray-300">
					{description}
				</p>
				<p class="mt-3 text-base text-gray-500">
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
