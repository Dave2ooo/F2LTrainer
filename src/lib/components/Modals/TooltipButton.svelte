<script lang="ts">
	import { Button, Tooltip } from 'flowbite-svelte';

	export let id: string;
	export let tooltip: string;
	export let icon: any;
</script>

<Button
	{id}
	class="bg-transparent p-1 hover:bg-transparent focus:bg-transparent dark:bg-transparent dark:hover:bg-transparent dark:focus:bg-transparent"
	type="button"
>
	<svelte:component this={icon} class="text-primary-600" />
</Button>
<Tooltip trigger="click" triggeredBy={`#${id}`}>{tooltip}</Tooltip>
