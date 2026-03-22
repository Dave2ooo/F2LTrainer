<script lang="ts">
	import { tick } from 'svelte';
	import {
		casesState,
		TrainStateColors,
		TrainStateTextColors,
		TrainStateLabels,
		updateCaseState
	} from '$lib/casesState.svelte';
	import { trainState } from '$lib/trainCaseQueue.svelte';
	import { sessionState } from '$lib/sessionState.svelte';
	import { TRAIN_STATES } from '$lib/types/caseState';
	import { Button, Dropdown, DropdownItem, DropdownDivider } from 'flowbite-svelte';
	import { ChevronDownOutline } from 'flowbite-svelte-icons';
	import { Trash2, Plus } from '@lucide/svelte';

	// Props
	let { onremove, onadd }: { onremove?: () => void; onadd?: () => void } = $props();

	// local reactive mirror of the global state.current
	let currentTrainCase = $derived(trainState.current);

	let currentTrainCaseTrainState = $derived(
		currentTrainCase
			? casesState[currentTrainCase.groupId][currentTrainCase.caseId].trainState
			: 'unlearned'
	);

	let isIndividualMode = $derived(sessionState.activeSession?.settings.caseMode === 'individual');

	let isInSession = $derived(
		currentTrainCase
			? !!sessionState.activeSession?.settings.selectedCases?.[
					`${currentTrainCase.groupId}-${currentTrainCase.caseId}`
				]
			: false
	);

	const triggerId = `train-state-dd-${Math.random().toString(36).slice(2)}`;
	let dropdownOpen = $state(false);

	async function handleRemove() {
		if (currentTrainCase && sessionState.activeSession) {
			const key = `${currentTrainCase.groupId}-${currentTrainCase.caseId}`;
			// Remove from session settings
			if (sessionState.activeSession.settings.selectedCases) {
				delete sessionState.activeSession.settings.selectedCases[key];
				sessionState.save();
			}

			await tick();
			dropdownOpen = true;
			onremove?.();
		}
	}

	async function handleAdd() {
		if (currentTrainCase && sessionState.activeSession) {
			const key = `${currentTrainCase.groupId}-${currentTrainCase.caseId}`;
			if (sessionState.activeSession.settings.selectedCases) {
				sessionState.activeSession.settings.selectedCases[key] = true;
				sessionState.save();
			}

			await tick();
			dropdownOpen = true;
			onadd?.();
		}
	}
</script>

{#if currentTrainCase}
	<div>
		<Button
			id={triggerId}
			class="text-left {currentTrainCaseTrainState === 'unlearned'
				? 'text-gray-900 dark:text-white'
				: ''}"
			style="background: {TrainStateColors[currentTrainCaseTrainState]}; {TrainStateTextColors[
				currentTrainCaseTrainState
			]
				? `color: ${TrainStateTextColors[currentTrainCaseTrainState]};`
				: ''} {currentTrainCaseTrainState === 'unlearned'
				? `box-shadow: inset 0 0 0 2px var(--color-theme-border);`
				: ''}"
			aria-haspopup="true"
			aria-label={TrainStateLabels[currentTrainCaseTrainState]}
			title={TrainStateLabels[currentTrainCaseTrainState]}
			type="button"
		>
			{TrainStateLabels[currentTrainCaseTrainState]}
			<ChevronDownOutline class="ms-2 inline h-5 w-5" />
		</Button>

		<Dropdown simple class="w-44" triggeredBy="#{triggerId}" bind:isOpen={dropdownOpen}>
			{#each TRAIN_STATES as trainState}
				<DropdownItem
					onclick={async () => {
						updateCaseState(currentTrainCase.groupId, currentTrainCase.caseId, {
							trainState
						});
						await tick();
						dropdownOpen = true;
					}}
					class="w-full text-center {trainState === 'unlearned'
						? 'text-gray-900 dark:text-white'
						: ''}"
					style="background: {TrainStateColors[trainState]}; {TrainStateTextColors[trainState]
						? `color: ${TrainStateTextColors[trainState]};`
						: ''}"
				>
					{TrainStateLabels[trainState]}
				</DropdownItem>
			{/each}
			{#if isIndividualMode}
				<DropdownDivider />
				{#if isInSession}
					<DropdownItem
						onclick={handleRemove}
						class="w-full text-center text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
					>
						<div class="flex items-center justify-center gap-2">
							<Trash2 size={20} />
							<span>Remove case from session</span>
						</div>
					</DropdownItem>
				{:else}
					<DropdownItem
						onclick={handleAdd}
						class="w-full text-center text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
					>
						<div class="flex items-center justify-center gap-2">
							<Plus size={20} />
							<span>Add case to session</span>
						</div>
					</DropdownItem>
				{/if}
			{/if}
		</Dropdown>
	</div>
{/if}
