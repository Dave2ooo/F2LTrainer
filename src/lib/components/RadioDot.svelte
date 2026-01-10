<script lang="ts">
	/**
	 * RadioDot - A visual radio button indicator component
	 * Used for custom radio-like card selections
	 */
	interface Props {
		selected: boolean;
	}

	let { selected }: Props = $props();
</script>

<div
	class="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors
		{selected ? 'border-blue-600 bg-blue-600' : 'border-gray-400 bg-transparent'}"
>
	{#if selected}
		<div class="h-1.5 w-1.5 rounded-full bg-white"></div>
	{/if}
</div>
