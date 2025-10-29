<script lang="ts">
	import { Button, Heading, Dropdown, DropdownItem, Modal } from 'flowbite-svelte';
	import { ChevronDownOutline } from 'flowbite-svelte-icons';
	import { globalState } from '$lib/globalState.svelte';
	import SelectView from '$lib/components/SelectView/SelectView.svelte';
	import ChangeViewButton from '$lib/components/ChangeViewButton.svelte';
	import TrainView from '$lib/components/TrainView/TrainView.svelte';
	import { trainState } from '$lib/trainCaseQueue.svelte';
	import Settings from '$lib/components/Modals/Settings.svelte';
	import FeedbackButton from '$lib/components/FeedbackButton.svelte';

	const currentTrainState = trainState; // Keep at +page to keep global

	let settingsRef: Settings;
</script>

<Heading>F2L Trainer</Heading>

<div class="flex gap-2">
	<Button onclick={() => settingsRef.openModal()}>Open Settings</Button>
	<FeedbackButton />
</div>

<Settings bind:this={settingsRef} />

{#if globalState.view === 'select'}
	<SelectView />
{:else}
	<TrainView />
{/if}

<ChangeViewButton />
