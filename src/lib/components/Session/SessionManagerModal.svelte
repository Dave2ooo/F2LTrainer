<script lang="ts">
	import { tick } from 'svelte';
	import { Button, Tabs, TabItem, Input, Select, Label } from 'flowbite-svelte';
	import Modal from '$lib/components/Modal.svelte';
	import { sessionState } from '$lib/sessionState.svelte';
	import { statisticsState } from '$lib/statisticsState.svelte';
	import Update from '$lib/components/Modals/Buttons/Update.svelte';
	import {
		Copy,
		RotateCcw,
		Trash2,
		Archive,
		Star,
		Edit2,
		Check,
		X,
		GitMerge,
		Settings,
		Bluetooth
	} from '@lucide/svelte';
	import ConfirmationModal from '$lib/components/Modals/ConfirmationModal.svelte';
	import SessionSettingsModal from '$lib/components/Session/SessionSettingsModal.svelte';
	import { getNumberOfSelectedCases } from '$lib/trainCaseQueue.svelte';
	import type { SessionSettings } from '$lib/types/session';

	let { open = $bindable() }: { open: boolean } = $props();

	// For permanent deletion confirmation
	let showDeleteConfirmation = $state(false);
	let sessionToDelete = $state<{ id: string; name: string; solveCount: number } | null>(null);

	// For clearing all archived sessions
	let showClearAllConfirmation = $state(false);

	// For renaming
	let editingSessionId = $state<string | null>(null);
	let editingSessionName = $state('');

	// For merging sessions
	let showMergeModal = $state(false);
	let mergeSourceId = $state<string>('');
	let mergeTargetId = $state<string>('');

	// For settings
	let showSettingsModal = $state(false);
	let settingsSessionId = $state<string | undefined>(undefined);

	let activeSessionsList = $state<HTMLElement>();
	// Derived lists - sorted by last played (most recent first) to match dropdown order
	const activeSessions = $derived(
		sessionState.sessions
			.filter((s) => !s.archived)
			.sort((a, b) => (b.lastPlayedAt || 0) - (a.lastPlayedAt || 0))
	);
	const archivedSessions = $derived(sessionState.sessions.filter((s) => s.archived));

	// Optimization: specific solve counts for each session mapped by ID
	// This reduces complexity from O(Sessions * Solves) to O(Solves)
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

	async function handleDuplicate(sessionId: string) {
		const newSession = sessionState.duplicateSession(sessionId);
		if (newSession) {
			startEditingSession(newSession.id, newSession.name);
			await tick();
			activeSessionsList?.firstElementChild?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
		}
	}

	function handleArchive(sessionId: string) {
		// Check if it's the last active session
		if (activeSessions.length <= 1) {
			alert('Cannot archive the last active session.');
			return;
		}
		sessionState.deleteSession(sessionId);
	}

	function handleRestore(sessionId: string) {
		sessionState.restoreSession(sessionId);
	}

	function handleToggleFavorite(sessionId: string) {
		sessionState.toggleFavorite(sessionId);
	}

	function handlePermanentDeleteRequest(sessionId: string, sessionName: string) {
		const solveCount = solveCounts[sessionId] || 0;
		sessionToDelete = { id: sessionId, name: sessionName, solveCount };
		showDeleteConfirmation = true;
	}

	function handlePermanentDeleteConfirm() {
		if (sessionToDelete) {
			// First, delete all solves for this session
			statisticsState.clearSession(sessionToDelete.id);
			// Then, hard delete the session itself
			sessionState.hardDeleteSession(sessionToDelete.id);
			sessionToDelete = null;
		}
	}

	// Calculate total solves across all archived sessions
	const totalArchivedSolves = $derived(
		archivedSessions.reduce((total, session) => total + (solveCounts[session.id] || 0), 0)
	);

	function handleClearAllArchivedRequest() {
		showClearAllConfirmation = true;
	}

	function handleClearAllArchivedConfirm() {
		// Delete all solves and sessions for archived sessions
		for (const session of archivedSessions) {
			statisticsState.clearSession(session.id);
			sessionState.hardDeleteSession(session.id);
		}
	}

	function startEditingSession(sessionId: string, currentName: string) {
		editingSessionId = sessionId;
		editingSessionName = currentName || 'Unnamed Session';
	}

	function saveEditSession() {
		if (!editingSessionId) return;

		const trimmedName = editingSessionName.trim();
		if (!trimmedName) {
			// Don't allow empty names - revert to original
			cancelEditSession();
			return;
		}

		sessionState.updateSession(editingSessionId, { name: trimmedName });
		editingSessionId = null;
		editingSessionName = '';
	}

	function cancelEditSession() {
		editingSessionId = null;
		editingSessionName = '';
	}

	function formatDate(timestamp: number | undefined): string {
		if (!timestamp) return 'Never';

		const now = Date.now();
		const diffMs = now - timestamp;
		const diffMinutes = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMs / 3600000);

		// If within 24 hours, show relative time
		if (diffHours < 24) {
			if (diffMinutes < 1) return 'Just now';
			if (diffMinutes < 60) return `${diffMinutes}m ago`;
			return `${diffHours}h ago`;
		}

		// Otherwise show date without year
		return new Date(timestamp).toLocaleDateString(undefined, {
			month: 'short',
			day: 'numeric'
		});
	}

	// Merge sessions functionality
	const mergeSourceSolveCount = $derived(mergeSourceId ? solveCounts[mergeSourceId] || 0 : 0);

	const mergeSourceName = $derived(
		activeSessions.find((s) => s.id === mergeSourceId)?.name || 'Unnamed Session'
	);

	const mergeTargetName = $derived(
		activeSessions.find((s) => s.id === mergeTargetId)?.name || 'Unnamed Session'
	);

	const canMerge = $derived(mergeSourceId && mergeTargetId && mergeSourceId !== mergeTargetId);

	function openMergeModal() {
		// Pre-select first two sessions if available
		mergeSourceId = activeSessions[0]?.id || '';
		mergeTargetId = activeSessions[1]?.id || '';
		showMergeModal = true;
	}

	function handleMerge() {
		if (!canMerge) return;

		// Move all solves from source to target
		statisticsState.moveSessionSolves(mergeSourceId, mergeTargetId);

		// Delete the source session (it now has 0 solves)
		sessionState.hardDeleteSession(mergeSourceId);

		// Close the modal and reset
		showMergeModal = false;
		mergeSourceId = '';
		mergeTargetId = '';
	}

	function handleOpenSettings(sessionId: string) {
		settingsSessionId = sessionId;
		showSettingsModal = true;
	}

	// Helper to get case count for a specific session
	function getSessionCaseCount(settings: SessionSettings): number {
		const caseMode = settings.caseMode || 'group';
		const selectedCases = settings.selectedCases || {};

		if (caseMode === 'individual') {
			return Object.values(selectedCases).filter(Boolean).length;
		} else {
			// For group mode, count cases based on selections
			// We'll need to import the logic from trainCaseQueue
			return getNumberOfSelectedCases();
		}
	}

	// Format session configuration as text
	function formatSessionConfig(settings: SessionSettings): string {
		const parts: string[] = [];

		// Case count
		const caseCount = getSessionCaseCount(settings);
		parts.push(`${caseCount} case${caseCount === 1 ? '' : 's'}`);

		// Train activity (note: Bluetooth icon will be shown inline, not in text)
		if (settings.trainMode === 'drill') {
			parts.push('Drill');
		} else {
			parts.push('Classic');
		}

		// Recap mode
		if (settings.frequencyMode === 'recap') {
			parts.push('Recap');
		}

		return parts.join(' • ');
	}
</script>

<Modal
	bind:open
	title="Session Manager"
	size="lg"
	outsideclose={true}
	placement="top-center"
	class="mt-8"
>
	<Tabs
		tabStyle="underline"
		classes={{
			content: 'p-0 bg-gray-50 rounded-lg dark:bg-gray-800 mt-0'
		}}
	>
		<TabItem open title="Active ({activeSessions.length})">
			<div class="mt-4 flex flex-col gap-2" bind:this={activeSessionsList}>
				{#if activeSessions.length === 0}
					<p class="py-8 text-center text-gray-500 dark:text-gray-400">No active sessions</p>
				{:else}
					{#each activeSessions as session (session.id)}
						<div
							class="flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800"
						>
							{#if editingSessionId === session.id}
								<!-- Editing mode -->
								<Input type="text" bind:value={editingSessionName} class="flex-1" maxlength={60} />
								<div class="flex shrink-0 items-center gap-1">
									<Button size="xs" color="green" onclick={saveEditSession}>
										<Check class="size-4" />
									</Button>
									<Button size="xs" color="alternative" onclick={cancelEditSession}>
										<X class="size-4" />
									</Button>
								</div>
							{:else}
								<!-- Display mode -->
								<div class="min-w-0 flex-1">
									<div class="flex items-center gap-2">
										<span class="truncate font-medium text-gray-900 dark:text-white">
											{session.name || 'Unnamed Session'}
										</span>
										{#if session.id === sessionState.activeSessionId}
											<span
												class="shrink-0 rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-800 dark:bg-primary-900 dark:text-primary-300"
											>
												Active
											</span>
										{/if}
									</div>
									<!-- Session config badges -->
									<div class="mt-1.5 flex flex-wrap items-center gap-1.5">
										<!-- Case count -->
										<span
											class="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300"
										>
											{(() => {
												const caseCount = getSessionCaseCount(session.settings);
												return `${caseCount} case${caseCount === 1 ? '' : 's'}`;
											})()}
										</span>
										<!-- Training mode -->
										{#if session.settings.trainMode === 'drill'}
											<span
												class="inline-flex items-center gap-1 rounded-md bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
											>
												{#if session.settings.smartCubeEnabled}
													<Bluetooth class="size-3" />
												{/if}
												Drill
											</span>
										{:else}
											<span
												class="inline-flex items-center gap-1 rounded-md bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
											>
												{#if session.settings.smartCubeEnabled}
													<Bluetooth class="size-3" />
												{/if}
												Practice
											</span>
										{/if}
										<!-- Recap mode -->
										{#if session.settings.frequencyMode === 'recap'}
											<span
												class="inline-flex items-center gap-1 rounded-md bg-cyan-100 px-2 py-0.5 text-xs font-medium text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300"
											>
												Recap
											</span>
										{/if}
									</div>
									<p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
										{solveCounts[session.id] || 0} solve{(solveCounts[session.id] || 0) === 1
											? ''
											: 's'} • Last played: {formatDate(session.lastPlayedAt)}
									</p>
								</div>
								<div class="grid shrink-0 grid-cols-3 gap-1 sm:flex sm:items-center">
									<Button
										color="alternative"
										size="xs"
										class="!p-2 {session.favorite
											? 'text-yellow-500 hover:text-yellow-600'
											: 'text-gray-400 hover:text-yellow-500'}"
										title={session.favorite ? 'Remove from favorites' : 'Add to favorites'}
										onclick={() => handleToggleFavorite(session.id)}
									>
										<Star class="size-4" fill={session.favorite ? 'currentColor' : 'none'} />
									</Button>
									<Button
										color="alternative"
										size="xs"
										class="!p-2"
										title="Session settings"
										onclick={() => handleOpenSettings(session.id)}
									>
										<Settings class="size-4" />
									</Button>
									<Button
										color="alternative"
										size="xs"
										class="!p-2"
										title="Rename session"
										onclick={() => startEditingSession(session.id, session.name)}
									>
										<Edit2 class="size-4" />
									</Button>
									<Button
										color="alternative"
										size="xs"
										class="!p-2"
										title="Duplicate session"
										onclick={() => handleDuplicate(session.id)}
									>
										<Copy class="size-4" />
									</Button>
									<Button
										color="alternative"
										size="xs"
										class="!p-2 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
										title="Archive session"
										onclick={() => handleArchive(session.id)}
										disabled={activeSessions.length <= 1}
									>
										<Archive class="size-4" />
									</Button>
								</div>
							{/if}
						</div>
					{/each}
					<!-- Merge Sessions button -->
					{#if activeSessions.length >= 2}
						<div class="mt-4 flex justify-end border-t border-gray-200 pt-4 dark:border-gray-700">
							<Button color="alternative" size="sm" onclick={openMergeModal}>
								<GitMerge class="mr-2 size-4" /> Merge Sessions
							</Button>
						</div>
					{/if}
				{/if}
			</div>
		</TabItem>

		<TabItem title="Archived ({archivedSessions.length})">
			<div class="mt-4 flex flex-col gap-2">
				{#if archivedSessions.length === 0}
					<p class="py-8 text-center text-gray-500 dark:text-gray-400">No archived sessions</p>
				{:else}
					{#each archivedSessions as session (session.id)}
						<div
							class="flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900"
						>
							<div class="min-w-0 flex-1">
								<span class="truncate font-medium text-gray-600 dark:text-gray-400">
									{session.name || 'Unnamed Session'}
								</span>
								<!-- Session config badges (archived) -->
								<div class="mt-1.5 flex flex-wrap items-center gap-1.5">
									<!-- Case count -->
									<span
										class="inline-flex items-center gap-1 rounded-md bg-gray-100/50 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700/50 dark:text-gray-400"
									>
										{(() => {
											const caseCount = getSessionCaseCount(session.settings);
											return `${caseCount} case${caseCount === 1 ? '' : 's'}`;
										})()}
									</span>
									<!-- Training mode -->
									{#if session.settings.trainMode === 'drill'}
										<span
											class="inline-flex items-center gap-1 rounded-md bg-purple-100/50 px-2 py-0.5 text-xs font-medium text-purple-600 dark:bg-purple-900/20 dark:text-purple-400"
										>
											{#if session.settings.smartCubeEnabled}
												<Bluetooth class="size-3" />
											{/if}
											Drill
										</span>
									{:else}
										<span
											class="inline-flex items-center gap-1 rounded-md bg-blue-100/50 px-2 py-0.5 text-xs font-medium text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
										>
											{#if session.settings.smartCubeEnabled}
												<Bluetooth class="size-3" />
											{/if}
											Practice
										</span>
									{/if}
									<!-- Recap mode -->
									{#if session.settings.frequencyMode === 'recap'}
										<span
											class="inline-flex items-center gap-1 rounded-md bg-cyan-100/50 px-2 py-0.5 text-xs font-medium text-cyan-600 dark:bg-cyan-900/20 dark:text-cyan-400"
										>
											Recap
										</span>
									{/if}
								</div>
								<p class="mt-1 text-xs text-gray-400 dark:text-gray-500">
									{solveCounts[session.id] || 0} solve{(solveCounts[session.id] || 0) === 1
										? ''
										: 's'} • Archived • Last played: {formatDate(session.lastPlayedAt)}
								</p>
							</div>
							<div class="flex shrink-0 items-center gap-1">
								<Button
									color="alternative"
									size="xs"
									class="!p-2 text-green-600 hover:text-green-700 dark:text-green-500 dark:hover:text-green-400"
									title="Restore session"
									onclick={() => handleRestore(session.id)}
								>
									<RotateCcw class="size-4" />
								</Button>
								<Button
									color="alternative"
									size="xs"
									class="!p-2 text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400"
									title="Delete permanently"
									onclick={() =>
										handlePermanentDeleteRequest(session.id, session.name || 'Unnamed Session')}
								>
									<Trash2 class="size-4" />
								</Button>
							</div>
						</div>
					{/each}
					<!-- Empty Archive button -->
					<div class="mt-4 flex justify-end border-t border-gray-200 pt-4 dark:border-gray-700">
						<Button color="red" outline size="sm" onclick={handleClearAllArchivedRequest}>
							<Trash2 class="mr-2 size-4" /> Empty Archive
						</Button>
					</div>
				{/if}
			</div>
		</TabItem>
	</Tabs>
</Modal>

{#if settingsSessionId}
	<SessionSettingsModal bind:open={showSettingsModal} sessionId={settingsSessionId} />
{/if}

<ConfirmationModal
	bind:open={showDeleteConfirmation}
	title="Permanently Delete Session?"
	message="Are you sure you want to permanently delete '{sessionToDelete?.name}'? This will also delete {sessionToDelete?.solveCount ??
		0} solve{(sessionToDelete?.solveCount ?? 0) === 1 ? '' : 's'} and cannot be undone."
	confirmText="Delete Forever"
	confirmColor="red"
	onConfirm={handlePermanentDeleteConfirm}
/>

<ConfirmationModal
	bind:open={showClearAllConfirmation}
	title="Empty Archive?"
	message="Are you sure you want to permanently delete ALL {archivedSessions.length} archived session{archivedSessions.length ===
	1
		? ''
		: 's'}? This will also delete {totalArchivedSolves} solve{totalArchivedSolves === 1
		? ''
		: 's'}. This action cannot be undone."
	confirmText="Delete All"
	confirmColor="red"
	onConfirm={handleClearAllArchivedConfirm}
/>

<!-- Merge Sessions Modal -->
<Modal bind:open={showMergeModal} title="Merge Sessions" size="md" outsideclose={true}>
	<div class="flex flex-col gap-6">
		<p class="text-sm text-gray-500 dark:text-gray-400">
			Move all solves from the source session to the target session. The source session will be
			deleted after the merge.
		</p>

		<div class="flex flex-col gap-4">
			<div>
				<Label for="merge-source" class="mb-2">Source Session (will be deleted)</Label>
				<Select
					id="merge-source"
					bind:value={mergeSourceId}
					items={activeSessions.map((s) => ({
						value: s.id,
						name: `${s.name || 'Unnamed Session'} (${solveCounts[s.id] || 0} solves)`
					}))}
				/>
			</div>

			<div>
				<Label for="merge-target" class="mb-2">Target Session (will receive solves)</Label>
				<Select
					id="merge-target"
					bind:value={mergeTargetId}
					items={activeSessions.map((s) => ({
						value: s.id,
						name: `${s.name || 'Unnamed Session'} (${solveCounts[s.id] || 0} solves)`
					}))}
				/>
			</div>
		</div>

		{#if canMerge}
			<div
				class="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20"
			>
				<h4 class="mb-2 font-medium text-blue-800 dark:text-blue-300">Preview</h4>
				<ul class="space-y-1 text-sm text-blue-700 dark:text-blue-400">
					<li>
						• {mergeSourceSolveCount} solve{mergeSourceSolveCount === 1 ? '' : 's'} will be moved
					</li>
					<li>• "{mergeSourceName}" will be deleted</li>
					<li>• "{mergeTargetName}" will keep its settings</li>
				</ul>
			</div>
		{:else if mergeSourceId === mergeTargetId && mergeSourceId}
			<div
				class="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20"
			>
				<p class="text-sm text-yellow-700 dark:text-yellow-400">
					Source and target must be different sessions.
				</p>
			</div>
		{/if}

		<Update
			submitText="Merge"
			Icon={GitMerge}
			onSubmit={handleMerge}
			onCancel={() => (showMergeModal = false)}
			disabled={!canMerge}
		/>
	</div>
</Modal>
