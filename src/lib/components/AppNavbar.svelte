<script lang="ts">
	import { Button, Tooltip, Navbar, NavBrand, NavHamburger, NavUl } from 'flowbite-svelte';
	import { resolve } from '$app/paths';
	import {
		CircleQuestionMark,
		MessageCircle,
		Settings as SettingsIcon,
		Share2
	} from '@lucide/svelte';
	import BluetoothButton from '$lib/components/BluetoothButton.svelte';
	import PwaInstall from '$lib/components/PwaInstall.svelte';
	import type Settings from '$lib/components/Modals/Settings.svelte';
	import type FeedbackModal from '$lib/components/Modals/FeedbackModal.svelte';
	import type HelpModal from '$lib/components/Modals/HelpModal.svelte';

	interface Props {
		settingsRef: Settings;
		feedbackRef: FeedbackModal;
		helpRef: HelpModal;
		onExportURL: () => void;
	}

	let { settingsRef, feedbackRef, helpRef, onExportURL }: Props = $props();
</script>

<Navbar
	breakpoint="sm"
	fluid={true}
	color="none"
	class="bg-gray-100 px-4 py-2 sm:py-0 sm:pr-0 md:pr-2 dark:bg-gray-900"
>
	<NavBrand>
		<img src={resolve(`/logo.svg`, {})} class="me-3 h-9 md:h-12" alt="F2L Trainer Logo" />
		<span
			class="hidden self-center text-xl font-semibold whitespace-nowrap sm:block md:text-3xl dark:text-white"
			>F2L Trainer</span
		>
	</NavBrand>
	<div class="ml-auto flex items-center gap-2">
		<BluetoothButton />
		<div class="h-6 w-px bg-gray-300 dark:bg-gray-700"></div>
		<NavHamburger
			class="p-1 text-primary-600 hover:bg-transparent dark:text-primary-600 dark:hover:bg-transparent [&>svg]:size-8 md:[&>svg]:size-10"
		/>
	</div>
	<NavUl>
		<li class="mx-1 my-2 sm:my-0">
			<Button
				class="btn-icon-transparent flex items-center justify-start"
				onclick={() => settingsRef.openModal()}
			>
				<SettingsIcon class="size-8 text-primary-600 md:size-9" />
				<span class="ml-4 text-lg font-medium text-gray-900 sm:hidden dark:text-white"
					>Settings</span
				>
			</Button>
			<Tooltip placement="bottom">Settings</Tooltip>
		</li>
		<li class="mx-1 my-2 sm:my-0">
			<Button
				class="btn-icon-transparent flex items-center justify-start"
				onclick={() => helpRef.openModal()}
			>
				<CircleQuestionMark class="size-8 text-primary-600 md:size-9" />
				<span class="ml-4 text-lg font-medium text-gray-900 sm:hidden dark:text-white">Help</span>
			</Button>
			<Tooltip placement="bottom">Help</Tooltip>
		</li>
		<li class="mx-1 my-2 sm:my-0">
			<Button
				class="btn-icon-transparent flex items-center justify-start"
				onclick={() => feedbackRef.openModal()}
			>
				<MessageCircle class="size-8 text-primary-600 md:size-9" />
				<span class="ml-4 text-lg font-medium text-gray-900 sm:hidden dark:text-white"
					>Send Feedback</span
				>
			</Button>
			<Tooltip placement="bottom">Send Feedback</Tooltip>
		</li>
		<li class="mx-1 my-2 sm:my-0">
			<Button class="btn-icon-transparent flex items-center justify-start" onclick={onExportURL}>
				<Share2 class="size-8 text-primary-600 md:size-9" />
				<span class="ml-4 text-lg font-medium text-gray-900 sm:hidden dark:text-white"
					>Export to URL</span
				>
			</Button>
			<Tooltip placement="bottom">Export to URL</Tooltip>
		</li>
		<li class="mx-1">
			<PwaInstall />
		</li>
	</NavUl>
</Navbar>
