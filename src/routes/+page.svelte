<script lang="ts">
	import { Button, Heading, Dropdown, DropdownItem } from 'flowbite-svelte';
	import { ChevronDownOutline } from 'flowbite-svelte-icons';
	import { globalState } from '$lib/globalState.svelte';
	import SelectView from '$lib/components/SelectView/SelectView.svelte';
	import ChangeViewButton from '$lib/components/ChangeViewButton.svelte';
	import TrainView from '$lib/components/TrainView/TrainView.svelte';
	import { trainState } from '$lib/trainCaseQueue.svelte';

	const currentTrainState = trainState; // Keep at +page to keep global
</script>

<Heading>F2L Trainer</Heading>

<Button
	>Dropdown button<ChevronDownOutline class="ms-2 h-6 w-6 text-white dark:text-white" /></Button
>
<Dropdown simple>
	<DropdownItem
		onclick={() => {
			globalState.frontColor = 'red';
		}}>Red</DropdownItem
	>
	<DropdownItem
		onclick={() => {
			globalState.frontColor = 'green';
		}}>Green</DropdownItem
	>
	<DropdownItem
		onclick={() => {
			globalState.frontColor = 'orange';
		}}>Orange</DropdownItem
	>
	<DropdownItem
		onclick={() => {
			globalState.frontColor = 'blue';
		}}>Blue</DropdownItem
	>
</Dropdown>

{#if globalState.view === 'select'}
	<SelectView />
{:else}
	<TrainView />
{/if}

<ChangeViewButton />
