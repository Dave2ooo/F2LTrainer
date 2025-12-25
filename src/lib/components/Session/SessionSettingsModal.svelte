<script lang="ts">
	import {
		Button,
		Input,
		Label,
		Checkbox,
		Tabs,
		TabItem,
		Select,
		ButtonGroup
	} from 'flowbite-svelte';
	import Modal from '$lib/components/Modal.svelte';
	import { sessionState, DEFAULT_SETTINGS } from '$lib/sessionState.svelte';
	import { GROUP_IDS, GROUP_DEFINITIONS } from '$lib/types/group';
	import { STICKER_COLORS, OPPOSITE_COLOR, type StickerColor } from '$lib/types/stickering';
	import Update from '$lib/components/Modals/Buttons/Update.svelte';
	import { CircleQuestionMark } from '@lucide/svelte';
	import TooltipButton from '$lib/components/Modals/TooltipButton.svelte';
	import SessionIndividualCaseSelector from '$lib/components/Session/SessionIndividualCaseSelector.svelte';
	import resolveStickerColors from '$lib/utils/resolveStickerColors';
	import ConfirmationModal from '$lib/components/Modals/ConfirmationModal.svelte';

	let {
		open = $bindable(),
		sessionId,
		isNew = false
	}: { open: boolean; sessionId?: number; isNew?: boolean } = $props();

	let showDeleteConfirmation = $state(false);

	// Working copy for editing (reactive)
	// We initialize with default, but it will be overwritten by the effect below
	let workingSession = $state({
		name: '',
		settings: JSON.parse(JSON.stringify(DEFAULT_SETTINGS))
	});

	// Load session data into working copy when modal opens or sessionId changes
	$effect(() => {
		if (open) {
			if (isNew) {
				workingSession.name = 'New Session';
				workingSession.settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
			} else if (sessionId !== undefined) {
				const existingSession = sessionState.sessions.find((s) => s.id === sessionId);
				if (existingSession) {
					workingSession.name = existingSession.name;
					// Deep copy settings to avoid reference issues
					workingSession.settings = JSON.parse(JSON.stringify(existingSession.settings));
				}
			}
		}
	});

	// Use workingSession for all derived values
	let settings = $derived(workingSession.settings);
	let session = $derived(workingSession);

	// Options for selects
	const hintAlgoOptions = [
		{ value: 'step', name: 'Reveal step-by-step' },
		{ value: 'allAtOnce', name: 'Reveal all at once' },
		{ value: 'always', name: 'Show all time' }
	];

	const hintStickerOptions = [
		{ value: 'f2l', name: 'F2L Stickering' },
		{ value: 'fully', name: 'Fully stickered' }
	];

	// Color options for checkboxes (using imported STICKER_COLORS)

	// Auto-unselect invalid front colors or clear if multiple cross colors selected
	$effect(() => {
		if (!settings) return;
		const crossColors = settings.crossColor;
		if (!crossColors || crossColors.length === 0) return;

		// If multiple cross colors are selected, clear front colors
		if (crossColors.length > 1) {
			if (settings.frontColor.length > 0) {
				settings.frontColor = [];
			}
			return;
		}

		const currentFrontColors = settings.frontColor;
		const validFrontColors = currentFrontColors.filter((front: any) => {
			return crossColors.every(
				(cross: any) => cross !== front && OPPOSITE_COLOR[cross as StickerColor] !== front
			);
		});

		if (validFrontColors.length !== currentFrontColors.length) {
			settings.frontColor = validFrontColors;
		}
	});

	// Auto-switch to Classic mode when Classic cube is selected (Drill mode requires Smart Cube)
	$effect(() => {
		if (!settings) return;
		if (!settings.smartCubeEnabled && settings.trainMode === 'drill') {
			settings.trainMode = 'classic';
		}
	});

	// Resolved colors for TwistyPlayer in individual case selector
	const [crossColor, frontColor] = $derived.by(() => {
		if (!settings) return ['white', 'red'];
		return resolveStickerColors(settings.crossColor as any, settings.frontColor as any);
	});
</script>

{#if session && settings}
	<Modal bind:open title="Session Settings" size="lg" outsideclose={true}>
		<div class="flex flex-col gap-5">
			<!-- General Settings Section -->
			<div
				class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800"
			>
				<Label
					for="session-name"
					class="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Session Name</Label
				>
				<Input id="session-name" bind:value={session.name} placeholder="Enter session name" />
			</div>

			<Tabs style="underline">
				<TabItem open title="Case Selection">
					<div class="mt-4 flex flex-col gap-5">
						<!-- Case Mode Section -->
						<div class="space-y-3">
							<Label class="text-sm font-semibold">Case Selection Mode</Label>
							<ButtonGroup class="w-full *:flex-1">
								<Button
									color={settings.caseMode === 'group' ? 'blue' : 'alternative'}
									onclick={() => (settings.caseMode = 'group')}>Group</Button
								>
								<Button
									color={settings.caseMode === 'individual' ? 'blue' : 'alternative'}
									onclick={() => (settings.caseMode = 'individual')}>Individual</Button
								>
							</ButtonGroup>
						</div>

						{#if settings.caseMode === 'group'}
							<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
								<div
									class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800"
								>
									<Label class="mb-3 text-sm font-semibold">F2L Groups</Label>
									<div class="space-y-2">
										{#each GROUP_IDS as groupId}
											<Checkbox bind:checked={settings.trainGroupSelection[groupId]}
												>{GROUP_DEFINITIONS[groupId].name}</Checkbox
											>
										{/each}
									</div>
								</div>
								<div
									class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800"
								>
									<Label class="mb-3 text-sm font-semibold">Training State</Label>
									<div class="space-y-2">
										<Checkbox bind:checked={settings.trainStateSelection.unlearned} color="red"
											>Unlearned</Checkbox
										>
										<Checkbox bind:checked={settings.trainStateSelection.learning} color="yellow"
											>Learning</Checkbox
										>
										<Checkbox bind:checked={settings.trainStateSelection.finished} color="green"
											>Finished</Checkbox
										>
									</div>
								</div>
							</div>
						{:else}
							<div class="mt-4">
								{#if settings}
									{#key sessionId ?? 'new'}
										<SessionIndividualCaseSelector
											crossColor={crossColor as any}
											frontColor={frontColor as any}
											bind:selectedCases={settings.selectedCases}
										/>
									{/key}
								{/if}
							</div>
						{/if}
					</div>
				</TabItem>

				<TabItem title="Training">
					<div class="mt-4 flex flex-col gap-5">
						<!-- Cube and Training Mode Grid -->
						<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<!-- Cube Type Section -->
							<div class="space-y-3">
								<Label class="text-sm font-semibold">Cube</Label>
								<ButtonGroup class="w-full *:flex-1">
									<Button
										color={!settings.smartCubeEnabled ? 'blue' : 'alternative'}
										onclick={() => (settings.smartCubeEnabled = false)}>Classic</Button
									>
									<Button
										color={settings.smartCubeEnabled ? 'blue' : 'alternative'}
										onclick={() => (settings.smartCubeEnabled = true)}>Smart Cube</Button
									>
								</ButtonGroup>
							</div>

							<!-- Train Mode Section -->
							<div class="space-y-3">
								<Label class="text-sm font-semibold">Training Mode</Label>
								<ButtonGroup class="w-full *:flex-1">
									<Button
										color={settings.trainMode === 'classic' ? 'blue' : 'alternative'}
										onclick={() => (settings.trainMode = 'classic')}>Classic</Button
									>
									<Button
										color={settings.trainMode === 'drill' ? 'blue' : 'alternative'}
										onclick={() => (settings.trainMode = 'drill')}
										disabled={!settings.smartCubeEnabled}>Drill</Button
									>
								</ButtonGroup>
								{#if !settings.smartCubeEnabled}
									<p class="text-xs text-gray-500 dark:text-gray-400">
										Drill mode requires Smart Cube
									</p>
								{/if}
							</div>
						</div>

						<!-- Slots and Additional Options Grid -->
						<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<!-- Slots Section -->
							<div
								class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800"
							>
								<Label class="mb-3 text-sm font-semibold">Cube Slots</Label>
								<div class="space-y-2">
									<Checkbox bind:checked={settings.trainSideSelection.left}>Left Slots</Checkbox>
									<Checkbox bind:checked={settings.trainSideSelection.right}>Right Slots</Checkbox>
								</div>
							</div>

							<!-- Additional Options Section -->
							<div
								class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800"
							>
								<Label class="mb-3 text-sm font-semibold">Additional Options</Label>
								<div class="space-y-2">
									<div class="flex items-center gap-2">
										<Checkbox bind:checked={settings.trainAddAuf}>Add Random AUF</Checkbox>
										<TooltipButton
											id="btn-session-settings-auf"
											tooltip="Adds a random U move to the end of the scramble"
											icon={CircleQuestionMark}
										/>
									</div>
									<Checkbox bind:checked={settings.trainShowTimer}>Show Timer</Checkbox>
								</div>
							</div>
						</div>

						<!-- Frequency Section -->
						<div class="space-y-3">
							<Label class="text-sm font-semibold">Case Frequency</Label>
							<ButtonGroup class="w-full *:flex-1">
								<Button
									color={settings.frequencyMode === 'smart' ? 'blue' : 'alternative'}
									onclick={() => (settings.frequencyMode = 'smart')}>Smart Frequency</Button
								>
								<Button
									color={settings.frequencyMode === 'recap' ? 'blue' : 'alternative'}
									onclick={() => (settings.frequencyMode = 'recap')}>Recap Mode</Button
								>
							</ButtonGroup>

							{#if settings.frequencyMode === 'smart'}
								<div
									class="space-y-2 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20"
								>
									<Checkbox bind:checked={settings.smartFrequencySolved} class="text-sm"
										>Prioritize Unsolved/Few Solves</Checkbox
									>
									<Checkbox bind:checked={settings.smartFrequencyTime} class="text-sm"
										>Prioritize Slow Solves</Checkbox
									>
								</div>
							{:else}
								<div
									class="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800"
								>
									<p class="text-sm text-gray-600 dark:text-gray-400">
										Recap mode cycles through all selected cases once.
									</p>
								</div>
							{/if}
						</div>
					</div>
				</TabItem>

				<TabItem title="Visuals">
					<div class="mt-4 flex flex-col gap-5">
						<!-- Hint Settings -->
						<div
							class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800"
						>
							<Label class="mb-4 text-sm font-semibold">Hint Settings</Label>
							<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
								<div>
									<Label class="mb-1.5 text-xs">Algorithm Hint</Label>
									<Select items={hintAlgoOptions} bind:value={settings.trainHintAlgorithm} />
								</div>
								<div>
									<Label class="mb-1.5 text-xs">Stickering Style</Label>
									<Select items={hintStickerOptions} bind:value={settings.trainHintStickering} />
								</div>
							</div>
						</div>

						<!-- Color Settings -->
						<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
							<!-- Cross Color -->
							<div
								class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800"
							>
								<Label class="mb-3 text-sm font-semibold">Cross Color</Label>
								<div class="grid grid-cols-2 gap-2">
									{#each STICKER_COLORS as color}
										<Checkbox bind:group={settings.crossColor} value={color}>
											{color.charAt(0).toUpperCase() + color.slice(1)}
										</Checkbox>
									{/each}
								</div>
							</div>

							<!-- Front Color -->
							<div
								class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800"
							>
								<Label class="mb-3 text-sm font-semibold">Front Color</Label>
								<div class="grid grid-cols-2 gap-2">
									{#each STICKER_COLORS as color}
										{@const isDisabled =
											settings.crossColor.length > 1 ||
											(settings.crossColor.length === 1 &&
												!settings.crossColor.every(
													(c: any) => c !== color && OPPOSITE_COLOR[c as StickerColor] !== color
												))}
										<Checkbox bind:group={settings.frontColor} value={color} disabled={isDisabled}>
											{color.charAt(0).toUpperCase() + color.slice(1)}
										</Checkbox>
									{/each}
								</div>
								{#if settings.crossColor.length > 1}
									<p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
										Randomized when multiple cross colors selected.
									</p>
								{/if}
							</div>
						</div>

						<!-- View Settings -->
						<div
							class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800"
						>
							<Label class="mb-3 text-sm font-semibold">View Options</Label>
							<div class="space-y-2">
								<Checkbox
									checked={settings.backView === 'floating'}
									onchange={(e) => {
										settings.backView = (e.target as HTMLInputElement).checked
											? 'floating'
											: 'none';
									}}>Show Back Slots (Floating View)</Checkbox
								>
								<Checkbox bind:checked={settings.backViewEnabled}>Show Back View</Checkbox>
							</div>
						</div>
					</div>
				</TabItem>
			</Tabs>

			<div class="flex w-full items-center justify-between">
				{#if !isNew}
					<Button color="red" outline onclick={() => (showDeleteConfirmation = true)}
						>Delete Session</Button
					>
				{:else}
					<div></div>
					<!-- Spacer -->
				{/if}

				<Update
					onCancel={() => {
						// Discard changes by simply closing the modal
						open = false;
					}}
					onSubmit={() => {
						// Validate and clean session name
						const trimmedName = workingSession.name.trim();
						const finalName = trimmedName || 'Unnamed Session';

						if (isNew) {
							// New session - update the existing one that was created
							if (sessionId !== undefined) {
								sessionState.updateSession(sessionId, {
									name: finalName,
									settings: workingSession.settings
								});
							}
						} else if (sessionId !== undefined) {
							// Update existing session
							sessionState.updateSession(sessionId, {
								name: finalName,
								settings: workingSession.settings
							});
						}
						open = false;
					}}
				/>
			</div>
		</div>
	</Modal>

	<ConfirmationModal
		bind:open={showDeleteConfirmation}
		title="Delete Session"
		message="Are you sure you want to delete this session? You can recover it later if needed."
		onConfirm={() => {
			if (sessionId !== undefined) {
				// Check if it's safe to delete (not the last one)
				const activeCount = sessionState.sessions.filter((s) => !s.archived).length;
				if (activeCount <= 1 && !sessionState.sessions.find((s) => s.id === sessionId)?.archived) {
					// This check is also in the state, but good to have UI feedback or prevent it here if we want custom message
					// For now, the state logs a warning. We could show a toast or alert.
					// But simpler: just call delete. If it fails (in state), nothing happens to data.
					// Ideally we check before closing.
					if (activeCount <= 1) {
						alert('Cannot delete the last active session.');
						return;
					}
				}

				sessionState.deleteSession(sessionId);
				open = false;
			}
		}}
	/>
{/if}
