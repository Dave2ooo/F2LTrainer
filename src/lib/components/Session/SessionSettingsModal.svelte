<script lang="ts">
	import { Button, Input, Label, Checkbox, Tabs, TabItem, Select, Range } from 'flowbite-svelte';
	import Modal from '$lib/components/Modal.svelte';
	import { sessionState, DEFAULT_SETTINGS } from '$lib/sessionState.svelte';
	import { GROUP_IDS, GROUP_DEFINITIONS } from '$lib/types/group';
	import { STICKER_COLORS, OPPOSITE_COLOR, type StickerColor } from '$lib/types/stickering';
	import Update from '$lib/components/Modals/Buttons/Update.svelte';
	import { CircleQuestionMark, Plus } from '@lucide/svelte';
	import TooltipButton from '$lib/components/Modals/TooltipButton.svelte';
	import SessionIndividualCaseSelector from '$lib/components/Session/SessionIndividualCaseSelector.svelte';
	import resolveStickerColors from '$lib/utils/resolveStickerColors';

	let {
		open = $bindable(),
		sessionId,
		isNew = false
	}: { open: boolean; sessionId?: string; isNew?: boolean } = $props();

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
	<Modal
		bind:open
		title="Session Settings"
		size="lg"
		outsideclose={false}
		placement="top-center"
		class="mt-8"
	>
		<div class="flex flex-col gap-2">
			<!-- General Settings Section -->
			<div
				class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800"
			>
				<Label
					for="session-name"
					class="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Session Name</Label
				>
				<Input
					id="session-name"
					bind:value={session.name}
					placeholder="Enter session name"
					maxlength={60}
				/>
			</div>

			<Tabs
				tabStyle="underline"
				classes={{
					content: 'p-0 bg-gray-50 rounded-lg dark:bg-gray-800 mt-0'
				}}
			>
				<TabItem open title="Selection">
					<div class="mt-4 flex flex-col gap-4">
						<!-- Group Selection Card -->
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div
							class="cursor-pointer rounded-lg border p-4 transition-colors {settings.caseMode ===
							'group'
								? 'border-blue-500 bg-blue-50/50 dark:border-blue-500 dark:bg-blue-900/20'
								: 'border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700'}"
							onclick={() => (settings.caseMode = 'group')}
						>
							<div class="mb-2 flex items-center gap-2">
								<div
									class="flex h-4 w-4 items-center justify-center rounded-full border {settings.caseMode ===
									'group'
										? 'border-blue-600 bg-blue-600'
										: 'border-gray-400 bg-transparent'}"
								>
									{#if settings.caseMode === 'group'}
										<div class="h-1.5 w-1.5 rounded-full bg-white"></div>
									{/if}
								</div>
								<span class="font-medium text-gray-900 dark:text-white">Group Selection</span>
							</div>

							{#if settings.caseMode === 'group'}
								<div class="mt-3 ml-6 space-y-4 border-t border-blue-200 pt-3 dark:border-blue-800">
									<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
										<div>
											<Label class="mb-2 text-xs font-semibold text-gray-500 uppercase"
												>F2L Groups</Label
											>
											<div class="space-y-2">
												{#each GROUP_IDS as groupId}
													<Checkbox bind:checked={settings.trainGroupSelection[groupId]}
														>{GROUP_DEFINITIONS[groupId].name}</Checkbox
													>
												{/each}
											</div>
										</div>
										<div>
											<Label class="mb-2 text-xs font-semibold text-gray-500 uppercase"
												>Training State</Label
											>
											<div class="space-y-2">
												<Checkbox bind:checked={settings.trainStateSelection.unlearned} color="red"
													>Unlearned</Checkbox
												>
												<Checkbox
													bind:checked={settings.trainStateSelection.learning}
													color="yellow">Learning</Checkbox
												>
												<Checkbox bind:checked={settings.trainStateSelection.finished} color="green"
													>Finished</Checkbox
												>
											</div>
										</div>
									</div>
								</div>
							{/if}
						</div>

						<!-- Individual Selection Card -->
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div
							class="cursor-pointer rounded-lg border p-4 transition-colors {settings.caseMode ===
							'individual'
								? 'border-blue-500 bg-blue-50/50 dark:border-blue-500 dark:bg-blue-900/20'
								: 'border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700'}"
							onclick={() => (settings.caseMode = 'individual')}
						>
							<div class="mb-2 flex items-center gap-2">
								<div
									class="flex h-4 w-4 items-center justify-center rounded-full border {settings.caseMode ===
									'individual'
										? 'border-blue-600 bg-blue-600'
										: 'border-gray-400 bg-transparent'}"
								>
									{#if settings.caseMode === 'individual'}
										<div class="h-1.5 w-1.5 rounded-full bg-white"></div>
									{/if}
								</div>
								<span class="font-medium text-gray-900 dark:text-white">Individual Selection</span>
							</div>

							{#if settings.caseMode === 'individual'}
								<div class="mt-3 ml-6 border-t border-blue-200 pt-3 dark:border-blue-800">
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
					</div>
				</TabItem>

				<TabItem title="Training">
					<div class="mt-4 flex flex-col gap-6">
						<!-- Training Activity Section -->
						<div class="flex flex-col gap-4">
							<Label class="text-sm font-semibold">Training Activity</Label>

							<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
								<!-- Standard Practice Card -->
								<!-- svelte-ignore a11y_click_events_have_key_events -->
								<!-- svelte-ignore a11y_no_static_element_interactions -->
								<div
									class="flex h-full cursor-pointer flex-col rounded-lg border p-4 transition-colors {settings.trainMode ===
									'classic'
										? 'border-blue-500 bg-blue-50/50 dark:border-blue-500 dark:bg-blue-900/20'
										: 'border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700'}"
									onclick={() => (settings.trainMode = 'classic')}
								>
									<div class="mb-2 flex items-center gap-2">
										<div
											class="flex h-4 w-4 items-center justify-center rounded-full border {settings.trainMode ===
											'classic'
												? 'border-blue-600 bg-blue-600'
												: 'border-gray-400 bg-transparent'}"
										>
											{#if settings.trainMode === 'classic'}
												<div class="h-1.5 w-1.5 rounded-full bg-white"></div>
											{/if}
										</div>
										<span class="font-medium text-gray-900 dark:text-white">Standard Practice</span>
									</div>
									<p class="mb-4 ml-6 flex-grow text-xs text-gray-500 dark:text-gray-400">
										Practice cases at your own pace.
									</p>

									<div
										class="ml-6 border-t border-gray-200 pt-3 dark:border-gray-700 {settings.trainMode !==
										'classic'
											? 'pointer-events-none opacity-50'
											: ''}"
									>
										<Checkbox
											bind:checked={settings.smartCubeEnabled}
											onclick={(e) => e.stopPropagation()}
										>
											Use Smart Cube
										</Checkbox>
									</div>
								</div>

								<!-- Speed Drill Card -->
								<!-- svelte-ignore a11y_click_events_have_key_events -->
								<!-- svelte-ignore a11y_no_static_element_interactions -->
								<div
									class="flex h-full cursor-pointer flex-col rounded-lg border p-4 transition-colors {settings.trainMode ===
									'drill'
										? 'border-blue-500 bg-blue-50/50 dark:border-blue-500 dark:bg-blue-900/20'
										: 'border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700'}"
									onclick={() => {
										settings.trainMode = 'drill';
										settings.smartCubeEnabled = true;
									}}
								>
									<div class="mb-2 flex items-center gap-2">
										<div
											class="flex h-4 w-4 items-center justify-center rounded-full border {settings.trainMode ===
											'drill'
												? 'border-blue-600 bg-blue-600'
												: 'border-gray-400 bg-transparent'}"
										>
											{#if settings.trainMode === 'drill'}
												<div class="h-1.5 w-1.5 rounded-full bg-white"></div>
											{/if}
										</div>
										<span class="font-medium text-gray-900 dark:text-white">Speed Drill</span>
									</div>
									<p class="mb-4 ml-6 flex-grow text-xs text-gray-500 dark:text-gray-400">
										Timed drills with automatic case transitions.
									</p>

									<div class="ml-6 border-t border-gray-200 pt-3 dark:border-gray-700">
										<div class="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
											<span class="font-medium">Requires Smart Cube</span>
										</div>
									</div>
								</div>
							</div>
							{#if settings.trainMode === 'drill'}
								<div
									class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800"
								>
									<div class="mb-4 flex items-center justify-between">
										<Label class="text-xs font-semibold text-gray-500 uppercase">Drill Flow</Label>
										<span class="text-sm font-medium text-gray-900 dark:text-gray-100"
											>{settings.drillTimeBetweenCases}s delay</span
										>
									</div>
									<Range
										id="drill-delay"
										min={0}
										max={5}
										step={0.25}
										bind:value={settings.drillTimeBetweenCases}
									/>
									<p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
										Time between solving a case and seeing the next one.
									</p>
								</div>
							{/if}
						</div>

						<!-- Frequency Section (Moved Up) -->
						<div class="flex flex-col gap-4">
							<Label class="text-sm font-semibold">Case Frequency</Label>

							<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
								<!-- Smart Frequency Card -->
								<!-- svelte-ignore a11y_click_events_have_key_events -->
								<!-- svelte-ignore a11y_no_static_element_interactions -->
								<div
									class="flex h-full cursor-pointer flex-col rounded-lg border p-4 transition-colors {settings.frequencyMode ===
									'smart'
										? 'border-blue-500 bg-blue-50/50 dark:border-blue-500 dark:bg-blue-900/20'
										: 'border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700'}"
									onclick={() => (settings.frequencyMode = 'smart')}
								>
									<div class="mb-2 flex items-center gap-2">
										<div
											class="flex h-4 w-4 items-center justify-center rounded-full border {settings.frequencyMode ===
											'smart'
												? 'border-blue-600 bg-blue-600'
												: 'border-gray-400 bg-transparent'}"
										>
											{#if settings.frequencyMode === 'smart'}
												<div class="h-1.5 w-1.5 rounded-full bg-white"></div>
											{/if}
										</div>
										<span class="font-medium text-gray-900 dark:text-white">Smart Frequency</span>
									</div>

									<div
										class="ml-6 space-y-2 pt-2 {settings.frequencyMode !== 'smart'
											? 'pointer-events-none opacity-50'
											: ''}"
									>
										<Checkbox
											bind:checked={settings.smartFrequencySolved}
											class="text-sm"
											onclick={(e) => e.stopPropagation()}>Prioritize Unsolved</Checkbox
										>
										<Checkbox
											bind:checked={settings.smartFrequencyTime}
											class="text-sm"
											onclick={(e) => e.stopPropagation()}>Prioritize Slow</Checkbox
										>
									</div>
								</div>

								<!-- Recap Mode Card -->
								<!-- svelte-ignore a11y_click_events_have_key_events -->
								<!-- svelte-ignore a11y_no_static_element_interactions -->
								<div
									class="flex h-full cursor-pointer flex-col rounded-lg border p-4 transition-colors {settings.frequencyMode ===
									'recap'
										? 'border-blue-500 bg-blue-50/50 dark:border-blue-500 dark:bg-blue-900/20'
										: 'border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700'}"
									onclick={() => (settings.frequencyMode = 'recap')}
								>
									<div class="mb-2 flex items-center gap-2">
										<div
											class="flex h-4 w-4 items-center justify-center rounded-full border {settings.frequencyMode ===
											'recap'
												? 'border-blue-600 bg-blue-600'
												: 'border-gray-400 bg-transparent'}"
										>
											{#if settings.frequencyMode === 'recap'}
												<div class="h-1.5 w-1.5 rounded-full bg-white"></div>
											{/if}
										</div>
										<span class="font-medium text-gray-900 dark:text-white">Recap Mode</span>
									</div>
									<p class="ml-6 text-sm text-gray-500 dark:text-gray-400">
										Cycles through all selected cases once.
									</p>
								</div>
							</div>
						</div>

						<!-- Configuration & Assistance Grid -->
						<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<!-- Configuration (Cube Slots) -->
							<div class="flex flex-col gap-4">
								<Label class="text-sm font-semibold">Configuration</Label>
								<div
									class="h-full rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800"
								>
									<Label class="mb-3 text-sm font-semibold">Cube Slots</Label>
									<div class="space-y-2">
										<Checkbox bind:checked={settings.trainSideSelection.left}>Left Slots</Checkbox>
										<Checkbox bind:checked={settings.trainSideSelection.right}>Right Slots</Checkbox
										>
									</div>
								</div>
							</div>

							<!-- Assistance & Tools -->
							<div class="flex flex-col gap-4">
								<Label class="text-sm font-semibold">Assistance & Tools</Label>
								<div
									class="h-full space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800"
								>
									{#if settings.trainMode !== 'drill'}
										<div>
											<Label class="mb-1.5 text-xs font-semibold text-gray-500 uppercase"
												>Algorithm Hint</Label
											>
											<Select items={hintAlgoOptions} bind:value={settings.trainHintAlgorithm} />
										</div>
									{/if}

									<div class="space-y-2 border-t border-gray-200 pt-3 dark:border-gray-700">
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
						</div>
					</div>
				</TabItem>

				<TabItem title="Appearance">
					<div class="mt-4 flex flex-col gap-6">
						<!-- Cube Appearance Section -->
						<div class="flex flex-col gap-4">
							<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
								<!-- Cross Color -->
								<div
									class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800"
								>
									<Label class="mb-3 text-xs font-semibold text-gray-500 uppercase"
										>Cross Color</Label
									>
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
									<Label class="mb-3 text-xs font-semibold text-gray-500 uppercase"
										>Front Color</Label
									>
									<div class="grid grid-cols-2 gap-2">
										{#each STICKER_COLORS as color}
											{@const isDisabled =
												settings.crossColor.length > 1 ||
												(settings.crossColor.length === 1 &&
													!settings.crossColor.every(
														(c: any) => c !== color && OPPOSITE_COLOR[c as StickerColor] !== color
													))}
											<Checkbox
												bind:group={settings.frontColor}
												value={color}
												disabled={isDisabled}
											>
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

								<!-- Sticker Style -->
								<div
									class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800"
								>
									<Label class="mb-3 text-xs font-semibold text-gray-500 uppercase"
										>Stickering Style</Label
									>
									<Select items={hintStickerOptions} bind:value={settings.trainHintStickering} />
								</div>
							</div>
						</div>

						<!-- Interface Section -->
						<div class="flex flex-col gap-4">
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
										}}>Show Floating Stickers</Checkbox
									>
									<Checkbox bind:checked={settings.backViewEnabled}>Show Back View</Checkbox>
								</div>
							</div>
						</div>
					</div>
				</TabItem>
			</Tabs>

			<div class="flex w-full items-center justify-between">
				{#if !isNew}
					<div></div>
				{/if}

				<Update
					submitText={isNew ? 'Create' : 'Update'}
					Icon={isNew ? Plus : undefined}
					onCancel={() => {
						// Simply close, no cleanup needed as we haven't created anything yet
						open = false;
					}}
					onSubmit={() => {
						// Validate and clean session name
						const trimmedName = workingSession.name.trim();
						const finalName = trimmedName || 'Unnamed Session';

						if (isNew) {
							// New session - verify we create it now
							// We don't have an ID yet, so we create it
							sessionState.createSession(finalName, true, workingSession.settings);
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
{/if}
