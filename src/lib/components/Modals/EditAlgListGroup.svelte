<script lang="ts">
	import { casesState } from '$lib/casesState.svelte';
	import { casesStatic } from '$lib/casesStatic';
	import type { Side } from '$lib/types/Side';
	import type { AlgorithmSelection, CustomAlgorithm } from '$lib/types/caseState';
	import type { CaseId, GroupId } from '$lib/types/group';
	import { mirrorAlg } from '$lib/utils/mirrorAlg';
	import { Input, Listgroup, ListgroupItem } from 'flowbite-svelte';

	let {
		groupId,
		caseId,
		side,
		algorithmSelectionInitial,
		customAlgInitial,
		onSelectionChange,
		onCustomAlgChange
	}: {
		groupId: GroupId;
		caseId: CaseId;
		side: Side;
		algorithmSelectionInitial: AlgorithmSelection;
		customAlgInitial: CustomAlgorithm;
		onSelectionChange: (algorithmSelection: number | null, side: Side) => void;
		onCustomAlgChange: (customAlgorithm: string, side: Side) => void;
	} = $props();

	let algorithmSelection: number | null = $state(
		side === 'left' ? algorithmSelectionInitial.left : algorithmSelectionInitial.right
	);

	const staticData = casesStatic[groupId][caseId];
	const caseState = casesState[groupId][caseId];

	const algorithmPool = staticData.algPool;

	// let algSelection = $state(
	// 	side === 'left' ? caseState.algorithmSelection.left : caseState.algorithmSelection.right
	// );
	let customAlg = $state(side === 'left' ? customAlgInitial.left : customAlgInitial.right);
	$effect(() => {
		onCustomAlgChange(customAlg, side);
	});
</script>

<Listgroup active class="mt-4 mb-4">
	{#each algorithmPool as alg, index}
		<ListgroupItem
			current={algorithmSelection === index}
			onclick={() => {
				algorithmSelection = index;
				onSelectionChange(algorithmSelection, side);
			}}
			class="text-center"
		>
			<div class="w-full text-center md:text-xl">
				{side === 'left' ? mirrorAlg(alg) : alg}
			</div>
		</ListgroupItem>
	{/each}
	<ListgroupItem
		current={algorithmSelection === null}
		onclick={() => {
			algorithmSelection = null;
			onSelectionChange(algorithmSelection, side);
		}}
		class="text-center"
	>
		<Input
			class="text-center md:text-xl"
			placeholder="Enter custom algorithm"
			bind:value={customAlg}
		></Input>
	</ListgroupItem>
</Listgroup>
