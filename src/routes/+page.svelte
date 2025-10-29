<script lang="ts">
	import { Button, Heading, Dropdown, DropdownItem, Modal } from 'flowbite-svelte';
	import { ChevronDownOutline } from 'flowbite-svelte-icons';
	import { globalState } from '$lib/globalState.svelte';
	import SelectView from '$lib/components/SelectView/SelectView.svelte';
	import ChangeViewButton from '$lib/components/ChangeViewButton.svelte';
	import TrainView from '$lib/components/TrainView/TrainView.svelte';
	import { trainState } from '$lib/trainCaseQueue.svelte';
	import Settings from '$lib/components/Modals/Settings.svelte';
	import FeedbackModal from '$lib/components/Modals/FeedbackModal.svelte';
	import ToastNotification from '$lib/components/Toast.svelte';

	const currentTrainState = trainState; // Keep at +page to keep global

	let settingsRef: Settings;
	let feedbackRef: FeedbackModal;

	// Toast state
	let toastMessage = $state('');
	let toastType: 'success' | 'error' = $state('success');
	let showToast = $state(false);

	function handleFeedbackResult(success: boolean, message: string) {
		toastMessage = message;
		toastType = success ? 'success' : 'error';
		showToast = true;
	}

	function handleToastClose() {
		showToast = false;
	}
</script>

<Heading>F2L Trainer</Heading>

<div class="flex gap-2">
	<Button onclick={() => settingsRef.openModal()}>Open Settings</Button>
	<Button onclick={() => feedbackRef.openModal()}>Send Feedback</Button>
</div>

<Settings bind:this={settingsRef} />
<FeedbackModal bind:this={feedbackRef} onFeedbackResult={handleFeedbackResult} />

{#if globalState.view === 'select'}
	<SelectView />
{:else}
	<TrainView />
{/if}

<ChangeViewButton />

{#if showToast}
	<ToastNotification message={toastMessage} type={toastType} onClose={handleToastClose} />
{/if}
