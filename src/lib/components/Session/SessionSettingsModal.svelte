<script lang="ts">
	import { tick } from 'svelte';
	import {
		Input,
		Label,
		Checkbox,
		Tabs,
		TabItem,
		Select,
		Range,
		Tooltip,
		Button
	} from 'flowbite-svelte';
	import Modal from '$lib/components/Modal.svelte';
	import RadioDot from '$lib/components/RadioDot.svelte';
	import { sessionState, DEFAULT_SETTINGS } from '$lib/sessionState.svelte';
	import {
		globalState,
		DEFAULT_EO_ORIENTED_COLOR,
		DEFAULT_EO_UNORIENTED_COLOR
	} from '$lib/globalState.svelte';
	import { GROUP_IDS, GROUP_DEFINITIONS } from '$lib/types/group';
	import { STICKER_COLORS, OPPOSITE_COLOR, type StickerColor } from '$lib/types/stickering';
	import Update from '$lib/components/Modals/Buttons/Update.svelte';
	import {
		CircleQuestionMark,
		Plus,
		RotateCcw,
		ChevronDown,
		ChevronRight,
		Settings,
		Pencil
	} from '@lucide/svelte';
	import TooltipButton from '$lib/components/Modals/TooltipButton.svelte';
	import EdgeOrientationTooltipPreview from '$lib/components/Session/EdgeOrientationTooltipPreview.svelte';
	import SessionIndividualCaseSelector from '$lib/components/Session/SessionIndividualCaseSelector.svelte';
	import resolveStickerColors from '$lib/utils/resolveStickerColors';
	import type { SessionSettingsTab } from '$lib/types/globalState';

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

	// Resolved colors for TwistyPlayer in individual case selector
	const [crossColor, frontColor] = $derived.by(() => {
		if (!settings) return ['white', 'red'];
		return resolveStickerColors(settings.crossColor as any, settings.frontColor as any);
	});

	// Check if EO colors have been changed from defaults
	const hasChangedEOColors = $derived(
		globalState.eoOrientedColor !== DEFAULT_EO_ORIENTED_COLOR ||
			globalState.eoUnorientedColor !== DEFAULT_EO_UNORIENTED_COLOR
	);
	// Track selected settings tab (local state synced to globalState)
	let selectedSettingsTab: SessionSettingsTab = $state(globalState.sessionSettingsTab);

	$effect(() => {
		globalState.sessionSettingsTab = selectedSettingsTab;
	});

	let isEditingName = $state(false);
	let nameInputEl = $state<HTMLInputElement | null>(null);

	function startEditingName() {
		isEditingName = true;
		tick().then(() => {
			if (nameInputEl) {
				nameInputEl.focus();
				nameInputEl.select();
			}
		});
	}

	$effect(() => {
		if (open) {
			isEditingName = false;
		}
	});
</script>

{#if session && settings}
	<Modal bind:open dismissable size="lg" outsideclose={false} placement="top-center" class="mt-8">
		{#snippet header()}
			<div class="flex items-center gap-1.5 pe-6">
				{#if isEditingName}
					<input
						bind:this={nameInputEl}
						bind:value={session.name}
						placeholder="Enter session name"
						maxlength={60}
						class="w-64 rounded-md border-b-2 border-transparent bg-gray-50 px-1 py-0.5 text-xl font-medium text-gray-900 focus:border-primary-500 focus:outline-none dark:bg-gray-700 dark:text-white"
					/>
				{:else}
					<h3
						class="flex items-center gap-1.5 px-1 py-0.5 text-xl font-bold text-gray-900 md:text-3xl dark:text-white"
					>
						{session.name || 'Unnamed Session'}
						<Button
							color={'none' as any}
							type="button"
							onclick={startEditingName}
							class="rounded-lg p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
							aria-label="Edit session name"
							title="Edit session name"
						>
							<Pencil class="size-4" />
						</Button>
					</h3>
				{/if}
			</div>
		{/snippet}
		<div class="-mt-4 flex flex-col gap-2">
			<!-- General Settings Section -->

			<Tabs
				bind:selected={selectedSettingsTab}
				tabStyle="underline"
				classes={{
					content: 'p-0 bg-gray-50 rounded-lg dark:bg-gray-800 mt-0'
				}}
			>
				<TabItem key="selection" title="Selection">
					<div class="mt-4 flex flex-col gap-4">
						<!-- Group Selection Card -->
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div
							class="selectable-card {settings.caseMode === 'group'
								? 'selectable-card-active'
								: 'selectable-card-inactive'}"
							onclick={() => (settings.caseMode = 'group')}
						>
							<div class="mb-2 flex items-center gap-2">
								<RadioDot selected={settings.caseMode === 'group'} />
								<span class="font-medium text-gray-900 dark:text-white">Group Selection</span>
							</div>

							{#if settings.caseMode === 'group'}
								<div class="mt-3 ml-6 space-y-4 border-t border-blue-200 pt-3 dark:border-blue-800">
									<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
										<div>
											<Label class="section-label mb-2">F2L Groups</Label>
											<div class="space-y-2">
												{#each GROUP_IDS as groupId}
													<Checkbox bind:checked={settings.trainGroupSelection[groupId]}
														>{GROUP_DEFINITIONS[groupId].name}</Checkbox
													>
												{/each}
											</div>
										</div>
										<div>
											<Label class="section-label mb-2">Training State</Label>
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
							class="selectable-card {settings.caseMode === 'individual'
								? 'selectable-card-active'
								: 'selectable-card-inactive'}"
							onclick={() => (settings.caseMode = 'individual')}
						>
							<div class="mb-2 flex items-center gap-2">
								<RadioDot selected={settings.caseMode === 'individual'} />
								<span class="font-medium text-gray-900 dark:text-white">Individual Selection</span>
							</div>

							{#if settings.caseMode === 'individual'}
								<div class="mt-3 ml-0 border-t border-blue-200 pt-3 dark:border-blue-800">
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

				<TabItem key="training" title="Training">
					<div class="mt-4 flex flex-col gap-4">
						<!-- Training Activity Section -->
						<div class="flex flex-col gap-4">
							<Label class="text-sm font-semibold">Training Activity</Label>

							<div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
								<!-- Standard Practice Card -->
								<!-- svelte-ignore a11y_click_events_have_key_events -->
								<!-- svelte-ignore a11y_no_static_element_interactions -->
								<div
									class="selectable-card flex h-full flex-col {settings.trainMode === 'classic'
										? 'selectable-card-active'
										: 'selectable-card-inactive'}"
									onclick={() => (settings.trainMode = 'classic')}
								>
									<div class="mb-2 flex items-center gap-2">
										<RadioDot selected={settings.trainMode === 'classic'} />
										<span class="font-medium text-gray-900 dark:text-white">Standard Practice</span>
									</div>
									<p class="mb-4 ml-6 flex-grow text-xs text-gray-500 dark:text-gray-400">
										Practice cases at your own pace.
									</p>

									<div class="ml-6 border-t border-gray-200 pt-3 dark:border-gray-700">
										<Checkbox bind:checked={settings.scrambleYourself}>Scramble Smart Cube</Checkbox
										>
										<p class="mt-1 mb-3 ml-6 text-xs text-gray-500 dark:text-gray-400">
											Scramble your smart cube yourself. Requires Smart Cube.
										</p>
										<p class="text-sm text-gray-500 dark:text-gray-400">
											💡 Smart cube support activates automatically when connected.
										</p>
									</div>
								</div>

								<!-- Speed Drill Card -->
								<!-- svelte-ignore a11y_click_events_have_key_events -->
								<!-- svelte-ignore a11y_no_static_element_interactions -->
								<div
									class="selectable-card flex h-full flex-col {settings.trainMode === 'drill'
										? 'selectable-card-active'
										: 'selectable-card-inactive'}"
									onclick={() => {
										settings.trainMode = 'drill';
									}}
								>
									<div class="mb-2 flex items-center gap-2">
										<RadioDot selected={settings.trainMode === 'drill'} />
										<span class="font-medium text-gray-900 dark:text-white">Speed Drill</span>
									</div>
									<p class="mb-4 ml-6 flex-grow text-xs text-gray-500 dark:text-gray-400">
										Timed drills with automatic case transitions.
									</p>

									<div class="ml-6 border-t border-gray-200 pt-3 dark:border-gray-700">
										<div
											class="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400"
										>
											<span class="font-medium">Requires Smart Cube</span>
										</div>
									</div>
								</div>
							</div>
							{#if settings.trainMode === 'drill'}
								<div class="card">
									<Label class="section-label mb-4">Drill Settings</Label>

									<div>
										<div class="mb-2 flex items-center justify-between">
											<Label class="text-sm font-semibold">Transition Delay</Label>
											<span class="text-sm font-medium text-gray-900 dark:text-gray-100">
												{settings.drillTimeBetweenCases}s
											</span>
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
									<div class="mt-4 border-t border-gray-200 pt-3 dark:border-gray-700">
										<Checkbox bind:checked={settings.drillHideTwistyPlayer}>
											Hide Cube After First Move
										</Checkbox>
										<p class="mt-1 ml-6 text-xs text-gray-500 dark:text-gray-400">
											The virtual cube will disappear once you start solving, forcing you to rely on
											memory.
										</p>
									</div>
								</div>
							{/if}
							{#if settings.trainMode === 'classic' && settings.scrambleYourself}
								<div class="card">
									<Label class="section-label mb-4">Scramble Settings</Label>

									<div>
										<div class="mb-2 flex items-center justify-between">
											<Label class="text-sm font-semibold">Transition Delay</Label>
											<span class="text-sm font-medium text-gray-900 dark:text-gray-100">
												{settings.scrambleCountdownDuration}s
											</span>
										</div>

										<Range
											id="scramble-delay"
											min={0}
											max={5}
											step={0.25}
											bind:value={settings.scrambleCountdownDuration}
										/>

										<p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
											Time between completing scramble and seeing the case.
										</p>
									</div>
									<div class="mt-4 border-t border-gray-200 pt-3 dark:border-gray-700">
										<Checkbox bind:checked={settings.scrambleShowCube}>
											Show F2L While Scrambling
										</Checkbox>
										<p class="mt-1 ml-6 text-xs text-gray-500 dark:text-gray-400">
											When disabled, the virtual cube hides all pieces except the centers.
										</p>
									</div>
								</div>
							{/if}
						</div>

						<!-- Advanced Settings Well -->
						<div
							class="-mt-2 rounded-xl border border-gray-200 bg-gray-50/50 shadow-sm dark:border-gray-700 dark:bg-gray-800/40"
						>
							<Button
								color={'none' as any}
								type="button"
								class="flex w-full items-center justify-start gap-2 p-4 text-sm font-medium text-blue-600 transition-colors hover:text-blue-800 focus:ring-0 focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
								onclick={() =>
									(globalState.showAdvancedTraining = !globalState.showAdvancedTraining)}
							>
								{#if globalState.showAdvancedTraining}
									<ChevronDown class="size-4" />
								{:else}
									<ChevronRight class="size-4" />
								{/if}
								Advanced Settings
							</Button>

							{#if globalState.showAdvancedTraining}
								<div class="flex flex-col gap-4 border-t border-gray-200 p-4 dark:border-gray-700">
									<!-- Frequency Section (Moved Up) -->
									<div class="flex flex-col gap-2">
										<Label class="text-sm font-semibold">Case Frequency</Label>

										<div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
											<!-- Smart Frequency Card -->
											<!-- svelte-ignore a11y_click_events_have_key_events -->
											<!-- svelte-ignore a11y_no_static_element_interactions -->
											<div
												class="selectable-card flex h-full flex-col {settings.frequencyMode ===
												'smart'
													? 'selectable-card-active'
													: 'selectable-card-inactive'}"
												onclick={() => (settings.frequencyMode = 'smart')}
											>
												<div class="mb-2 flex items-center gap-2">
													<RadioDot selected={settings.frequencyMode === 'smart'} />
													<span class="font-medium text-gray-900 dark:text-white"
														>Smart Frequency</span
													>
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
												class="selectable-card flex h-full flex-col {settings.frequencyMode ===
												'recap'
													? 'selectable-card-active'
													: 'selectable-card-inactive'}"
												onclick={() => (settings.frequencyMode = 'recap')}
											>
												<div class="mb-2 flex items-center gap-2">
													<RadioDot selected={settings.frequencyMode === 'recap'} />
													<span class="font-medium text-gray-900 dark:text-white">Recap Mode</span>
												</div>
												<p class="ml-6 text-sm text-gray-500 dark:text-gray-400">
													Cycles through all selected cases once, tracking your progress with a
													progress bar.
												</p>
											</div>
										</div>
									</div>

									<!-- Configuration & Assistance Grid -->
									<div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
										<!-- Training Setup Column -->
										<div
											class="flex flex-col gap-2 {settings.trainMode === 'drill'
												? 'sm:col-span-2'
												: ''}"
										>
											<Label class="text-sm font-semibold">Training Setup</Label>
											<div
												class="card h-full {settings.trainMode === 'drill'
													? 'space-y-4 sm:grid sm:grid-cols-2 sm:gap-4 sm:space-y-0'
													: 'space-y-4'}"
											>
												<div>
													<Label class="section-label mb-3">Cube Slots</Label>
													<div class="space-y-2">
														<Checkbox bind:checked={settings.trainSideSelection.left}
															>Left Slots</Checkbox
														>
														<Checkbox bind:checked={settings.trainSideSelection.right}
															>Right Slots</Checkbox
														>
													</div>
												</div>

												<div
													class="space-y-3 border-gray-200 dark:border-gray-700 {settings.trainMode ===
													'drill'
														? 'border-t pt-3 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-4'
														: 'border-t pt-3'}"
												>
													<div>
														<Checkbox bind:checked={settings.trainAddAuf}>Add Random AUF</Checkbox>
														<p class="mt-1 ml-6 text-xs text-gray-500 dark:text-gray-400">
															Adds a random U setup move to the beginning of the algorithm.
														</p>
													</div>
													<Checkbox bind:checked={settings.trainShowTimer}>Show Timer</Checkbox>
												</div>
											</div>
										</div>

										<!-- Algorithm Hints Column -->
										{#if settings.trainMode !== 'drill'}
											<div class="flex flex-col gap-2">
												<Label class="text-sm font-semibold">Algorithm Hints</Label>
												<div class="card h-full space-y-4">
													<div>
														<div class="grid grid-cols-2 gap-2">
															<!-- svelte-ignore a11y_click_events_have_key_events -->
															<!-- svelte-ignore a11y_no_static_element_interactions -->
															<div
																class="flex cursor-pointer items-center gap-2 rounded-lg border p-3 transition-colors
													{settings.trainHintAlgorithm === 'hidden'
																	? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
																	: 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'}"
																onclick={() => (settings.trainHintAlgorithm = 'hidden')}
															>
																<RadioDot selected={settings.trainHintAlgorithm === 'hidden'} />
																<span class="text-sm text-gray-900 dark:text-white">Hidden</span>
															</div>
															<!-- svelte-ignore a11y_click_events_have_key_events -->
															<!-- svelte-ignore a11y_no_static_element_interactions -->
															<div
																class="flex cursor-pointer items-center gap-2 rounded-lg border p-3 transition-colors
													{settings.trainHintAlgorithm === 'step'
																	? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
																	: 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'}"
																onclick={() => (settings.trainHintAlgorithm = 'step')}
															>
																<RadioDot selected={settings.trainHintAlgorithm === 'step'} />
																<span class="text-sm text-gray-900 dark:text-white"
																	>Step-by-step</span
																>
															</div>
															<!-- svelte-ignore a11y_click_events_have_key_events -->
															<!-- svelte-ignore a11y_no_static_element_interactions -->
															<div
																class="flex cursor-pointer items-center gap-2 rounded-lg border p-3 transition-colors
													{settings.trainHintAlgorithm === 'allAtOnce'
																	? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
																	: 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'}"
																onclick={() => (settings.trainHintAlgorithm = 'allAtOnce')}
															>
																<RadioDot selected={settings.trainHintAlgorithm === 'allAtOnce'} />
																<span class="text-sm text-gray-900 dark:text-white"
																	>All at once</span
																>
															</div>
															<!-- svelte-ignore a11y_click_events_have_key_events -->
															<!-- svelte-ignore a11y_no_static_element_interactions -->
															<div
																class="flex cursor-pointer items-center gap-2 rounded-lg border p-3 transition-colors
													{settings.trainHintAlgorithm === 'always'
																	? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
																	: 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'}"
																onclick={() => (settings.trainHintAlgorithm = 'always')}
															>
																<RadioDot selected={settings.trainHintAlgorithm === 'always'} />
																<span class="text-sm text-gray-900 dark:text-white"
																	>Always show</span
																>
															</div>
														</div>
													</div>

													{#if settings.trainHintAlgorithm !== 'hidden'}
														<div class="border-t border-gray-200 pt-3 dark:border-gray-700">
															<Label class="section-label mb-3">Smart Cube Hint Tracking</Label>
															<p class="mb-3 text-xs text-gray-500 dark:text-gray-400">
																Only applies when smart cube is connected.
															</p>
															<div class="grid grid-cols-2 gap-2">
																<!-- svelte-ignore a11y_click_events_have_key_events -->
																<!-- svelte-ignore a11y_no_static_element_interactions -->
																<div
																	class="flex cursor-pointer items-start gap-2 rounded-lg border p-3 transition-colors
														{settings.smartHintBehavior === 'auto'
																		? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
																		: 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'}"
																	onclick={() => (settings.smartHintBehavior = 'auto')}
																>
																	<div class="mt-0.5">
																		<RadioDot selected={settings.smartHintBehavior === 'auto'} />
																	</div>
																	<div class="flex flex-col">
																		<span class="text-sm font-medium text-gray-900 dark:text-white"
																			>Smart Tracking</span
																		>
																		<span class="mt-0.5 text-xs text-gray-500 dark:text-gray-400"
																			>Follows your moves and corrects you if needed.</span
																		>
																	</div>
																</div>
																<!-- svelte-ignore a11y_click_events_have_key_events -->
																<!-- svelte-ignore a11y_no_static_element_interactions -->
																<div
																	class="flex cursor-pointer items-start gap-2 rounded-lg border p-3 transition-colors
														{settings.smartHintBehavior === 'manual'
																		? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
																		: 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'}"
																	onclick={() => (settings.smartHintBehavior = 'manual')}
																>
																	<div class="mt-0.5">
																		<RadioDot selected={settings.smartHintBehavior === 'manual'} />
																	</div>
																	<div class="flex flex-col">
																		<span class="text-sm font-medium text-gray-900 dark:text-white"
																			>Manual Mode</span
																		>
																		<span class="mt-0.5 text-xs text-gray-500 dark:text-gray-400"
																			>Does not track moves.</span
																		>
																	</div>
																</div>
															</div>
														</div>
													{/if}
												</div>
											</div>
										{/if}
									</div>
								</div>
							{/if}
						</div>
					</div>
				</TabItem>

				<TabItem key="appearance" title="Appearance">
					<div class="mt-4 flex flex-col gap-4">
						<!-- Cube Appearance Section -->
						<div class="flex flex-col gap-4">
							<div class="grid grid-cols-1 gap-2 md:grid-cols-2">
								<!-- Sticker Style -->
								<div class="card">
									<Label class="section-label mb-3">Stickering Style</Label>
									<div class="grid grid-cols-2 gap-2">
										<!-- svelte-ignore a11y_click_events_have_key_events -->
										<!-- svelte-ignore a11y_no_static_element_interactions -->
										<div
											class="flex cursor-pointer items-center justify-between gap-2 rounded-lg border p-3 transition-colors
												{settings.trainHintStickering === 'f2l'
												? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
												: 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'}"
											onclick={() => (settings.trainHintStickering = 'f2l')}
										>
											<div class="flex items-center gap-2">
												<RadioDot selected={settings.trainHintStickering === 'f2l'} />
												<span class="text-sm text-gray-900 dark:text-white">F2L Stickering</span>
											</div>
											<Button
												id="btn-f2l-stickering-help"
												class="bg-transparent p-1 hover:bg-transparent focus:bg-transparent dark:bg-transparent dark:hover:bg-transparent dark:focus:bg-transparent"
												type="button"
												onclick={(e: MouseEvent) => e.stopPropagation()}
											>
												<CircleQuestionMark class="text-primary-600" />
											</Button>
											<Tooltip
												triggeredBy="#btn-f2l-stickering-help"
												trigger="click"
												class="p-2"
												placement="top"
											>
												<twisty-player
													style="width: 120px; height: 120px;"
													puzzle="3x3x3"
													experimental-setup-alg="z2 y' R U R' U'"
													experimental-stickering-mask-orbits={'EDGES:----IIII----,CORNERS:----IIII,CENTERS:------'}
													hint-facelets="none"
													back-view="none"
													control-panel="none"
													background="none"
													viewer-link="none"
													experimental-drag-input="auto"
													camera-longitude={globalState.cameraLongitude}
													camera-latitude={globalState.cameraLatitude}
												></twisty-player>
											</Tooltip>
										</div>
										<!-- svelte-ignore a11y_click_events_have_key_events -->
										<!-- svelte-ignore a11y_no_static_element_interactions -->
										<div
											class="flex cursor-pointer items-center justify-between gap-2 rounded-lg border p-3 transition-colors
												{settings.trainHintStickering === 'fully'
												? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
												: 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'}"
											onclick={() => (settings.trainHintStickering = 'fully')}
										>
											<div class="flex items-center gap-2">
												<RadioDot selected={settings.trainHintStickering === 'fully'} />
												<span class="text-sm text-gray-900 dark:text-white">Fully Stickered</span>
											</div>
											<Button
												id="btn-fully-stickered-help"
												class="bg-transparent p-1 hover:bg-transparent focus:bg-transparent dark:bg-transparent dark:hover:bg-transparent dark:focus:bg-transparent"
												type="button"
												onclick={(e: MouseEvent) => e.stopPropagation()}
											>
												<CircleQuestionMark class="text-primary-600" />
											</Button>
											<Tooltip
												triggeredBy="#btn-fully-stickered-help"
												trigger="click"
												class="p-2"
												placement="top"
											>
												<twisty-player
													style="width: 120px; height: 120px;"
													puzzle="3x3x3"
													experimental-setup-alg="z2 y' R U R' U'"
													hint-facelets="none"
													back-view="none"
													control-panel="none"
													background="none"
													viewer-link="none"
													experimental-drag-input="auto"
													camera-longitude={globalState.cameraLongitude}
													camera-latitude={globalState.cameraLatitude}
												></twisty-player>
											</Tooltip>
										</div>
									</div>
								</div>

								<!-- View Options -->
								<div class="card">
									<Label class="mb-3 text-sm font-semibold">View Options</Label>
									<div class="space-y-2">
										<div class="flex items-center gap-2">
											<Checkbox
												checked={settings.backView === 'floating'}
												onchange={() => {
													settings.backView =
														settings.backView === 'floating' ? 'none' : 'floating';
												}}>Show Floating Stickers</Checkbox
											>
											<Button
												id="btn-floating-stickers-help"
												class="bg-transparent p-1 hover:bg-transparent focus:bg-transparent dark:bg-transparent dark:hover:bg-transparent dark:focus:bg-transparent"
												type="button"
											>
												<CircleQuestionMark class="text-primary-600" />
											</Button>
											<Tooltip
												triggeredBy="#btn-floating-stickers-help"
												trigger="click"
												class="p-2"
												placement="top"
											>
												<twisty-player
													style="width: 120px; height: 120px;"
													puzzle="3x3x3"
													experimental-setup-alg="z2 y' R U R' U'"
													experimental-stickering-mask-orbits={'EDGES:----IIII----,CORNERS:----IIII,CENTERS:------'}
													hint-facelets="floating"
													back-view="none"
													control-panel="none"
													background="none"
													viewer-link="none"
													experimental-drag-input="auto"
													camera-longitude={globalState.cameraLongitude}
													camera-latitude={globalState.cameraLatitude}
												></twisty-player>
											</Tooltip>
										</div>
										<div class="flex items-center gap-2">
											<Checkbox bind:checked={settings.backViewEnabled}>Show Back View</Checkbox>
											<Button
												id="btn-back-view-help"
												class="bg-transparent p-1 hover:bg-transparent focus:bg-transparent dark:bg-transparent dark:hover:bg-transparent dark:focus:bg-transparent"
												type="button"
											>
												<CircleQuestionMark class="text-primary-600" />
											</Button>
											<Tooltip
												triggeredBy="#btn-back-view-help"
												trigger="click"
												class="p-2"
												placement="top"
											>
												<twisty-player
													style="width: 120px; height: 120px;"
													puzzle="3x3x3"
													experimental-setup-alg="z2 y' R U R' U'"
													experimental-stickering-mask-orbits={'EDGES:----IIII----,CORNERS:----IIII,CENTERS:------'}
													hint-facelets="none"
													back-view="top-right"
													control-panel="none"
													background="none"
													viewer-link="none"
													experimental-drag-input="auto"
													camera-longitude={globalState.cameraLongitude}
													camera-latitude={globalState.cameraLatitude}
												></twisty-player>
											</Tooltip>
										</div>
									</div>
								</div>
							</div>

							<!-- Advanced Settings Well -->
							<div
								class="-mt-2 rounded-xl border border-gray-200 bg-gray-50/50 shadow-sm dark:border-gray-700 dark:bg-gray-800/40"
							>
								<Button
									color={'none' as any}
									type="button"
									class="flex w-full items-center justify-start gap-2 p-4 text-sm font-medium text-blue-600 transition-colors hover:text-blue-800 focus:ring-0 focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
									onclick={() =>
										(globalState.showAdvancedAppearance = !globalState.showAdvancedAppearance)}
								>
									{#if globalState.showAdvancedAppearance}
										<ChevronDown class="size-4" />
									{:else}
										<ChevronRight class="size-4" />
									{/if}
									Advanced Settings
								</Button>

								{#if globalState.showAdvancedAppearance}
									<div
										class="grid grid-cols-1 gap-4 border-t border-gray-200 p-4 md:grid-cols-2 dark:border-gray-700"
									>
										<!-- Cross Color -->
										<div class="card">
											<Label class="section-label mb-3">Cross Color</Label>
											<div class="grid grid-cols-2 gap-2">
												{#each STICKER_COLORS as color}
													<Checkbox bind:group={settings.crossColor} value={color}>
														{color.charAt(0).toUpperCase() + color.slice(1)}
													</Checkbox>
												{/each}
											</div>
										</div>

										<!-- Front Color -->
										<div class="card">
											<Label class="section-label mb-3">Front Color</Label>
											<div class="grid grid-cols-2 gap-2">
												{#each STICKER_COLORS as color}
													{@const isDisabled =
														settings.crossColor.length > 1 ||
														(settings.crossColor.length === 1 &&
															!settings.crossColor.every(
																(c: any) =>
																	c !== color && OPPOSITE_COLOR[c as StickerColor] !== color
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

										<!-- Edge Orientation -->
										<div class="card">
											<Label class="mb-3 text-sm font-semibold">Edge Orientation</Label>
											<div class="space-y-4">
												<div class="flex items-center gap-2">
													<Checkbox bind:checked={settings.trainLearnEO}
														>Learn Edge Orientation</Checkbox
													>
													<Button
														id="btn-edge-orientation-help"
														class="bg-transparent p-1 hover:bg-transparent focus:bg-transparent dark:bg-transparent dark:hover:bg-transparent dark:focus:bg-transparent"
														type="button"
														onclick={(e: MouseEvent) => e.stopPropagation()}
													>
														<CircleQuestionMark class="text-primary-600" />
													</Button>
													<Tooltip
														triggeredBy="#btn-edge-orientation-help"
														trigger="click"
														class="p-2"
														placement="bottom"
													>
														<div class="w-min space-y-3">
															<p
																class="text-xs text-gray-500 dark:text-gray-300 dark:text-gray-400"
															>
																When enabled, highlight F2L edges by orientation
															</p>
															<div class="grid w-max grid-cols-1 gap-3 sm:grid-cols-2">
																<EdgeOrientationTooltipPreview
																	caseId={1}
																	description="Oriented edge"
																	class="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/80"
																/>
																<EdgeOrientationTooltipPreview
																	caseId={11}
																	description="Unoriented edge"
																	class="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/80"
																/>
															</div>
														</div>
													</Tooltip>
												</div>
												{#if settings.trainLearnEO}
													<div
														class="grid grid-cols-2 gap-4 border-t border-gray-200 pt-3 dark:border-gray-700"
													>
														<div>
															<Label class="mb-2 text-xs">Oriented Color</Label>
															<input
																type="color"
																bind:value={globalState.eoOrientedColor}
																class="h-8 w-full cursor-pointer rounded border border-gray-300 p-0"
															/>
														</div>
														<div>
															<Label class="mb-2 text-xs">Unoriented Color</Label>
															<input
																type="color"
																bind:value={globalState.eoUnorientedColor}
																class="h-8 w-full cursor-pointer rounded border border-gray-300 p-0"
															/>
														</div>
													</div>
													{#if hasChangedEOColors}
														<div class="mt-4 flex justify-end">
															<Button
																size="xs"
																color="gray"
																outline
																onclick={() => {
																	globalState.eoOrientedColor = DEFAULT_EO_ORIENTED_COLOR;
																	globalState.eoUnorientedColor = DEFAULT_EO_UNORIENTED_COLOR;
																}}
																class="gap-1.5"
															>
																<RotateCcw size={14} />
																Reset to Default
															</Button>
														</div>
													{/if}
												{/if}
											</div>
										</div>
									</div>
								{/if}
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
