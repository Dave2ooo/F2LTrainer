<script lang="ts">
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

	const algorithmPool = staticData.algPool;

	let customAlg = $state(side === 'left' ? customAlgInitial.left : customAlgInitial.right);
	$effect(() => {
		onCustomAlgChange(customAlg, side);
	});

	// selected item/input should show orange background and white text in both themes
	const selectedClass =
		'bg-[var(--color-primary-600)] text-white dark:bg-[var(--color-primary-600)] dark:text-white';
	const selectedInputClass =
		'bg-[var(--color-primary-600)] text-white placeholder:text-white/80 dark:bg-[var(--color-primary-600)] dark:text-white dark:placeholder:text-white/80';
</script>

<Listgroup active class="mt-4 mb-4">
	{#each algorithmPool as alg, index}
		<ListgroupItem
			current={algorithmSelection === index}
			onclick={() => {
				algorithmSelection = index;
				onSelectionChange(algorithmSelection, side);
			}}
			class={'text-center ' + (algorithmSelection === index ? selectedClass : '')}
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
		class={'text-center ' + (algorithmSelection === null ? selectedClass : '')}
	>
		<Input
			class={'border-0 bg-transparent p-1 text-center md:text-xl dark:bg-transparent ' +
				(algorithmSelection === null ? selectedInputClass : '')}
			placeholder="Enter custom algorithm"
			bind:value={customAlg}
			maxlength={60}
		></Input>
	</ListgroupItem>
</Listgroup>
