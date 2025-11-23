<script lang="ts">
	import { Button, Checkbox, Label, Modal, Select } from 'flowbite-svelte';
	import { globalState } from '$lib/globalState.svelte';
	import { STICKER_COLORS_WITH_RANDOM, OPPOSITE_COLOR } from '$lib/types/stickering';
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

	let open = $state(false);
	let clearStorageModal: ClearStorageModal;

	// Flash states for validation feedback
	let flashStatuses = $state(false);
	let flashGroups = $state(false);
	let flashSides = $state(false);
	let flashCrossColor = $state(false);
	let flashFrontColor = $state(false);

	// Working copy for editing (reactive)
	let workingState = $state({
		crossColor: globalState.crossColor,
		frontColor: globalState.frontColor,
		trainStateSelection: { ...globalState.trainStateSelection },
		trainGroupSelection: { ...globalState.trainGroupSelection },
		trainSideSelection: { ...globalState.trainSideSelection },
		trainAddAuf: globalState.trainAddAuf,
		trainHintAlgorithm: globalState.trainHintAlgorithm,
		trainHintStickering: globalState.trainHintStickering,
		trainShowTimer: globalState.trainShowTimer
	});

	export function openModal() {
		if (globalState.view === 'train') trainSettingsManager.saveTrainSettings();
		// Reset workingState when opening modal
		workingState = {
			crossColor: globalState.crossColor,
			frontColor: globalState.frontColor,
			trainStateSelection: { ...globalState.trainStateSelection },
			trainGroupSelection: { ...globalState.trainGroupSelection },
			trainSideSelection: { ...globalState.trainSideSelection },
			trainAddAuf: globalState.trainAddAuf,
			trainHintAlgorithm: globalState.trainHintAlgorithm,
			trainHintStickering: globalState.trainHintStickering,
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
		globalState.crossColor = workingState.crossColor;
		globalState.frontColor = workingState.frontColor;
		globalState.trainStateSelection = { ...workingState.trainStateSelection };
		globalState.trainGroupSelection = { ...workingState.trainGroupSelection };
		globalState.trainSideSelection = { ...workingState.trainSideSelection };
		globalState.trainAddAuf = workingState.trainAddAuf;
		globalState.trainHintAlgorithm = workingState.trainHintAlgorithm;
		globalState.trainHintStickering = workingState.trainHintStickering;
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
		if (!workingState.trainStateSelection.unlearned && 
		    !workingState.trainStateSelection.learning && 
		    !workingState.trainStateSelection.finished) {
			flashStatuses = true;
			hasErrors = true;
		} else {
			flashStatuses = false;
		}

		// 2. Ensure at least one group is selected
		if (!workingState.trainGroupSelection.basic && 
		    !workingState.trainGroupSelection.basicBack && 
		    !workingState.trainGroupSelection.advanced && 
		    !workingState.trainGroupSelection.expert) {
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

		// 4. Cross and Front color cannot be identical or opposite (must be adjacent)
		// Only check when both are real sticker colors (not 'random')
		const cross = workingState.crossColor;
		const front = workingState.frontColor;
		if (cross !== 'random' && front !== 'random') {
			const isSame = cross === front;
			const isOpposite = OPPOSITE_COLOR[cross as keyof typeof OPPOSITE_COLOR] === front;
			if (isSame || isOpposite) {
				flashCrossColor = true;
				flashFrontColor = true;
				hasErrors = true;
			} else {
				flashCrossColor = false;
				flashFrontColor = false;
			}
		} else {
			// if one of the colors is 'random', clear the cross/front errors because the field is valid
			flashCrossColor = false;
			flashFrontColor = false;
		}

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
</script>

<Modal bind:open title="Settings" size="md" outsideclose={true} autoclose={false}>
	<form
		onsubmit={(e) => {
			e.preventDefault();
			onConfirm();
		}}
	>
		<ThemeSwitch />
		<div class="space-y-6">
			<!-- Train Settings Section -->
			<section class="rounded-lg border border-gray-400 p-4">
				<div class="mb-3 flex items-center gap-0">
					<h3 class="text-lg font-medium">Train Settings</h3>
					<TooltipButton
						id="btn-train-settings-1"
						tooltip="Select the cases you want to practice"
						icon={CircleQuestionMark}
					/>
				</div>

				<!-- Statuses -->
				<div class="mb-4">
					<p class="mb-2 font-medium">Statuses</p>
					<div
						class="flex flex-wrap gap-4"
						class:flash={flashStatuses}
						role="group"
						aria-describedby={flashStatuses ? 'statuses-error' : undefined}
					>
						<Checkbox autofocus bind:checked={workingState.trainStateSelection.unlearned}
							>Unlearned</Checkbox
						>
						<Checkbox bind:checked={workingState.trainStateSelection.learning}>Learning</Checkbox>
						<Checkbox bind:checked={workingState.trainStateSelection.finished}>Finished</Checkbox>
					</div>
					{#if flashStatuses}
						<p id="statuses-error" class="mt-1 text-sm text-red-600" role="alert">
							Please select at least one status.
						</p>
					{/if}
				</div>

				<!-- Group -->
				<div class="mb-4">
					<p class="mb-2 font-medium">Group</p>
					<div
						class="flex flex-wrap gap-4"
						class:flash={flashGroups}
						role="group"
						aria-describedby={flashGroups ? 'groups-error' : undefined}
					>
						<Checkbox bind:checked={workingState.trainGroupSelection.basic}>Basic</Checkbox>
						<Checkbox bind:checked={workingState.trainGroupSelection.basicBack}>Basic Back</Checkbox
						>
						<Checkbox bind:checked={workingState.trainGroupSelection.advanced}>Advanced</Checkbox>
						<Checkbox bind:checked={workingState.trainGroupSelection.expert}>Expert</Checkbox>
					</div>
					{#if flashGroups}
						<p id="groups-error" class="mt-1 text-sm text-red-600" role="alert">
							Please select at least one group.
						</p>
					{/if}
				</div>

				<p>
					{numberOfSelectedCases} cases selected
				</p>

				<!-- Side -->
				<div class="mb-4">
					<div class="mb-2 flex items-center gap-0">
						<p class="mb-0 font-medium">Side</p>
						<TooltipButton
							id="btn-train-settings-2"
							tooltip="Chose if you want to left or right slot"
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
						{#if flashSides}
							<p id="side-error" class="mt-1 text-sm text-red-600" role="alert">
								Please select left or right side.
							</p>
						{/if}
					</div>
				</div>

				<!-- Add AUF -->
				<div>
					<div class="mb-4">
						<div class="mb-2 flex items-center gap-0">
							<p class="mb-0 font-medium">AUF</p>
							<TooltipButton
								id="btn-train-settings-3"
								tooltip="Adds random U move to the scramble"
								icon={CircleQuestionMark}
							/>
						</div>
						<div class="flex flex-wrap gap-4">
							<div class="flex items-center">
								<Checkbox bind:checked={workingState.trainAddAuf}>Add AUF</Checkbox>
							</div>
						</div>
					</div>
				</div>

				<!-- Show Timer -->
				<div>
					<div class="mb-4">
						<div class="mb-2 flex items-center gap-0">
							<p class="mb-0 font-medium">Timer</p>
							<TooltipButton
								id="btn-train-settings-timer"
								tooltip="Show timer component for speedcubing practice"
								icon={CircleQuestionMark}
							/>
						</div>
						<div class="flex flex-wrap gap-4">
							<div class="flex items-center">
								<Checkbox bind:checked={workingState.trainShowTimer}>Show Timer</Checkbox>
							</div>
						</div>
					</div>
				</div>
			</section>

			<!-- Hint Settings Section -->
			<section class="rounded-lg border border-gray-400 p-4">
				<h3 class="mb-3 text-lg font-medium">Hint Settings</h3>

				<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
					<!-- Left Column -->
					<div>
						<div class="mb-3">
							<Label for="algorithm" class="mb-1 block">Algorithm</Label>
							<Select bind:value={workingState.trainHintAlgorithm} id="algorithm" placeholder="">
								<option value="step">Reveal step-by-step</option>
								<option value="allAtOnce">Reveal all at once</option>
								<option value="always">Show all time</option>
							</Select>
						</div>

						<div class="mb-3">
							<Label for="stickering" class="mb-1 block">Stickering</Label>
							<Select bind:value={workingState.trainHintStickering} id="stickering" placeholder="">
								<option value="f2l">F2L Stickering</option>
								<option value="fully">Fully stickered</option>
							</Select>
						</div>
					</div>

					<!-- Right Column -->
					<div>
						<div
							class="mb-3"
							class:flash={flashCrossColor}
							aria-invalid={flashCrossColor}
							aria-describedby={flashCrossColor || flashFrontColor
								? 'cross-front-error'
								: undefined}
						>
							<Label for="crossColor" class="mb-1 block">Cross color</Label>
							<Select bind:value={workingState.crossColor} id="crossColor" placeholder="">
								{#each STICKER_COLORS_WITH_RANDOM as color}
									<option value={color}>
										<!-- Make first letter uppercase -->
										{color.charAt(0).toUpperCase() + color.slice(1)}
									</option>
								{/each}
							</Select>
						</div>

						<div
							class="mb-3"
							class:flash={flashFrontColor}
							aria-invalid={flashFrontColor}
							aria-describedby={flashCrossColor || flashFrontColor
								? 'cross-front-error'
								: undefined}
						>
							<Label for="frontColor" class="mb-1 block">Front color</Label>
							<Select bind:value={workingState.frontColor} id="frontColor" placeholder="">
								{#each STICKER_COLORS_WITH_RANDOM as color}
									<option value={color}>
										<!-- Make first letter uppercase -->
										{color.charAt(0).toUpperCase() + color.slice(1)}
									</option>
								{/each}
							</Select>
							{#if flashCrossColor || flashFrontColor}
								<p id="cross-front-error" class="mt-1 text-sm text-red-600" role="alert">
									Cross and Front colors must be adjacent (not the same or opposite).
								</p>
							{/if}
						</div>
					</div>
				</div>
			</section>

			<!-- Danger Zone Section -->
			<section class="rounded-lg border border-red-400 bg-red-50 p-4">
				<h3 class="mb-3 text-lg font-medium text-red-700">Danger Zone</h3>
				<div class="flex items-center justify-between">
					<div>
						<p class="font-medium text-gray-900">Clear All Data</p>
						<p class="text-sm text-gray-600">
							Delete all saved settings, case states, and progress
						</p>
					</div>
					<Button color="red" outline onclick={handleClearStorage} class="gap-2">
						<Trash2 size={16} />
						Clear Data
					</Button>
				</div>
			</section>
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
