<script lang="ts">
	import { Button } from 'flowbite-svelte';
	import FeedbackModal from './Modals/FeedbackModal.svelte';
	import ToastNotification from './Toast.svelte';

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

<Button onclick={() => feedbackRef.openModal()}>Send Feedback</Button>

<FeedbackModal bind:this={feedbackRef} onFeedbackResult={handleFeedbackResult} />

{#if showToast}
	<ToastNotification message={toastMessage} type={toastType} onClose={handleToastClose} />
{/if}
