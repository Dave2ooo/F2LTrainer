<script lang="ts">
	import { Button, Input, Label, Checkbox, Tabs, TabItem, Select, ButtonGroup } from 'flowbite-svelte';
    import Modal from '$lib/components/Modal.svelte';
	import { sessionState } from '$lib/sessionState.svelte';
	import { GROUP_IDS, GROUP_DEFINITIONS } from '$lib/types/group';
    import Update from '$lib/components/Modals/Buttons/Update.svelte';
    import { CircleQuestionMark } from '@lucide/svelte';
    import TooltipButton from '$lib/components/Modals/TooltipButton.svelte';
    import SessionIndividualCaseSelector from '$lib/components/Session/SessionIndividualCaseSelector.svelte';
    import resolveStickerColors from '$lib/utils/resolveStickerColors';

	let { open = $bindable(), sessionId, isNew = false } = $props();

	let session = $derived(sessionState.sessions.find((s) => s.id === sessionId));
    // We bind to a local copy or direct to session settings? 
    // Direct binding is risky if we want 'cancel', but for now let's do direct for simplicity as per "prototype" request.
    // Actually, Svelte 5 state is fine.

    let settings = $derived(session?.settings);

    // Options for selects
    const hintAlgoOptions = [
        { value: 'step', name: 'Reveal step-by-step' },
        { value: 'allAtOnce', name: 'Reveal all at once' },
        { value: 'always', name: 'Show all time' }
    ];

     const hintStickerOptions = [
        { value: 'f2l', name: 'F2L Stickering' },
        { value: 'fully', name: 'Fully stickered' }
    ];
    
    
    // Color options for checkboxes
    const colors = ['white', 'yellow', 'green', 'blue', 'red', 'orange'];

    // Resolved colors for TwistyPlayer in individual case selector
    const [crossColor, frontColor] = $derived.by(() => {
        if (!settings) return ['white', 'red'];
        return resolveStickerColors(settings.crossColor as any, settings.frontColor as any);
    });

</script>

{#if session && settings}
	<Modal bind:open title="Session Settings" size="lg" autoclose={false}>
		<div class="flex flex-col gap-5">
			<!-- General Settings Section -->
			<div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
				<Label for="session-name" class="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Session Name</Label>
				<Input id="session-name" bind:value={session.name} placeholder="Enter session name" />
			</div>

			<Tabs style="underline">
				<TabItem open title="Case Selection">
                    <div class="flex flex-col gap-5 mt-4">
						<!-- Case Mode Section -->
						<div class="space-y-3">
							<Label class="text-sm font-semibold">Case Selection Mode</Label>
                        	<ButtonGroup class="w-full *:flex-1">
                            	<Button color={settings.caseMode === 'group' ? 'blue' : 'alternative'} onclick={() => settings.caseMode = 'group'}>Group</Button>
                            	<Button color={settings.caseMode === 'individual' ? 'blue' : 'alternative'} onclick={() => settings.caseMode = 'individual'}>Individual</Button>
                        	</ButtonGroup>
						</div>

                        {#if settings.caseMode === 'group'}
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div class="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-lg">
                                    <Label class="font-semibold mb-3 text-sm">F2L Groups</Label>
									<div class="space-y-2">
                                    	{#each GROUP_IDS as groupId}
                                        	<Checkbox bind:checked={settings.trainGroupSelection[groupId]}>{GROUP_DEFINITIONS[groupId].name}</Checkbox>
                                    	{/each}
									</div>
                                </div>
                                <div class="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-lg">
                                    <Label class="font-semibold mb-3 text-sm">Training State</Label>
									<div class="space-y-2">
                                    	<Checkbox bind:checked={settings.trainStateSelection.unlearned} color="red">Unlearned</Checkbox>
                                    	<Checkbox bind:checked={settings.trainStateSelection.learning} color="yellow">Learning</Checkbox>
                                    	<Checkbox bind:checked={settings.trainStateSelection.finished} color="green">Finished</Checkbox>
									</div>
                                </div>
                            </div>
                        {:else}
                            <div class="mt-4">
								{#if settings}
									<SessionIndividualCaseSelector
										crossColor={crossColor as any}
										frontColor={frontColor as any}
										bind:selectedCases={settings.selectedCases}
									/>
								{/if}
							</div>
                        {/if}
                    </div>
				</TabItem>
				
                <TabItem title="Training">
                    <div class="flex flex-col gap-5 mt-4">
						<!-- Cube and Training Mode Grid -->
						<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<!-- Cube Type Section -->
							<div class="space-y-3">
                        		<Label class="text-sm font-semibold">Cube</Label>
                        		<ButtonGroup class="w-full *:flex-1">
                            		<Button color={!settings.smartCubeEnabled ? 'blue' : 'alternative'} onclick={() => settings.smartCubeEnabled = false}>Classic</Button>
                            		<Button color={settings.smartCubeEnabled ? 'blue' : 'alternative'} onclick={() => settings.smartCubeEnabled = true}>Smart Cube</Button>
                        		</ButtonGroup>
							</div>

							<!-- Train Mode Section -->
							<div class="space-y-3">
                        		<Label class="text-sm font-semibold">Training Mode</Label>
                        		<ButtonGroup class="w-full *:flex-1">
                            		<Button color={settings.trainMode === 'classic' ? 'blue' : 'alternative'} onclick={() => settings.trainMode = 'classic'}>Classic</Button>
                            		<Button color={settings.trainMode === 'drill' ? 'blue' : 'alternative'} onclick={() => settings.trainMode = 'drill'}>Drill</Button>
                        		</ButtonGroup>
							</div>
						</div>

						<!-- Slots and Additional Options Grid -->
						<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<!-- Slots Section -->
							<div class="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-lg">
								<Label class="font-semibold mb-3 text-sm">Cube Slots</Label>
								<div class="space-y-2">
									<Checkbox bind:checked={settings.trainSideSelection.left}>Left Slots</Checkbox>
									<Checkbox bind:checked={settings.trainSideSelection.right}>Right Slots</Checkbox>
								</div>
							</div>

							<!-- Additional Options Section -->
							<div class="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-lg">
								<Label class="font-semibold mb-3 text-sm">Additional Options</Label>
								<div class="space-y-2">
									<div class="flex items-center gap-2">
										<Checkbox bind:checked={settings.trainAddAuf}>Add Random AUF</Checkbox>
										<TooltipButton
											id="btn-session-settings-auf"
											tooltip="Adds a random U move to the end of the scramble"
											icon={CircleQuestionMark}
										/>
									</div>
									<Checkbox bind:checked={settings.trainShowTimer}>Show Timer</Checkbox>
								</div>
							</div>
						</div>

						<!-- Frequency Section -->
						<div class="space-y-3">
                        	<Label class="text-sm font-semibold">Case Frequency</Label>
                        	<ButtonGroup class="w-full *:flex-1">
                            	<Button color={settings.frequencyMode === 'smart' ? 'blue' : 'alternative'} onclick={() => settings.frequencyMode = 'smart'}>Smart Frequency</Button>
                            	<Button color={settings.frequencyMode === 'recap' ? 'blue' : 'alternative'} onclick={() => settings.frequencyMode = 'recap'}>Recap Mode</Button>
                        	</ButtonGroup>

                        	{#if settings.frequencyMode === 'smart'}
								<div class="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800 space-y-2">
                             		<Checkbox bind:checked={settings.smartFrequencySolved} class="text-sm">Prioritize Unsolved/Few Solves</Checkbox>
                             		<Checkbox bind:checked={settings.smartFrequencyTime} class="text-sm">Prioritize Slow Solves</Checkbox>
								</div>
                        	{:else}
                            	<div class="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
									<p class="text-sm text-gray-600 dark:text-gray-400">Recap mode cycles through all selected cases once.</p>
								</div>
                        	{/if}
						</div>
                    </div>
                </TabItem>

				<TabItem title="Visuals">
					<div class="flex flex-col gap-5 mt-4">
						<!-- Hint Settings -->
						<div class="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-lg">
							<Label class="font-semibold mb-4 text-sm">Hint Settings</Label>
                     		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        		<div>
                            		<Label class="mb-1.5 text-xs">Algorithm Hint</Label>
                            		<Select items={hintAlgoOptions} bind:value={settings.trainHintAlgorithm} />
                        		</div>
                         		<div>
                            		<Label class="mb-1.5 text-xs">Stickering Style</Label>
                            		<Select items={hintStickerOptions} bind:value={settings.trainHintStickering} />
                        		</div>
                    		</div>
						</div>

						<!-- Color Settings -->
						<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
							<!-- Cross Color -->
							<div class="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-lg">
								<Label class="font-semibold mb-3 text-sm">Cross Color</Label>
								<div class="grid grid-cols-2 gap-2">
									{#each colors as color}
										<Checkbox bind:group={settings.crossColor} value={color}>
											{color.charAt(0).toUpperCase() + color.slice(1)}
										</Checkbox>
									{/each}
								</div>
							</div>

							<!-- Front Color -->
							<div class="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-lg">
								<Label class="font-semibold mb-3 text-sm">Front Color</Label>
								<div class="grid grid-cols-2 gap-2">
									{#each colors as color}
										<Checkbox bind:group={settings.frontColor} value={color}>
											{color.charAt(0).toUpperCase() + color.slice(1)}
										</Checkbox>
									{/each}
								</div>
								{#if settings.crossColor.length > 1}
									<p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
										Randomized when multiple cross colors selected.
									</p>
								{/if}
							</div>
						</div>

						<!-- View Settings -->
						<div class="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-lg">
							<Label class="font-semibold mb-3 text-sm">View Options</Label>
                         	<Checkbox 
                            	checked={settings.backView === 'floating'}
                            	onchange={(e) => { settings.backView = (e.target as HTMLInputElement).checked ? 'floating' : 'none'}}
                         	>Show Back Slots (Floating View)</Checkbox>
						</div>
					</div>
                </TabItem>
			</Tabs>
            
             <Update
                onCancel={() => {
                    if (isNew && sessionId) sessionState.deleteSession(sessionId);
                    open = false;
                }}
                onSubmit={() => {
                    sessionState.save();
                    open = false;
                }}
            />
		</div>
	</Modal>
{/if}
