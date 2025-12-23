<script lang="ts">
	import { getNumberOfSelectedCases, regenerateTrainCaseQueue } from '$lib/trainCaseQueue.svelte';
	import { Button, P } from 'flowbite-svelte';
    import { Dropdown, DropdownItem, DropdownDivider, DropdownHeader } from 'flowbite-svelte';
    import { sessionState } from '$lib/sessionState.svelte';
    import { Settings as SettingsIcon, Edit2, Plus, ChevronDown } from '@lucide/svelte';
    import SessionSettingsModal from '$lib/components/Session/SessionSettingsModal.svelte';
    
    import TrainClassic from './TrainClassic.svelte';
    import TrainClassicSmart from './TrainClassicSmart.svelte';
    import TrainDrill from './TrainDrill.svelte';

    let showSessionSettings = $state(false);
    let isNewSession = $state(false);
	
	let activeSettings = $derived(sessionState.activeSession?.settings);

    $effect(() => {
        // Regenerate queue when session changes to apply new settings (colors, selected cases)
        // We use the ID as a key trigger
        if (sessionState.activeSessionId) {
            regenerateTrainCaseQueue();
        }
    });
</script>

<!-- Session Toolbar -->
<div class="w-full py-2 px-4 flex justify-center items-center mb-4 relative z-40">
    <div class="flex items-center gap-2">
        <div class="relative">
            <Button color="light" class="flex items-center gap-2 !px-3 font-medium border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-900 dark:text-white">
                 <span class="truncate max-w-[150px] sm:max-w-[200px]">{sessionState.activeSession?.name || 'Default Session'}</span>
                 <ChevronDown size={14} class="text-gray-500 dark:text-gray-400" />
            </Button>
            <Dropdown class="w-60 shadow-xl rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700">
                 <DropdownHeader class="bg-gray-50 dark:bg-gray-800 font-semibold text-gray-500 dark:text-gray-400 uppercase text-xs tracking-wider border-b border-gray-200 dark:border-gray-600">Switch Session</DropdownHeader>
                 {#each sessionState.sessions.filter(s => !s.archived) as session (session.id)}
                    <DropdownItem class="font-medium flex justify-between items-center text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600" onclick={() => sessionState.setActiveSession(session.id)}>
                        {session.name}
                        {#if session.id === sessionState.activeSessionId}
                             <!-- Simple indicator for active session -->
                             <span class="w-2 h-2 rounded-full bg-primary-600 dark:bg-primary-500"></span>
                        {/if}
                    </DropdownItem>
                 {/each}
                 {#if sessionState.sessions.filter(s => !s.archived).length > 1}
                    <DropdownDivider class="border-gray-200 dark:border-gray-600" />
                 {/if}
                 <DropdownItem class="hover:bg-gray-100 dark:hover:bg-gray-600" onclick={() => {
                     const newSession = sessionState.createSession('New Session');
                     sessionState.setActiveSession(newSession.id);
                     showSessionSettings = true;
                     isNewSession = true;
                 }}>
                    <div class="flex items-center gap-2 text-primary-600 dark:text-primary-400 font-semibold">
                        <Plus size={16} /> Create New Session
                    </div>
                 </DropdownItem>
            </Dropdown>
        </div>

        <Button color="light" size="sm" class="!p-2.5 border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600" onclick={() => {
             showSessionSettings = true;
             isNewSession = false;
         }}>
            <SettingsIcon size={16} class="text-gray-600 dark:text-gray-300" />
        </Button>
    </div>
</div>

{#if sessionState.activeSessionId}
    <SessionSettingsModal 
        bind:open={showSessionSettings} 
        sessionId={sessionState.activeSessionId}
        isNew={isNewSession}
    />
{/if}

{#if getNumberOfSelectedCases() > 0}
	{#if activeSettings}
        {#if activeSettings.trainMode === 'drill'}
            <TrainDrill />
        {:else if activeSettings.smartCubeEnabled}
            <TrainClassicSmart />
        {:else}
            <!-- Default or Classic Mode -->
            <TrainClassic />
        {/if}
    {:else}
         <!-- Fallback if no settings loaded (should happen rarely/briefly) -->
        <TrainClassic />
    {/if}
{:else}
	<P>No training cases available. Please select some cases first.</P>
{/if}
