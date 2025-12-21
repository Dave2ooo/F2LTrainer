<script lang="ts">
	import { Modal, Button, Listgroup, ListgroupItem } from 'flowbite-svelte';
	import { sessionState } from '$lib/sessionState.svelte';
	import { Plus, Trash, Settings as SettingsIcon, Play } from '@lucide/svelte';
	import SessionSettingsModal from './SessionSettingsModal.svelte';

	let { open = $bindable() } = $props();

	let editingSessionId: string | null = $state(null);
	let showSettingsModal = $state(false);
    let isNewSession = $state(false);

	function handleCreate() {
		const newSession = sessionState.createSession('New Session');
		editingSessionId = newSession.id;
        isNewSession = true;
		showSettingsModal = true;
	}

	function handleEdit(id: string) {
		editingSessionId = id;
        isNewSession = false;
		showSettingsModal = true;
	}

	function handleDelete(id: string) {
		if (confirm('Are you sure you want to delete this session?')) {
			sessionState.deleteSession(id);
		}
	}

	function handleSelect(id: string) {
		sessionState.setActiveSession(id);
		open = false;
		// Logic to start training (switch view) will be handled by parent or effect
		// For now simple close
	}

    let activeSessionSettings = $derived(
        editingSessionId 
            ? sessionState.sessions.find(s => s.id === editingSessionId)?.settings 
            : null
    );
</script>

<Modal bind:open title="Select Session" size="md" autoclose={false}>
	<div class="flex flex-col gap-4">
		<div class="max-h-[60vh] overflow-y-auto">
			<Listgroup class="w-full">
				{#each sessionState.sessions as session (session.id)}
					<ListgroupItem class="flex items-center justify-between p-3">
						<div class="flex flex-col">
							<span class="text-lg font-bold">{session.name}</span>
							<span class="text-sm text-gray-500">
								Last played: {new Date(session.lastPlayedAt).toLocaleDateString()}
								• Solves: {session.solveCount}
							</span>
						</div>
						<div class="flex gap-2">
							<Button color="alternative" size="xs" onclick={() => handleEdit(session.id)}>
								<SettingsIcon size={16} />
							</Button>
							<Button color="red" size="xs" onclick={() => handleDelete(session.id)}>
								<Trash size={16} />
							</Button>
							<Button color="green" size="xs" onclick={() => handleSelect(session.id)}>
								<Play size={16} />
							</Button>
						</div>
					</ListgroupItem>
				{/each}
			</Listgroup>
		</div>
		<Button color="blue" class="w-full" onclick={handleCreate}>
			<Plus class="mr-2 h-5 w-5" />
			Create New Session
		</Button>
	</div>
</Modal>

{#if activeSessionSettings && editingSessionId}
    <SessionSettingsModal 
        bind:open={showSettingsModal} 
        sessionId={editingSessionId}
        isNew={isNewSession}
    />
{/if}
