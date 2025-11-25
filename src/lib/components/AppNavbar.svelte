<script lang="ts">
	import { Button, Tooltip, Navbar, NavBrand, NavHamburger, NavUl } from 'flowbite-svelte';
	import { base } from '$app/paths';
	import { MessageCircle, Settings as SettingsIcon, Share2 } from '@lucide/svelte';
	import PwaInstall from '$lib/components/PwaInstall.svelte';
	import type Settings from '$lib/components/Modals/Settings.svelte';
	import type FeedbackModal from '$lib/components/Modals/FeedbackModal.svelte';

	interface Props {
		settingsRef: Settings;
		feedbackRef: FeedbackModal;
		onExportURL: () => void;
	}

	let { settingsRef, feedbackRef, onExportURL }: Props = $props();
</script>

<Navbar fluid={true} color="none" class="bg-gray-100 px-4 py-2 md:py-0 dark:bg-gray-900">
	<NavBrand>
		<img src="{base}/logo.svg" class="me-3 h-9 sm:h-12" alt="F2L Trainer Logo" />
		<span class="self-center whitespace-nowrap text-xl md:text-3xl font-semibold dark:text-white"
			>F2L Trainer</span
		>
	</NavBrand>
	<div class="ml-auto flex items-center gap-2">
		<Button
			class="bg-transparent p-1 hover:bg-transparent dark:bg-transparent dark:hover:bg-transparent"
			onclick={() => settingsRef.openModal()}
			><SettingsIcon class="size-8 text-primary-600 md:size-9" /></Button
		>
		<Tooltip placement="bottom">Settings</Tooltip>
		<NavHamburger
			class="p-1 text-primary-600 hover:bg-transparent dark:text-primary-600 dark:hover:bg-transparent [&>svg]:size-8 md:[&>svg]:size-10"
		/>
	</div>
	<NavUl>
		<li class="mx-1 my-2 md:my-0">
			<Button
				class="flex items-center justify-start bg-transparent p-1 hover:bg-transparent dark:bg-transparent dark:hover:bg-transparent"
				onclick={() => feedbackRef.openModal()}
			>
				<MessageCircle class="size-8 text-primary-600 md:size-9" />
				<span class="ml-4 text-lg font-medium text-gray-900 dark:text-white md:hidden">Send Feedback</span>
			</Button>
			<Tooltip placement="bottom">Send Feedback</Tooltip>
		</li>
		<li class="mx-1 my-2 md:my-0">
			<Button
				class="flex items-center justify-start bg-transparent p-1 hover:bg-transparent dark:bg-transparent dark:hover:bg-transparent"
				onclick={onExportURL}
			>
				<Share2 class="size-8 text-primary-600 md:size-9" />
				<span class="ml-4 text-lg font-medium text-gray-900 dark:text-white md:hidden">Export to URL</span>
			</Button>
			<Tooltip placement="bottom">Export to URL</Tooltip>
		</li>
		<li class="mx-1">
			<PwaInstall />
		</li>
	</NavUl>
</Navbar>
