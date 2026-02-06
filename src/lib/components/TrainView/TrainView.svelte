<script lang="ts">
	import { getNumberOfSelectedCases, regenerateTrainCaseQueue } from '$lib/trainCaseQueue.svelte';
	import type { SessionSettings } from '$lib/types/session';
	import { P } from 'flowbite-svelte';
	import { sessionState } from '$lib/sessionState.svelte';
	import SessionSettingsModal from '$lib/components/Session/SessionSettingsModal.svelte';
	import SessionManagerModal from '$lib/components/Session/SessionManagerModal.svelte';
	import { bluetoothState } from '$lib/bluetooth/store.svelte';

	import SessionToolbar from './SessionToolbar.svelte';
	import TrainClassic from './TrainClassic.svelte';
	import TrainClassicSmart from './TrainClassicSmart.svelte';
	import TrainDrill from './TrainDrill.svelte';
	import ResponsiveLayout from './ResponsiveLayout.svelte';

	let showSessionSettings = $state(false);
	let isNewSession = $state(false);
	let showSessionManager = $state(false);

	// Track if drill is running to disable session controls
	let isDrillRunning = $state(false);

	let activeSettings = $derived(
		sessionState.activeSession?.settings as SessionSettings | undefined
	);

	import { untrack } from 'svelte';

	$effect(() => {
		// Regenerate queue when session changes to apply new settings (colors, selected cases)
		// We track activeSessionId specifically.
		const id = sessionState.activeSessionId;
		// Also track settings to regenerate queue when they are updated (e.g. via modal)
		// This ensures changes to colors, case selection, etc. are applied immediately.
		// NOTE: This causes the queue (and progress) to reset when saving settings, which is generally desired for consistency.
		const settings = sessionState.activeSession?.settings;

		if (id !== null) {
			untrack(() => {
				regenerateTrainCaseQueue();
			});
		}
	});
</script>

{#snippet sessionToolbar()}
	<SessionToolbar
		bind:showSessionSettings
		bind:isNewSession
		bind:showSessionManager
		{isDrillRunning}
	/>
{/snippet}

{#if sessionState.activeSessionId !== null || isNewSession}
	<SessionSettingsModal
		bind:open={showSessionSettings}
		sessionId={isNewSession ? undefined : (sessionState.activeSessionId ?? undefined)}
		isNew={isNewSession}
	/>
{/if}

<SessionManagerModal bind:open={showSessionManager} />

<ResponsiveLayout {sessionToolbar}>
	{#snippet leftContent()}
		{#if getNumberOfSelectedCases() > 0}
			{#if activeSettings}
				{#if activeSettings.trainMode === 'drill'}
					<TrainDrill bind:isRunning={isDrillRunning} />
				{:else if bluetoothState.isConnected}
					<!-- Automatically use smart cube training when connected -->
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
	{/snippet}
</ResponsiveLayout>
