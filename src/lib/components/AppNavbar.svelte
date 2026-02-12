<script lang="ts">
	import {
		Button,
		Tooltip,
		Navbar,
		NavBrand,
		NavHamburger,
		NavUl,
		Popover,
		Spinner
	} from 'flowbite-svelte';
	import { resolve } from '$app/paths';
	import { page } from '$app/stores';
	import { SignedIn, SignedOut, SignInButton, useClerkContext } from 'svelte-clerk';
	import { dark } from '@clerk/themes';
	import {
		CircleQuestionMark,
		LogIn,
		LogOut,
		MessageCircle,
		Settings as SettingsIcon,
		Share2,
		UserRound
	} from '@lucide/svelte';
	import BluetoothButton from '$lib/components/BluetoothButton.svelte';
	import PwaInstall from '$lib/components/PwaInstall.svelte';
	import type Settings from '$lib/components/Modals/Settings.svelte';
	import type FeedbackModal from '$lib/components/Modals/FeedbackModal.svelte';
	import type HelpModal from '$lib/components/Modals/HelpModal.svelte';
	import { getTheme } from '$lib/theme.svelte';
	import { globalState } from '$lib/globalState.svelte';

	interface Props {
		settingsRef: Settings;
		feedbackRef: FeedbackModal;
		helpRef: HelpModal;
		onExportURL: () => void;
	}

	let { settingsRef, feedbackRef, helpRef, onExportURL }: Props = $props();

	let currentTheme = $derived(getTheme());
	let isSyncing = $derived(globalState.isSyncing);

	let appearance = $derived({
		baseTheme: currentTheme === 'dark' ? dark : undefined
	});

	const ctx = useClerkContext();
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
		<li class="mx-1 my-2 sm:my-0 xl:mx-3">
			<Button
				class="btn-icon-transparent flex items-center justify-start"
				onclick={() => settingsRef.openModal()}
			>
				<SettingsIcon class="size-8 text-primary-600 md:size-9" />
				<span class="ml-2 text-lg font-medium text-gray-900 sm:hidden xl:inline dark:text-white"
					>Settings</span
				>
			</Button>
			<Tooltip placement="bottom">Settings</Tooltip>
		</li>
		<li class="mx-1 my-2 sm:my-0 xl:mx-3">
			<Button
				class="btn-icon-transparent flex items-center justify-start"
				onclick={() => helpRef.openModal()}
			>
				<CircleQuestionMark class="size-8 text-primary-600 md:size-9" />
				<span class="ml-2 text-lg font-medium text-gray-900 sm:hidden xl:inline dark:text-white"
					>Help</span
				>
			</Button>
			<Tooltip placement="bottom">Help</Tooltip>
		</li>
		<li class="mx-1 my-2 sm:my-0 xl:mx-3">
			<Button
				class="btn-icon-transparent flex items-center justify-start"
				onclick={() => feedbackRef.openModal()}
			>
				<MessageCircle class="size-8 text-primary-600 md:size-9" />
				<span class="ml-2 text-lg font-medium text-gray-900 sm:hidden xl:inline dark:text-white"
					>Feedback</span
				>
			</Button>
			<Tooltip placement="bottom">Send Feedback</Tooltip>
		</li>
		<li class="mx-1 my-2 sm:my-0 xl:mx-3">
			<Button class="btn-icon-transparent flex items-center justify-start" onclick={onExportURL}>
				<Share2 class="size-8 text-primary-600 md:size-9" />
				<span class="ml-2 text-lg font-medium text-gray-900 sm:hidden xl:inline dark:text-white"
					>Share</span
				>
			</Button>
			<Tooltip placement="bottom">Export to URL</Tooltip>
		</li>
		<PwaInstall />

		{#if $page.url.searchParams.get('dev') === 'true'}
			<li class="my-1 block w-full border-t border-gray-200 sm:hidden dark:border-gray-600"></li>

			<SignedOut>
				<!-- Mobile: Login Item -->
				<li class="mx-1 my-2 block sm:hidden">
					<SignInButton mode="modal" {appearance}>
						<Button class="btn-icon-transparent flex items-center justify-start">
							<LogIn class="size-8 text-primary-600 md:size-9" />
							<span class="ml-2 text-lg font-medium text-gray-900 dark:text-white">Sign In</span>
						</Button>
					</SignInButton>
				</li>
				<!-- Desktop: User Button + Popover -->
				<li class="mx-1 hidden sm:block xl:mx-3">
					<Button id="user-menu-out" class="btn-icon-transparent flex items-center justify-start">
						<UserRound class="size-8 text-primary-600 md:size-9" />
					</Button>
					<Popover triggeredBy="#user-menu-out" trigger="click" placement="bottom">
						<div class="p-2">
							<SignInButton mode="modal" {appearance}>
								<Button class="flex w-full items-center justify-center gap-2 text-base">
									<LogIn class="size-5" />
									Sign In
								</Button>
							</SignInButton>
						</div>
					</Popover>
					<Tooltip placement="bottom">Sign In</Tooltip>
				</li>
			</SignedOut>

			<SignedIn>
				<!-- Mobile: Account & Logout -->
				<li class="mx-1 my-2 block sm:hidden">
					<Button
						class="btn-icon-transparent flex items-center justify-start"
						onclick={() => ctx.clerk?.openUserProfile({ appearance })}
					>
						{#if ctx.user?.imageUrl}
							<img
								src={ctx.user.imageUrl}
								alt="User Profile"
								class="size-8 rounded-full md:size-9"
							/>
						{:else}
							<UserRound class="size-8 text-primary-600 md:size-9" />
						{/if}
						<span class="ml-2 text-lg font-medium text-gray-900 dark:text-white">Account</span>
					</Button>
				</li>
				<li class="mx-1 my-2 block sm:hidden">
					<Button
						class="btn-icon-transparent flex items-center justify-start"
						onclick={() => ctx.clerk?.signOut()}
					>
						<LogOut class="size-8 text-primary-600 md:size-9" />
						<span class="ml-2 text-lg font-medium text-gray-900 dark:text-white">Logout</span>
					</Button>
				</li>

				<!-- Desktop: User Button + Popover -->
				<li class="relative mx-1 hidden sm:block xl:mx-3">
					<Button id="user-menu-in" class="btn-icon-transparent flex items-center justify-start">
						{#if ctx.user?.imageUrl}
							<img
								src={ctx.user.imageUrl}
								alt="User Profile"
								class="size-8 rounded-full md:size-9"
							/>
						{:else}
							<UserRound class="size-8 text-primary-600 md:size-9" />
						{/if}
					</Button>
					{#if isSyncing}
						<div class="pointer-events-none absolute inset-0 flex items-center justify-center">
							<Spinner color="primary" class="size-8 md:size-9" />
						</div>
					{/if}
					<Popover triggeredBy="#user-menu-in" trigger="click" placement="bottom">
						<div class="flex min-w-[150px] flex-col gap-2 p-2">
							<Button
								onclick={() => ctx.clerk?.openUserProfile({ appearance })}
								color="alternative"
								class="flex items-center gap-2 text-base"
							>
								<UserRound class="size-5" />
								Account Settings
							</Button>
							<Button
								onclick={() => ctx.clerk?.signOut()}
								color="red"
								class="flex items-center gap-2 text-base"
							>
								<LogOut class="size-5" />
								Logout
							</Button>
						</div>
					</Popover>
				</li>
			</SignedIn>
		{/if}
	</NavUl>
</Navbar>
