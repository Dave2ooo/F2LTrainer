<script lang="ts">
	import { Modal, Button, Input, Label, Checkbox, Tabs, TabItem, Select } from 'flowbite-svelte';
	import { sessionState } from '$lib/sessionState.svelte';
	import { GROUP_IDS, GROUP_DEFINITIONS } from '$lib/types/group';
    import { Trash } from '@lucide/svelte';

	let { open = $bindable(), sessionId, isNew = false } = $props();

	let session = $derived(sessionState.sessions.find((s) => s.id === sessionId));
    // We bind to a local copy or direct to session settings? 
    // Direct binding is risky if we want 'cancel', but for now let's do direct for simplicity as per "prototype" request.
    // Actually, Svelte 5 state is fine.

    let settings = $derived(session?.settings);

    // Options for selects
    const hintAlgoOptions = [
        { value: 'none', name: 'None' },
        { value: 'step', name: 'Step by Step' },
        { value: 'full', name: 'Full Algorithm' }
    ];

     const hintStickerOptions = [
        { value: 'none', name: 'None' },
        { value: 'cross', name: 'Cross Only' },
        { value: 'f2l', name: 'F2L' },
        { value: 'll', name: 'Last Layer (Full)' } // Mapping 'full' to 'll' description or similar
    ];
    
    // For colors, just simple text inputs or selects for now
    const colors = ['white', 'yellow', 'green', 'blue', 'red', 'orange'];
    const colorOptions = colors.map(c => ({ value: c, name: c }));

</script>

{#if session && settings}
	<Modal bind:open title="Session Settings" size="lg" autoclose={false}>
		<div class="flex flex-col gap-4">
			<!-- General -->
			<div>
				<Label for="session-name" class="mb-2">Session Name</Label>
				<Input id="session-name" bind:value={session.name} placeholder="Enter session name" />
			</div>

            <Checkbox bind:checked={settings.smartCubeEnabled}>Enable Smart Cube</Checkbox>

			<Tabs style="underline">
				<TabItem open title="Case Selection">
                    <div class="flex flex-col gap-4 mt-2">
                        <Label>Mode (Not yet fully implemented)</Label>
                        <div class="flex gap-4">
                            <Button color={settings.caseMode === 'group' ? 'blue' : 'alternative'} onclick={() => settings.caseMode = 'group'}>Group</Button>
                            <Button color={settings.caseMode === 'individual' ? 'blue' : 'alternative'} onclick={() => settings.caseMode = 'individual'}>Individual</Button>
                        </div>

                        {#if settings.caseMode === 'group'}
                            <div class="grid grid-cols-2 gap-4">
                                <div class="border p-2 rounded">
                                    <Label class="font-bold mb-2">Groups</Label>
                                    {#each GROUP_IDS as groupId}
                                        <Checkbox bind:checked={settings.trainGroupSelection[groupId]} class="mb-1">{GROUP_DEFINITIONS[groupId].name}</Checkbox>
                                    {/each}
                                </div>
                                <div class="border p-2 rounded">
                                    <Label class="font-bold mb-2">Train State</Label>
                                    <Checkbox bind:checked={settings.trainStateSelection.unlearned} class="mb-1" color="red">Unlearned</Checkbox>
                                    <Checkbox bind:checked={settings.trainStateSelection.learning} class="mb-1" color="yellow">Learning</Checkbox>
                                    <Checkbox bind:checked={settings.trainStateSelection.finished} class="mb-1" color="green">Finished</Checkbox>
                                </div>
                                <div class="border p-2 rounded">
                                    <Label class="font-bold mb-2">Slots (Sides)</Label>
                                    <Checkbox bind:checked={settings.trainSideSelection.left} class="mb-1">Left Slots</Checkbox>
                                    <Checkbox bind:checked={settings.trainSideSelection.right} class="mb-1">Right Slots</Checkbox>
                                </div>
                            </div>
                        {:else}
                            <p>Individual case selection to be implemented.</p>
                        {/if}
                    </div>
				</TabItem>
				
                <TabItem title="Frequency">
                    <div class="flex flex-col gap-4 mt-2">
                         <div class="flex gap-4">
                            <Button color={settings.frequencyMode === 'smart' ? 'blue' : 'alternative'} onclick={() => settings.frequencyMode = 'smart'}>Smart Frequency</Button>
                            <Button color={settings.frequencyMode === 'recap' ? 'blue' : 'alternative'} onclick={() => settings.frequencyMode = 'recap'}>Recap Mode</Button>
                        </div>

                        {#if settings.frequencyMode === 'smart'}
                             <Checkbox bind:checked={settings.smartFrequencySolved}>Prioritize Unsolved/Few Solves</Checkbox>
                             <Checkbox bind:checked={settings.smartFrequencyTime}>Prioritize Slow Solves</Checkbox>
                        {:else}
                            <p>Recap mode will cycle through all selected cases once.</p>
                        {/if}
                    </div>
                </TabItem>

				<TabItem title="Visuals & Hints">
                     <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                        <div>
                            <Label>Algorithm Hint</Label>
                            <Select items={hintAlgoOptions} bind:value={settings.trainHintAlgorithm} />
                        </div>
                         <div>
                            <Label>Stickering Style</Label>
                            <Select items={hintStickerOptions} bind:value={settings.trainHintStickering} />
                        </div>
                         <div>
                            <Label>Cross Color</Label>
                             <Select items={colorOptions} bind:value={settings.crossColor[0]} /> <!-- Simplified single color for now -->
                        </div>
                         <div>
                            <Label>Front Color</Label>
                             <Select items={colorOptions} bind:value={settings.frontColor[0]} />
                        </div>
                    </div>
                </TabItem>
			</Tabs>
		</div>
        <svelte:fragment slot="footer">
            <div class="flex w-full justify-between">
                 <Button color="alternative" onclick={() => {
                     if (isNew && sessionId) sessionState.deleteSession(sessionId);
                     open = false;
                 }}>Cancel</Button>
                 <Button onclick={() => open = false}>{isNew ? 'Create' : 'Save'}</Button>
            </div>
        </svelte:fragment>
	</Modal>
{/if}
