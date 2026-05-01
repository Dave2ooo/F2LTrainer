<script lang="ts">
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
	import { globalState, DEFAULT_EO_ORIENTED_COLOR, DEFAULT_EO_UNORIENTED_COLOR } from '$lib/globalState.svelte';
	import { GROUP_IDS, GROUP_DEFINITIONS } from '$lib/types/group';
	import { STICKER_COLORS, OPPOSITE_COLOR, type StickerColor } from '$lib/types/stickering';
	import Update from '$lib/components/Modals/Buttons/Update.svelte';
	import { CircleQuestionMark, Plus, RotateCcw } from '@lucide/svelte';
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
			<div class="card">
				<Label for="session-name" class="label-text mb-2">Session Name</Label>
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

				<TabItem title="Training">
					<div class="mt-4 flex flex-col gap-6">
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
										<p class="text-sm text-gray-600 dark:text-gray-400">
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
										<div class="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
											<span class="font-medium">Requires Smart Cube</span>
										</div>
									</div>
								</div>
							</div>
							{#if settings.trainMode === 'drill'}
								<div class="card">
									<div class="mb-4 flex items-center justify-between">
										<Label class="section-label">Drill Flow</Label>
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
						</div>

						<!-- Frequency Section (Moved Up) -->
						<div class="flex flex-col gap-4">
							<Label class="text-sm font-semibold">Case Frequency</Label>

							<div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
								<!-- Smart Frequency Card -->
								<!-- svelte-ignore a11y_click_events_have_key_events -->
								<!-- svelte-ignore a11y_no_static_element_interactions -->
								<div
									class="selectable-card flex h-full flex-col {settings.frequencyMode === 'smart'
										? 'selectable-card-active'
										: 'selectable-card-inactive'}"
									onclick={() => (settings.frequencyMode = 'smart')}
								>
									<div class="mb-2 flex items-center gap-2">
										<RadioDot selected={settings.frequencyMode === 'smart'} />
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
									class="selectable-card flex h-full flex-col {settings.frequencyMode === 'recap'
										? 'selectable-card-active'
										: 'selectable-card-inactive'}"
									onclick={() => (settings.frequencyMode = 'recap')}
								>
									<div class="mb-2 flex items-center gap-2">
										<RadioDot selected={settings.frequencyMode === 'recap'} />
										<span class="font-medium text-gray-900 dark:text-white">Recap Mode</span>
									</div>
									<p class="ml-6 text-sm text-gray-500 dark:text-gray-400">
										Cycles through all selected cases once.
									</p>
								</div>
							</div>
						</div>

						<!-- Configuration & Assistance Grid -->
						<div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
							<!-- Configuration (Cube Slots) -->
							<div class="flex flex-col gap-4">
								<Label class="text-sm font-semibold">Configuration</Label>
								<div class="card h-full">
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
								<div class="card h-full space-y-4">
									{#if settings.trainMode !== 'drill'}
										<div>
											<Label class="section-label mb-3">Algorithm Hint</Label>
											<div class="grid grid-cols-3 gap-2">
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
													<span class="text-sm text-gray-900 dark:text-white">Step-by-step</span>
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
													<span class="text-sm text-gray-900 dark:text-white">All at once</span>
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
													<span class="text-sm text-gray-900 dark:text-white">Always show</span>
												</div>
											</div>
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
												placement="left"
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
												placement="left"
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
												placement="left"
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
												placement="left"
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

								<!-- Edge Orientation -->
								<div class="card">
									<Label class="mb-3 text-sm font-semibold">Edge Orientation</Label>
									<div class="space-y-4">
										<Checkbox bind:checked={settings.trainLearnEO}>Learn Edge Orientation</Checkbox>
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
											<div class="mt-4 flex justify-end">
												<Button
													size="xs"
													color="alternative"
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
									</div>
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
