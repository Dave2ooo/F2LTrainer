<script lang="ts">
	import { Button, Checkbox, Label, Select } from 'flowbite-svelte';
	import Modal from '../Modal.svelte';
	import { globalState } from '$lib/globalState.svelte';
	import { STICKER_COLORS, OPPOSITE_COLOR } from '$lib/types/stickering';
	import {
		getNumberOfSelectedCasesFromSelections,
		regenerateTrainCaseQueue
	} from '$lib/trainCaseQueue.svelte';
	import { trainSettingsManager } from '$lib/utils/trainSettings';
	import Update from './Buttons/Update.svelte';
	import { CircleQuestionMark, Trash2 } from '@lucide/svelte';
	import TooltipButton from './TooltipButton.svelte';
	import ClearStorageModal from './ClearStorageModal.svelte';
	import { clearAllLocalStorage } from '$lib/utils/localStorage';
	import ThemeSwitch from '$lib/components/ThemeSwitch.svelte';
	import { Accordion, AccordionItem } from '$lib/components/Accordion';

	let open = $state(false);
	let hintSettingsOpen = $state(false);
	let dangerZoneOpen = $state(false);
	let clearStorageModal: ClearStorageModal;

	// Flash states for validation feedback
	let flashStatuses = $state(false);
	let flashGroups = $state(false);
	let flashSides = $state(false);
	let flashCrossColor = $state(false);
	let flashFrontColor = $state(false);

	// Working copy for editing (reactive)
	let workingState = $state({
		crossColor: [...globalState.crossColor],
		frontColor: [...globalState.frontColor],
		trainStateSelection: { ...globalState.trainStateSelection },
		trainGroupSelection: { ...globalState.trainGroupSelection },
		trainSideSelection: { ...globalState.trainSideSelection },
		trainAddAuf: globalState.trainAddAuf,
		trainHintAlgorithm: globalState.trainHintAlgorithm,
		trainHintStickering: globalState.trainHintStickering,
		trainSmartFrequencySolved: globalState.trainSmartFrequencySolved,
		trainSmartFrequencyTime: globalState.trainSmartFrequencyTime,
		trainShowTimer: globalState.trainShowTimer
	});

	export function openModal() {
		if (globalState.view === 'train') trainSettingsManager.saveTrainSettings();
		// Reset workingState when opening modal
		workingState = {
			crossColor: [...globalState.crossColor],
			frontColor: [...globalState.frontColor],
			trainStateSelection: { ...globalState.trainStateSelection },
			trainGroupSelection: { ...globalState.trainGroupSelection },
			trainSideSelection: { ...globalState.trainSideSelection },
			trainAddAuf: globalState.trainAddAuf,
			trainHintAlgorithm: globalState.trainHintAlgorithm,
			trainHintStickering: globalState.trainHintStickering,
			trainSmartFrequencySolved: globalState.trainSmartFrequencySolved,
			trainSmartFrequencyTime: globalState.trainSmartFrequencyTime,
			trainShowTimer: globalState.trainShowTimer
		};
		open = true;
	}

	function onConfirm() {
		// Run validation and don't continue if there are invalid fields
		const valid = validateSettings();
		if (!valid) return;

		// Clear any previous flash states since settings are valid and will be applied
		flashStatuses = false;
		flashGroups = false;
		flashSides = false;
		flashCrossColor = false;
		flashFrontColor = false;
		// Copy workingState back to globalState
		globalState.crossColor = [...workingState.crossColor];
		globalState.frontColor = [...workingState.frontColor];
		globalState.trainStateSelection = { ...workingState.trainStateSelection };
		globalState.trainGroupSelection = { ...workingState.trainGroupSelection };
		globalState.trainSideSelection = { ...workingState.trainSideSelection };
		globalState.trainAddAuf = workingState.trainAddAuf;
		globalState.trainHintAlgorithm = workingState.trainHintAlgorithm;
		globalState.trainHintStickering = workingState.trainHintStickering;
		globalState.trainSmartFrequencySolved = workingState.trainSmartFrequencySolved;
		globalState.trainSmartFrequencyTime = workingState.trainSmartFrequencyTime;
		globalState.trainShowTimer = workingState.trainShowTimer;
		if (globalState.view === 'train')
			if (!trainSettingsManager.areTrainSettingsUnchanged()) regenerateTrainCaseQueue();
		open = false;
	}

	function onCancel() {
		open = false;
	}

	/**
	 * Validate all Settings.
	 * Returns true when all settings are valid (no errors). This function
	 * also updates the `flash*` error flags — valid fields will have their
	 * flash flags cleared, invalid fields will be set.
	 */
	function validateSettings(): boolean {
		let hasErrors = false;

		// 1. Ensure at least one status is selected
		if (
			!workingState.trainStateSelection.unlearned &&
			!workingState.trainStateSelection.learning &&
			!workingState.trainStateSelection.finished
		) {
			flashStatuses = true;
			hasErrors = true;
		} else {
			flashStatuses = false;
		}

		// 2. Ensure at least one group is selected
		if (
			!workingState.trainGroupSelection.basic &&
			!workingState.trainGroupSelection.basicBack &&
			!workingState.trainGroupSelection.advanced &&
			!workingState.trainGroupSelection.expert
		) {
			flashGroups = true;
			hasErrors = true;
		} else {
			flashGroups = false;
		}

		// 3. At least one side must be selected
		if (!workingState.trainSideSelection.left && !workingState.trainSideSelection.right) {
			flashSides = true;
			hasErrors = true;
		} else {
			flashSides = false;
		}

		// 4. Cross Color validation
		if (workingState.crossColor.length === 0) {
			flashCrossColor = true;
			hasErrors = true;
		} else {
			flashCrossColor = false;
		}

		// Front color is always valid (empty = random)
		flashFrontColor = false;

		return !hasErrors;
	}

	let numberOfSelectedCases = $derived(
		getNumberOfSelectedCasesFromSelections(
			workingState.trainGroupSelection,
			workingState.trainStateSelection
		)
	);

	async function handleClearStorage() {
		const confirmed = await clearStorageModal.confirm();
		if (confirmed) {
			clearAllLocalStorage();
			// Reload the page to reset all state
			window.location.reload();
		}
	}

	// Auto-unselect invalid front colors or clear if multiple cross colors selected
	$effect(() => {
		const crossColors = workingState.crossColor;
		if (crossColors.length === 0) return;

		// If multiple cross colors are selected, clear front colors
		if (crossColors.length > 1) {
			if (workingState.frontColor.length > 0) {
				workingState.frontColor = [];
			}
			return;
		}

		const currentFrontColors = workingState.frontColor;
		const validFrontColors = currentFrontColors.filter((front) => {
			return crossColors.every((cross) => cross !== front && OPPOSITE_COLOR[cross] !== front);
		});

		if (validFrontColors.length !== currentFrontColors.length) {
			workingState.frontColor = validFrontColors;
		}
	});
</script>

<Modal bind:open title="Settings" size="md" outsideclose={true} autoclose={false}>
	<form
		onsubmit={(e) => {
			e.preventDefault();
			onConfirm();
		}}
	>
		<div class="space-y-2">
			<!-- Appearance Section -->
			<section class="rounded-lg border border-gray-400 p-4">
				<div class="flex items-center justify-between">
					<h3 class="text-lg font-medium">Appearance</h3>
					<ThemeSwitch />
				</div>
			</section>

			<!-- Train Settings Section -->
			<section class="rounded-lg border border-gray-400 p-4">
				<div class="mb-4 flex items-center justify-between">
					<div class="flex items-center gap-2">
						<h3 class="text-lg font-medium">Train Settings</h3>
						<!-- <TooltipButton
							id="btn-train-settings-main"
							tooltip="Configure your training session parameters"
							icon={CircleQuestionMark}
						/> -->
					</div>
					<span class="text-base text-gray-500 dark:text-gray-400">
						{numberOfSelectedCases} cases selected
					</span>
				</div>

				<div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
					<!-- Left Column: Filtering -->
					<div class="space-y-5">
						<!-- Statuses -->
						<div>
							<p class="mb-2 text-sm font-semibold text-gray-900 dark:text-white">Statuses</p>
							<div
								class="flex flex-wrap gap-3"
								class:flash={flashStatuses}
								role="group"
								aria-describedby={flashStatuses ? 'statuses-error' : undefined}
							>
								<Checkbox autofocus bind:checked={workingState.trainStateSelection.unlearned}
									>Unlearned</Checkbox
								>
								<Checkbox bind:checked={workingState.trainStateSelection.learning}
									>Learning</Checkbox
								>
								<Checkbox bind:checked={workingState.trainStateSelection.finished}
									>Finished</Checkbox
								>
							</div>
							{#if flashStatuses}
								<p id="statuses-error" class="mt-1 text-sm text-theme-error" role="alert">
									Please select at least one status.
								</p>
							{/if}
						</div>

						<!-- Group -->
						<div>
							<p class="mb-2 text-sm font-semibold text-gray-900 dark:text-white">Case Groups</p>
							<div
								class="grid w-fit grid-cols-2 gap-x-8 gap-y-2"
								class:flash={flashGroups}
								role="group"
								aria-describedby={flashGroups ? 'groups-error' : undefined}
							>
								<Checkbox bind:checked={workingState.trainGroupSelection.basic}>Basic</Checkbox>
								<Checkbox bind:checked={workingState.trainGroupSelection.basicBack}
									>Basic Back</Checkbox
								>
								<Checkbox bind:checked={workingState.trainGroupSelection.advanced}
									>Advanced</Checkbox
								>
								<Checkbox bind:checked={workingState.trainGroupSelection.expert}>Expert</Checkbox>
							</div>
							{#if flashGroups}
								<p id="groups-error" class="mt-1 text-sm text-theme-error" role="alert">
									Please select at least one group.
								</p>
							{/if}
						</div>
					</div>

					<!-- Right Column: Configuration -->
					<div class="space-y-5">
						<!-- Side -->
						<div>
							<div class="mb-2 flex items-center gap-2">
								<p class="text-sm font-semibold text-gray-900 dark:text-white">Slot Side</p>
								<TooltipButton
									id="btn-train-settings-side"
									tooltip="Choose if you want to train left or right slot cases"
									icon={CircleQuestionMark}
								/>
							</div>
							<div
								class="flex flex-wrap gap-4"
								class:flash={flashSides}
								role="group"
								aria-describedby={flashSides ? 'side-error' : undefined}
							>
								<Checkbox bind:checked={workingState.trainSideSelection.left}>Left</Checkbox>
								<Checkbox bind:checked={workingState.trainSideSelection.right}>Right</Checkbox>
							</div>
							{#if flashSides}
								<p id="side-error" class="mt-1 text-sm text-theme-error" role="alert">
									Please select at least one side.
								</p>
							{/if}
						</div>

						<!-- Options (AUF & Timer) -->
						<div>
							<p class="mb-2 text-sm font-semibold text-gray-900 dark:text-white">Options</p>
							<div class="grid grid-cols-2 gap-4 sm:grid-cols-1 sm:gap-0">
								<!-- Add AUF -->
								<div class="flex items-center gap-2">
									<Checkbox bind:checked={workingState.trainAddAuf}>Add Random AUF</Checkbox>
									<TooltipButton
										id="btn-train-settings-auf"
										tooltip="Adds a random U move to the end of the scramble"
										icon={CircleQuestionMark}
									/>
								</div>
								<!-- Show Timer -->
								<div class="flex items-center justify-between">
									<Checkbox bind:checked={workingState.trainShowTimer}>Show Timer</Checkbox>
									<!-- <TooltipButton
										id="btn-train-settings-timer"
										tooltip="Show timer component for speedcubing practice"
										icon={CircleQuestionMark}
									/> -->
								</div>
							</div>

							<!-- Smart Frequency -->
							<div class="mt-4">
								<p class="mb-2 text-sm font-semibold text-gray-900 dark:text-white">
									Smart Frequency
								</p>
								<div class="space-y-2">
									<div class="flex items-center gap-2">
										<Checkbox bind:checked={workingState.trainSmartFrequencySolved}
											>Prioritize Unsolved/New</Checkbox
										>
										<TooltipButton
											id="btn-train-settings-freq-solved"
											tooltip="Show cases with fewer solves more frequently"
											icon={CircleQuestionMark}
										/>
									</div>
									<div class="flex items-center gap-2">
										<Checkbox bind:checked={workingState.trainSmartFrequencyTime}
											>Prioritize Slower Cases</Checkbox
										>
										<TooltipButton
											id="btn-train-settings-freq-time"
											tooltip="Show cases with slower average times more frequently"
											icon={CircleQuestionMark}
										/>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			<!-- Hint Settings Section -->
			<Accordion multiple>
				<!-- Hint Settings Section -->
				<section class="rounded-lg border border-gray-400 px-4 py-1">
					<AccordionItem bind:open={hintSettingsOpen}>
						{#snippet header()}
							<h3 class="text-lg font-medium">Hint Settings</h3>
						{/snippet}
						<div class="space-y-6 pt-2">
							<!-- Display Settings -->
							<div>
								<h4 class="mb-3 text-base font-semibold text-gray-900 dark:text-white">
									Display Options
								</h4>
								<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
									<div>
										<Label for="algorithm" class="mb-1 block font-medium">Algorithm Display</Label>
										<Select
											bind:value={workingState.trainHintAlgorithm}
											id="algorithm"
											placeholder=""
										>
											<option value="step">Reveal step-by-step</option>
											<option value="allAtOnce">Reveal all at once</option>
											<option value="always">Show all time</option>
										</Select>
									</div>

									<div>
										<Label for="stickering" class="mb-1 block font-medium">Stickering Style</Label>
										<Select
											bind:value={workingState.trainHintStickering}
											id="stickering"
											placeholder=""
										>
											<option value="f2l">F2L Stickering</option>
											<option value="fully">Fully stickered</option>
										</Select>
									</div>
								</div>
							</div>

							<hr class="border-gray-200 dark:border-gray-700" />

							<!-- Color Settings -->
							<div>
								<h4 class="mb-3 text-base font-semibold text-gray-900 dark:text-white">
									Color Options
								</h4>
								<div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
									<!-- Cross Color -->
									<div
										class="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
										class:flash={flashCrossColor}
										aria-invalid={flashCrossColor}
										aria-describedby={flashCrossColor ? 'cross-color-error' : undefined}
									>
										<Label class="mb-3 block text-base font-medium">Cross Color</Label>
										<div class="grid grid-cols-2 gap-2">
											{#each STICKER_COLORS as color}
												<Checkbox bind:group={workingState.crossColor} value={color}>
													{color.charAt(0).toUpperCase() + color.slice(1)}
												</Checkbox>
											{/each}
										</div>
										{#if flashCrossColor}
											<p id="cross-color-error" class="mt-2 text-sm text-theme-error" role="alert">
												Please select at least one cross color.
											</p>
										{/if}
									</div>

									<!-- Front Color -->
									<div
										class="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
										class:flash={flashFrontColor}
										aria-invalid={flashFrontColor}
									>
										<Label class="mb-3 block text-base font-medium">Front Color</Label>
										<div class="grid grid-cols-2 gap-2">
											{#each STICKER_COLORS as color}
												{@const isDisabled =
													workingState.crossColor.length > 1 ||
													(workingState.crossColor.length === 1 &&
														!workingState.crossColor.every(
															(c) => c !== color && OPPOSITE_COLOR[c] !== color
														))}
												<Checkbox
													bind:group={workingState.frontColor}
													value={color}
													disabled={isDisabled}
												>
													{color.charAt(0).toUpperCase() + color.slice(1)}
												</Checkbox>
											{/each}
										</div>
										{#if workingState.crossColor.length > 1}
											<p class="mt-2 text-sm text-gray-500">
												Randomized when multiple cross colors are selected.
											</p>
										{/if}
									</div>
								</div>
							</div>
						</div>
					</AccordionItem>
				</section>

				<!-- Danger Zone Section -->
				<section class="rounded-lg border border-gray-400 px-4 py-1">
					<AccordionItem
						bind:open={dangerZoneOpen}
						headerClass="text-red-700 hover:!bg-red-50 dark:text-red-500 dark:hover:!bg-red-900/20 {dangerZoneOpen
							? '!bg-red-50 dark:!bg-red-900/20'
							: ''}"
						contentClass="bg-red-50 dark:bg-red-900/10"
					>
						{#snippet header()}
							<span class="font-medium">Danger Zone</span>
						{/snippet}
						<div class="pt-2">
							<p class="mb-4 text-sm text-red-600 dark:text-red-400">
								This will permanently delete all your progress and settings. This action cannot be
								undone.
							</p>
							<Button
								size="sm"
								color="red"
								outline
								onclick={handleClearStorage}
								class="w-full gap-2 sm:w-auto"
							>
								<Trash2 size={16} />
								Clear Data
							</Button>
						</div>
					</AccordionItem>
				</section>
			</Accordion>
		</div>

		<!-- <svelte:fragment slot="footer"> -->
		<Update {onCancel} />
		<!-- </svelte:fragment> -->
	</form>
</Modal>

<ClearStorageModal bind:this={clearStorageModal} />

<!-- </svelte:fragment> -->

<style>
	/* Optional: additional styling tweaks */

	/* Flash animation for validation feedback */
	@keyframes flash-ring {
		0% {
			box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.9);
		}
		60% {
			box-shadow: 0 0 0 6px rgba(239, 68, 68, 0.2);
		}
		100% {
			box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
		}
	}

	.flash {
		animation: flash-ring 900ms ease-out;
		border-radius: 0.375rem; /* match typical rounded input */
	}
</style>
