<script lang="ts">
	import { getNumberOfSelectedCases, regenerateTrainCaseQueue } from '$lib/trainCaseQueue.svelte';
	import type { SessionSettings } from '$lib/types/session';
	import { Button, P } from 'flowbite-svelte';
	import { Dropdown, DropdownItem, DropdownDivider, DropdownHeader } from 'flowbite-svelte';
	import { sessionState } from '$lib/sessionState.svelte';
	import { Settings as SettingsIcon, Edit2, Plus, ChevronDown } from '@lucide/svelte';
	import SessionSettingsModal from '$lib/components/Session/SessionSettingsModal.svelte';

	import TrainClassic from './TrainClassic.svelte';
	import TrainClassicSmart from './TrainClassicSmart.svelte';
	import TrainDrill from './TrainDrill.svelte';

	let showSessionSettings = $state(false);
	let isNewSession = $state(false);



	let activeSettings = $derived(sessionState.activeSession?.settings as SessionSettings | undefined);

	$effect(() => {
		// Regenerate queue when session changes to apply new settings (colors, selected cases)
		// We use the ID as a key trigger
		if (sessionState.activeSessionId !== null) {
			regenerateTrainCaseQueue();
		}
	});
</script>

<!-- Session Toolbar -->
<div class="relative z-40 mb-4 flex w-full items-center justify-center px-4 py-2">
	<div class="flex items-center gap-2">
		<div class="relative">
			<Button
				color="light"
				class="flex items-center gap-2 border-gray-300 bg-white !px-3 font-medium text-gray-900 shadow-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
			>
				<span class="max-w-[150px] truncate sm:max-w-[200px]"
					>{sessionState.activeSession?.name || 'Default Session'}</span
				>
				<ChevronDown size={14} class="text-gray-500 dark:text-gray-400" />
			</Button>
			<Dropdown
				class="w-60 rounded-lg border border-gray-200 bg-white shadow-xl dark:border-gray-600 dark:bg-gray-700"
			>
				<DropdownHeader
					class="border-b border-gray-200 bg-gray-50 text-xs font-semibold tracking-wider text-gray-500 uppercase dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400"
					>Switch Session</DropdownHeader
				>
				{#each sessionState.sessions.filter((s) => !s.archived) as session (session.id)}
					<DropdownItem
						class="flex !list-none items-center justify-between gap-3 font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-600"
						onclick={() => sessionState.setActiveSession(session.id)}
					>
						<span class="max-w-[200px] flex-1 truncate">{session.name || 'Unnamed Session'}</span>
						{#if session.id === sessionState.activeSessionId}
							<!-- Simple indicator for active session -->
							<span class="h-2 w-2 flex-shrink-0 rounded-full bg-primary-600 dark:bg-primary-500"
							></span>
						{/if}
					</DropdownItem>
				{/each}
				{#if sessionState.sessions.filter((s) => !s.archived).length > 1}
					<DropdownDivider class="border-gray-200 dark:border-gray-600" />
				{/if}
				<DropdownItem
					class="hover:bg-gray-100 dark:hover:bg-gray-600"
					onclick={() => {
                        // Don't create session yet, let the modal handle it on save
						isNewSession = true;
						showSessionSettings = true;
					}}
				>
					<div class="flex items-center gap-2 font-semibold text-primary-600 dark:text-primary-400">
						<Plus size={16} /> Create New Session
					</div>
				</DropdownItem>
			</Dropdown>
		</div>

		<Button
			color="light"
			size="sm"
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

{#if sessionState.activeSessionId !== null || isNewSession}
	<SessionSettingsModal
		bind:open={showSessionSettings}
		sessionId={isNewSession ? undefined : sessionState.activeSessionId ?? undefined}
		isNew={isNewSession}
	/>
{/if}

{#if getNumberOfSelectedCases() > 0}
	{#if activeSettings}
		{#if activeSettings.trainMode === 'drill'}
			<TrainDrill />
		{:else if activeSettings.smartCubeEnabled}
			<TrainClassicSmart />
		{:else}
			<!-- Default or Classic Mode -->
			<TrainClassic />
		{/if}
	{:else}
		<!-- Fallback if no settings loaded (should happen rarely/briefly) -->
		<TrainClassic />
	{/if}
{:else}
	<P>No training cases available. Please select some cases first.</P>
{/if}

<style>
	/* Remove list markers from dropdown items */
	:global(li::marker) {
		display: none;
		content: '';
	}
</style>
