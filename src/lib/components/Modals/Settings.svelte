<script lang="ts">
	import { Button, Checkbox, Label, Modal, Select } from 'flowbite-svelte';
	import { globalState } from '$lib/globalState.svelte';
	import { STICKER_COLORS_WITH_RANDOM } from '$lib/types/stickering';
	import { regenerateTrainCaseQueue } from '$lib/trainCaseQueue.svelte';
	import { trainSettingsManager } from '$lib/utils/trainSettings';

	let open = false;

	export function openModal() {
		if (globalState.view === 'train') trainSettingsManager.saveTrainSettings();
		open = true;
	}

	// Working copy for editing
	let workingState = {
		crossColor: globalState.crossColor,
		frontColor: globalState.frontColor,
		trainStateSelection: { ...globalState.trainStateSelection },
		trainGroupSelection: { ...globalState.trainGroupSelection },
		trainSideSelection: { ...globalState.trainSideSelection },
		trainAddAuf: globalState.trainAddAuf,
		trainHintShowCube: globalState.trainHintShowCube,
		trainHintAlgorithm: globalState.trainHintAlgorithm,
		trainHintStickering: globalState.trainHintStickering
	};

	function onConfirm() {
		// Copy workingState back to globalState
		globalState.crossColor = workingState.crossColor;
		globalState.frontColor = workingState.frontColor;
		globalState.trainStateSelection = { ...workingState.trainStateSelection };
		globalState.trainGroupSelection = { ...workingState.trainGroupSelection };
		globalState.trainSideSelection = { ...workingState.trainSideSelection };
		globalState.trainAddAuf = workingState.trainAddAuf;
		globalState.trainHintShowCube = workingState.trainHintShowCube;
		globalState.trainHintAlgorithm = workingState.trainHintAlgorithm;
		globalState.trainHintStickering = workingState.trainHintStickering;
		if (globalState.view === 'train')
			if (!trainSettingsManager.areTrainSettingsUnchanged()) regenerateTrainCaseQueue();
		open = false;
	}

	function onCancel() {
		open = false;
	}
</script>

<Modal bind:open title="Settings" size="md" outsideclose={true} autoclose={false}>
	<form
		onsubmit={(e) => {
			e.preventDefault();
			onConfirm();
		}}
	>
		<div class="space-y-6">
			<!-- Train Settings Section -->
			<section class="rounded-lg border border-gray-200 p-4">
				<h3 class="mb-3 text-lg font-medium">Train Settings</h3>

				<!-- Statuses -->
				<div class="mb-4">
					<p class="mb-2 font-medium">Statuses</p>
					<div class="flex flex-wrap gap-4">
						<Checkbox bind:checked={workingState.trainStateSelection.unlearned}>Unlearned</Checkbox>
						<Checkbox bind:checked={workingState.trainStateSelection.learning}>Learning</Checkbox>
						<Checkbox bind:checked={workingState.trainStateSelection.finished}>Finished</Checkbox>
					</div>
				</div>

				<!-- Group -->
				<div class="mb-4">
					<p class="mb-2 font-medium">Group</p>
					<div class="flex flex-wrap gap-4">
						<Checkbox bind:checked={workingState.trainGroupSelection.basic}>Basic</Checkbox>
						<Checkbox bind:checked={workingState.trainGroupSelection.basicBack}>Basic Back</Checkbox
						>
						<Checkbox bind:checked={workingState.trainGroupSelection.advanced}>Advanced</Checkbox>
						<Checkbox bind:checked={workingState.trainGroupSelection.expert}>Expert</Checkbox>
					</div>
				</div>

				<!-- Side -->
				<div class="mb-4">
					<p class="mb-2 font-medium">Side</p>
					<div class="flex flex-wrap gap-4">
						<Checkbox bind:checked={workingState.trainSideSelection.left}>Left</Checkbox>
						<Checkbox bind:checked={workingState.trainSideSelection.right}>Right</Checkbox>
					</div>
				</div>

				<!-- Add AUF -->
				<div>
					<div class="mb-4">
						<p class="mb-2 font-medium">AUF</p>
						<div class="flex flex-wrap gap-4">
							<div class="flex items-center">
								<Checkbox bind:checked={workingState.trainAddAuf}>Add AUF</Checkbox>
							</div>
						</div>
					</div>
				</div>
			</section>

			<!-- Hint Settings Section -->
			<section class="rounded-lg border border-gray-200 p-4">
				<h3 class="mb-3 text-lg font-medium">Hint Settings</h3>

				<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
					<!-- Left Column -->
					<div>
						<div class="mb-3 flex items-center">
							<Checkbox bind:checked={workingState.trainHintShowCube} id="showHint"
								>Show Hint</Checkbox
							>
						</div>

						<div class="mb-3">
							<Label for="algorithm" class="mb-1 block">Algorithm</Label>
							<Select bind:value={workingState.trainHintAlgorithm} id="algorithm" placeholder="">
								<option value="step">Reveal step-by-step</option>
								<option value="allAtOnce">Reveal all at once</option>
								<option value="always">Show all time</option>
							</Select>
						</div>

						<div>
							<Label for="stickering" class="mb-1 block">Stickering</Label>
							<Select bind:value={workingState.trainHintStickering} id="stickering" placeholder="">
								<option value="f2l">F2L Stickering</option>
								<option value="fully">Fully stickered</option>
							</Select>
						</div>
					</div>

					<!-- Right Column -->
					<div>
						<div class="mb-3">
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

						<div>
							<Label for="frontColor" class="mb-1 block">Front color</Label>
							<Select bind:value={workingState.frontColor} id="frontColor" placeholder="">
								{#each STICKER_COLORS_WITH_RANDOM as color}
									<option value={color}>
										<!-- Make first letter uppercase -->
										{color.charAt(0).toUpperCase() + color.slice(1)}
									</option>
								{/each}
							</Select>
						</div>
					</div>
				</div>
			</section>
		</div>

		<!-- <svelte:fragment slot="footer"> -->
		<div class="flex w-full justify-end gap-3">
			<Button type="button" color="gray" outline onclick={onCancel}>Cancel</Button>
			<Button type="submit">Update</Button>
		</div>
	</form>
</Modal>

<!-- </svelte:fragment> -->

<style>
	/* Optional: additional styling tweaks */
</style>
