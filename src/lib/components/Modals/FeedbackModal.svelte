<script lang="ts">
	import { Button, Input, Label, Modal, Textarea } from 'flowbite-svelte';
	import { onMount } from 'svelte';
	import { loadFromLocalStorage, saveToLocalStorage } from '$lib/utils/localStorage';

	const FEEDBACK_STORAGE_KEY = 'feedback-form-data';

	let open = $state(false);
	let isSubmitting = $state(false);

	// Form state
	let formData = $state({
		name: '',
		email: '',
		message: ''
	});

	// Props for toast callback
	let { onFeedbackResult }: { onFeedbackResult?: (success: boolean, message: string) => void } =
		$props();

	export function openModal() {
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

				if (onFeedbackResult) {
					onFeedbackResult(true, result.message || 'Feedback sent successfully!');
				}
				open = false;
			} else {
				// Error from API
				console.error('Feedback submission error:', result);
				if (onFeedbackResult) {
					onFeedbackResult(false, result.message || 'Failed to send feedback.');
				}
			}
		} catch (error) {
			console.error('Feedback submission error:', error);
			if (onFeedbackResult) {
				onFeedbackResult(false, 'Something went wrong! Please try again.');
			}
		} finally {
			isSubmitting = false;
		}
	}

	function onCancel() {
		open = false;
	}
</script>

<Modal bind:open title="Send Feedback" size="md" outsideclose={true} autoclose={false}>
	<form onsubmit={handleSubmit}>
		<div class="space-y-4">
			<div class="text-gray-700">
				Send your feedback via this form or create an issue on
				<a
					href="https://github.com/Dave2ooo/F2LTrainer-Svelte"
					target="_blank"
					rel="noopener noreferrer"
					class="text-blue-600 hover:underline">GitHub</a
				>.
			</div>

			<div>
				<Label for="name" class="mb-2">Your Name</Label>
				<Input
					id="name"
					type="text"
					bind:value={formData.name}
					placeholder="Your Name"
					required
					disabled={isSubmitting}
				/>
			</div>

			<div>
				<Label for="email" class="mb-2">Your Email</Label>
				<Input
					id="email"
					type="email"
					bind:value={formData.email}
					placeholder="your.email@example.com"
					required
					disabled={isSubmitting}
				/>
			</div>

			<div>
				<Label for="message" class="mb-2">Your Feedback</Label>
				<Textarea
					id="message"
					bind:value={formData.message}
					placeholder="Your feedback here..."
					rows="4"
					required
					disabled={isSubmitting}
				/>
			</div>
		</div>

		<div class="mt-6 flex w-full justify-end gap-3">
			<Button type="button" color="gray" outline onclick={onCancel} disabled={isSubmitting}>
				Cancel
			</Button>
			<Button type="submit" disabled={isSubmitting}>
				{isSubmitting ? 'Sending...' : 'Send Feedback'}
			</Button>
		</div>
	</form>
</Modal>
