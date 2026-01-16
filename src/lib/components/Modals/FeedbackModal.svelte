<script lang="ts">
	import { A, ButtonGroup, Input, InputAddon, Label, Textarea } from 'flowbite-svelte';
	import Modal from '../Modal.svelte';
	import { AtSign, UserRound } from '@lucide/svelte';
	import { onMount } from 'svelte';
	import { loadFromLocalStorage, saveToLocalStorage } from '$lib/utils/localStorage';
	import Send from './Buttons/Send.svelte';
	import FeedbackSuccessModal from './FeedbackSuccessModal.svelte';

	const FEEDBACK_STORAGE_KEY = 'feedbackFormData';

	let open = $state(false);
	let isSubmitting = $state(false);
	let errorMessage = $state('');
	let successModalRef: FeedbackSuccessModal;

	// Form state
	let formData = $state({
		name: '',
		email: '',
		message: ''
	});

	export function openModal(errorContext?: string) {
		// Reset states when opening
		errorMessage = '';

		if (errorContext) {
			// Remove any previously added error details to prevent accumulation
			const cleanMessage = formData.message
				.split('\n')
				.filter((line) => !line.trim().startsWith('Error details:'))
				.join('\n')
				.trim();

			const textToAdd = `Error details: ${errorContext}`;

			formData.message = cleanMessage ? `${cleanMessage}\n\n${textToAdd}` : textToAdd;
		}
		open = true;
	}

	export function closeModal() {
		open = false;
	}

	// Load form data from localStorage on mount
	onMount(() => {
		const savedData = loadFromLocalStorage<typeof formData>(FEEDBACK_STORAGE_KEY);
		if (savedData) {
			formData = { ...formData, ...savedData };
		}

		// Save form data when component unmounts
		return () => {
			saveToLocalStorage(FEEDBACK_STORAGE_KEY, formData);
		};
	});

	// Also save on input changes
	$effect(() => {
		saveToLocalStorage(FEEDBACK_STORAGE_KEY, formData);
	});

	async function handleSubmit(e: Event) {
		e.preventDefault();
		isSubmitting = true;
		errorMessage = '';

		try {
			const payload = {
				access_key: '70f60afc-3ab0-4491-80be-e854832fddb9',
				subject: 'F2L Trainer feedback',
				name: formData.name,
				email: formData.email,
				message: formData.message
			};

			const response = await fetch('https://api.web3forms.com/submit', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json'
				},
				body: JSON.stringify(payload)
			});

			const result = await response.json();

			if (response.status === 200) {
				// Success - clear form and localStorage
				formData = { name: '', email: '', message: '' };
				localStorage.removeItem(FEEDBACK_STORAGE_KEY);
				open = false;
				successModalRef.openModal();
			} else {
				// Error from API
				console.error('Feedback submission error:', result);
				errorMessage = result.message || 'Failed to send feedback. Please try again.';
			}
		} catch (error) {
			console.error('Feedback submission error:', error);
			errorMessage = 'Something went wrong! Please try again.';
		} finally {
			isSubmitting = false;
		}
	}

	function onCancel() {
		open = false;
	}
</script>

<FeedbackSuccessModal bind:this={successModalRef} />

<Modal bind:open title="Send Feedback" size="md" outsideclose={true} autoclose={false}>
	<form onsubmit={handleSubmit}>
		<div class="space-y-4">
			<div>
				Send your feedback via this form or create an issue on
				<A
					href="https://github.com/Dave2ooo/F2LTrainer-Svelte"
					target="_blank"
					rel="noopener noreferrer"
					class="text-blue-600 hover:underline"
				>
					GitHub
				</A>.
			</div>

			<div>
				<Label for="name" class="mb-2 block">Your Name</Label>
				<ButtonGroup class="w-full">
					<InputAddon>
						<UserRound class="h-4 w-4 text-gray-500 dark:text-gray-400" />
					</InputAddon>
					<Input
						id="name"
						type="text"
						bind:value={formData.name}
						placeholder="Your Name"
						required
						disabled={isSubmitting}
						maxlength={40}
					/>
				</ButtonGroup>
			</div>

			<div>
				<Label for="email" class="mb-2 block">Your Email</Label>
				<ButtonGroup class="w-full">
					<InputAddon>
						<AtSign class="h-4 w-4 text-gray-500 dark:text-gray-400" />
					</InputAddon>
					<Input
						id="email"
						type="email"
						bind:value={formData.email}
						placeholder="your.email@example.com"
						required
						disabled={isSubmitting}
						maxlength={50}
					/>
				</ButtonGroup>
			</div>

			<div>
				<Label for="message" class="mb-2">Your Feedback</Label>
				<Textarea
					id="message"
					bind:value={formData.message}
					placeholder="Your feedback here..."
					rows={4}
					required
					disabled={isSubmitting}
					class="w-full"
					maxlength={10000}
				/>
				{#if errorMessage}
					<p class="mt-2 text-sm text-red-600 dark:text-red-400">
						{errorMessage}
					</p>
				{/if}
			</div>
		</div>
		<Send
			{onCancel}
			disabled={isSubmitting}
			submitText={isSubmitting ? 'Sending...' : 'Send Feedback'}
		/>
	</form>
</Modal>
