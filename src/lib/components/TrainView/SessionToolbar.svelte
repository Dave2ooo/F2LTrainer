<script lang="ts">
	import { Button } from 'flowbite-svelte';
	import { Dropdown, DropdownItem, DropdownHeader, DropdownGroup } from 'flowbite-svelte';
	import { sessionState } from '$lib/sessionState.svelte';
	import { statisticsState } from '$lib/statisticsState.svelte';
	import { getNumberOfSelectedCases } from '$lib/trainCaseQueue.svelte';
	import { bluetoothState } from '$lib/bluetooth/store.svelte';
	import {
		Settings2 as SettingsIcon,
		Plus,
		ChevronDown,
		FolderCog,
		Star,
		Bluetooth
	} from '@lucide/svelte';

	interface Props {
		isDrillRunning?: boolean;
		showSessionSettings: boolean;
		isNewSession: boolean;
		showSessionManager: boolean;
	}

	let {
		isDrillRunning = false,
		showSessionSettings = $bindable(),
		isNewSession = $bindable(),
		showSessionManager = $bindable()
	}: Props = $props();

	// Calculate solve counts per session for efficient lookup
	const solveCounts = $derived(
		statisticsState.allSolves.reduce(
			(acc, solve) => {
				const sid = solve.sessionId;
				if (sid) acc[sid] = (acc[sid] || 0) + 1;
				return acc;
			},
			{} as Record<string, number>
		)
	);
</script>

<!-- Session Toolbar -->
<div class="relative z-40 mb-0 flex w-full items-center justify-center px-4 py-2">
	<div class="flex items-center gap-2">
		<div class="relative">
			<Button
				color="light"
				disabled={isDrillRunning}
				class="flex items-center gap-2 border-gray-300 bg-white !px-3 font-medium text-gray-900 shadow-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
			>
				<span class="max-w-[150px] truncate sm:max-w-[200px]"
					>{sessionState.activeSession?.name || 'Default Session'}</span
				>
				<ChevronDown size={14} class="text-gray-500 dark:text-gray-400" />
			</Button>
			<Dropdown
				class="w-80 max-w-[95vw] rounded-lg border border-gray-200 bg-white shadow-xl dark:border-gray-600 dark:bg-gray-700"
			>
				<DropdownHeader
					class="border-b border-gray-200 bg-gray-50 text-xs font-semibold tracking-wider text-gray-500 uppercase dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400"
					>Switch Session</DropdownHeader
				>
				<DropdownGroup class="max-h-[calc(100dvh-18rem)] overflow-y-auto">
					{#each sessionState.sessions
						.filter((s) => !s.archived && !s.deleted)
						.sort((a, b) => {
							if (a.favorite && !b.favorite) return -1;
							if (!a.favorite && b.favorite) return 1;
							return (b.lastPlayedAt || 0) - (a.lastPlayedAt || 0);
						}) as session (session.id)}
						<DropdownItem
							class="flex w-full items-center justify-between gap-3 font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-600"
							onclick={() => sessionState.setActiveSession(session.id)}
						>
							<div class="flex min-w-0 flex-1 flex-col gap-0.5">
								<div class="flex items-center gap-2">
									{#if session.favorite}
										<Star size={12} class="shrink-0 text-yellow-500" fill="currentColor" />
									{/if}
									<span class="max-w-[180px] truncate">{session.name || 'Unnamed Session'}</span>
								</div>
								<!-- Session config badges -->
								<div class="flex flex-wrap items-center gap-0">
									<!-- Case count -->
									<span
										class="inline-flex items-center gap-1 rounded-md bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300"
									>
										{getNumberOfSelectedCases(session.settings)} cases
									</span>
									<!-- Training mode -->
									{#if session.settings.trainMode === 'drill'}
										<span
											class="inline-flex items-center gap-1 rounded-md bg-purple-100 px-1.5 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
										>
											<Bluetooth size={10} />
											Drill
										</span>
									{:else}
										<span
											class="inline-flex items-center gap-1 rounded-md bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
										>
											Practice
										</span>
									{/if}
									<!-- Recap mode -->
									{#if session.settings.frequencyMode === 'recap'}
										<span
											class="inline-flex items-center gap-1 rounded-md bg-cyan-100 px-1.5 py-0.5 text-xs font-medium text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300"
										>
											Recap
										</span>
									{/if}
									<!-- Solve count -->
									<span
										class="inline-flex items-center gap-1 rounded-md bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300"
									>
										{(() => {
											const solveCount = solveCounts[session.id] || 0;
											return `${solveCount} solve${solveCount === 1 ? '' : 's'}`;
										})()}
									</span>
								</div>
							</div>
							{#if session.id === sessionState.activeSessionId}
								<!-- Simple indicator for active session -->
								<span class="h-2 w-2 flex-shrink-0 rounded-full bg-primary-600 dark:bg-primary-500"
								></span>
							{/if}
						</DropdownItem>
					{/each}
				</DropdownGroup>
				<DropdownItem
					class="w-full bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-600"
					onclick={() => {
						// Don't create session yet, let the modal handle it on save
						isNewSession = true;
						showSessionSettings = true;
					}}
				>
					<div
						class="flex w-full items-center gap-2 font-semibold text-primary-600 dark:text-primary-400"
					>
						<Plus size={16} /> Create New Session
					</div>
				</DropdownItem>
				<DropdownItem
					class="w-full bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-600"
					onclick={() => (showSessionManager = true)}
				>
					<div class="flex w-full items-center gap-2 text-gray-600 dark:text-gray-400">
						<FolderCog size={16} /> Manage Sessions
					</div>
				</DropdownItem>
			</Dropdown>
		</div>

		<Button
			color="light"
			size="sm"
			disabled={isDrillRunning}
			class="border-gray-300 bg-white !p-2.5 shadow-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600"
			onclick={() => {
				showSessionSettings = true;
				isNewSession = false;
			}}
		>
			<SettingsIcon size={16} class="text-gray-600 dark:text-gray-300" />
		</Button>
	</div>
</div>

<style>
	/* Remove list markers from dropdown items */
	:global(li::marker) {
		display: none;
		content: '';
	}
</style>
