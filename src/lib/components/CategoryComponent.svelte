<script lang="ts">
        import { GROUP_DEFINITIONS, type GroupId } from '$lib/types/group';
        import CaseCard from '$lib/components/CaseCard.svelte';

        let {
                groupId,
                categoryIndex
        }: {
                groupId: GroupId;
                categoryIndex: number;
        } = $props();

        const groupDefinition = GROUP_DEFINITIONS[groupId];
        const category = groupDefinition.categories[categoryIndex];
        const categoryCases = category.cases;
</script>

<div class="flex flex-wrap gap-2">
        {#each categoryCases as caseId}
                <CaseCard {groupId} {caseId} />
        {/each}
</div>
