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

<Listgroup active>
	{#each algorithmPool as alg, index}
		<ListgroupItem
			current={algorithmSelection === index}
			onclick={() => {
				algorithmSelection = index;
				onSelectionChange(algorithmSelection, side);
			}}
		>
			{side === 'left' ? mirrorAlg(alg) : alg}
		</ListgroupItem>
	{/each}
	<ListgroupItem
		current={algorithmSelection === null}
		onclick={() => {
			algorithmSelection = null;
			onSelectionChange(algorithmSelection, side);
		}}
	>
		<Input placeholder="Enter custom algorithm" bind:value={customAlg}></Input>
	</ListgroupItem>
</Listgroup>
