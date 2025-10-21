<script lang="ts">
	import { casesState } from '$lib/casesState.svelte';
	import { casesStatic } from '$lib/casesStatic';
	import type { Side } from '$lib/types/casesStatic';
	import type { AlgorithmSelection } from '$lib/types/caseState';
	import type { CaseId, GroupId } from '$lib/types/group';
	import { mirrorAlg } from '$lib/utils/mirrorAlg';
	import { Input, Listgroup, ListgroupItem } from 'flowbite-svelte';

	let {
		groupId,
		caseId,
		side,
		onSelectionChange
	}: {
		groupId: GroupId;
		caseId: CaseId;
		side: Side;
		onSelectionChange: (algorithmSelection: number | null, side: Side) => void;
	} = $props();

	let algorithmSelection: number | null = $state(
		side === 'left'
			? casesState[groupId][caseId].algorithmSelection.left
			: casesState[groupId][caseId].algorithmSelection.right
	);

	const staticData = casesStatic[groupId][caseId];
	const caseState = casesState[groupId][caseId];

	const algorithmPool = staticData.algPool;

	// let algSelection = $state(
	// 	side === 'left' ? caseState.algorithmSelection.left : caseState.algorithmSelection.right
	// );
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
			{side === 'left' ? mirrorAlg(alg) : alg}, Index: {index}
		</ListgroupItem>
	{/each}
	<ListgroupItem
		current={algorithmSelection === null}
		onclick={() => {
			algorithmSelection = null;
			onSelectionChange(algorithmSelection, side);
		}}
	>
		<Input placeholder="Enter custom algorithm"></Input>
	</ListgroupItem>
</Listgroup>
