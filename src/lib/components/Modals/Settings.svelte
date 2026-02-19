<script lang="ts">
	import { Button, Range, Label } from 'flowbite-svelte';
	import Modal from '../Modal.svelte';
	import { Trash2, RotateCcw, Cloud, HardDrive, AlertTriangle } from '@lucide/svelte';
	import ClearLocalDataModal from './ClearLocalDataModal.svelte';
	import ClearCloudDataModal from './ClearCloudDataModal.svelte';
	import ClearAllDataModal from './ClearAllDataModal.svelte';
	import { clearAllLocalStorage } from '$lib/utils/localStorage';
	import ThemeSwitch from '$lib/components/ThemeSwitch.svelte';
	import {
		globalState,
		DEFAULT_CAMERA_LATITUDE,
		DEFAULT_CAMERA_LONGITUDE
	} from '$lib/globalState.svelte';
	import { onMount } from 'svelte';
	import { useConvexClient } from 'convex-svelte';
	import { useClerkContext } from 'svelte-clerk';
	import { api } from '../../../convex/_generated/api';
	import { addToast } from '$lib/toastState.svelte';

	let open = $state(false);
	let clearLocalDataModal: ClearLocalDataModal;
	let clearCloudDataModal: ClearCloudDataModal;
	let clearAllDataModal: ClearAllDataModal;
	let twistyPlayerLoaded = $state(false);
	let previewPlayer: HTMLElement | undefined = $state();
	let isDeleting = $state(false);

	const client = useConvexClient();
	const ctx = useClerkContext();

	export function openModal() {
		open = true;
	}

	async function handleClearLocalData() {
		if (isDeleting) return;

		const confirmed = await clearLocalDataModal.confirm();
		if (confirmed) {
			isDeleting = true;
			try {
				clearAllLocalStorage();
				addToast('Local data cleared successfully', 'success');
				// Reload the page to reset all state
				window.location.reload();
			} catch (error) {
				console.error('Error clearing local data:', error);
				addToast('Failed to clear local data', 'error');
				isDeleting = false;
			}
		}
	}

	async function handleClearCloudData() {
		if (isDeleting) return;

		// Check if user is authenticated
		if (!ctx.session) {
			addToast('You must be signed in to clear cloud data', 'error');
			return;
		}

		// Prevent deletion during sync
		if (globalState.isSyncing) {
			addToast('Please wait for sync to complete before deleting cloud data', 'error');
			return;
		}

		const confirmed = await clearCloudDataModal.confirm();
		if (confirmed) {
			isDeleting = true;
			try {
				await client.mutation(api.deleteUserData.deleteMyData, {});
				addToast('Cloud data deleted successfully', 'success');
			} catch (error) {
				console.error('Error deleting cloud data:', error);
				addToast('Failed to delete cloud data. Please try again.', 'error');
			} finally {
				isDeleting = false;
			}
		}
	}

	async function handleClearAllData() {
		if (isDeleting) return;

		// Prevent deletion during sync
		if (globalState.isSyncing) {
			addToast('Please wait for sync to complete before deleting all data', 'error');
			return;
		}

		const confirmed = await clearAllDataModal.confirm();
		if (confirmed) {
			isDeleting = true;
			try {
				// If authenticated, delete cloud data first
				if (ctx.session) {
					try {
						await client.mutation(api.deleteUserData.deleteMyData, {});
					} catch (error) {
						console.error('Error deleting cloud data:', error);
						// Ask user if they want to proceed with local deletion
						const proceedAnyway = confirm(
							'Failed to delete cloud data. Do you still want to clear local data?'
						);
						if (!proceedAnyway) {
							isDeleting = false;
							return;
						}
					}
				}

				// Clear local data
				clearAllLocalStorage();
				addToast('All data cleared successfully', 'success');
				// Reload the page to reset all state
				window.location.reload();
			} catch (error) {
				console.error('Error clearing all data:', error);
				addToast('Failed to clear all data', 'error');
				isDeleting = false;
			}
		}
	}

	function resetCameraDefaults() {
		globalState.cameraLatitude = DEFAULT_CAMERA_LATITUDE;
		globalState.cameraLongitude = DEFAULT_CAMERA_LONGITUDE;
	}

	// Load twisty-player custom element on mount
	onMount(async () => {
		await import('cubing/twisty');
		twistyPlayerLoaded = true;
	});

	// Update camera position reactively without re-creating the player
	$effect(() => {
		if (previewPlayer) {
			const player = previewPlayer as any;
			player.cameraLatitude = globalState.cameraLatitude;
			player.cameraLongitude = globalState.cameraLongitude;
		}
	});
</script>

<Modal bind:open title="Settings" size="sm" outsideclose={true}>
	<div class="space-y-4">
		<!-- Appearance Section -->
		<section class="rounded-lg border border-gray-300 p-4 dark:border-gray-600">
			<div class="flex items-center justify-between">
				<h3 class="text-lg font-semibold text-gray-900 dark:text-white">Appearance</h3>
				<ThemeSwitch />
			</div>
		</section>

		<!-- Cube Visualization Section -->
		<section class="rounded-lg border border-gray-300 p-4 dark:border-gray-600">
			<h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Cube Visualization</h3>

			<!-- TwistyPlayer Preview -->
			<div class="mb-4 flex justify-center">
				{#if twistyPlayerLoaded}
					<twisty-player
						bind:this={previewPlayer}
						style="width: 150px; height: 150px;"
						puzzle="3x3x3"
						experimental-setup-alg="z2 y' R U R' U'"
						camera-latitude={globalState.cameraLatitude}
						camera-longitude={globalState.cameraLongitude}
						hint-facelets="none"
						back-view="none"
						control-panel="none"
						background="none"
						viewer-link="none"
						experimental-drag-input="none"
						camera-distance="4.7"
					></twisty-player>
				{:else}
					<div
						class="flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700"
						style="width: 150px; height: 150px;"
					>
						<span class="text-sm text-gray-500 dark:text-gray-400">Loading...</span>
					</div>
				{/if}
			</div>

			<!-- Camera Latitude Slider -->
			<div class="mb-4">
				<div class="mb-2 flex items-center justify-between">
					<Label class="text-sm font-medium text-gray-900 dark:text-white">Camera Latitude</Label>
					<span class="text-sm font-medium text-gray-900 dark:text-gray-100"
						>{globalState.cameraLatitude}°</span
					>
				</div>
				<Range
					id="camera-latitude"
					min={0}
					max={35}
					step={1}
					bind:value={globalState.cameraLatitude}
				/>
			</div>

			<!-- Camera Longitude Slider -->
			<div class="mb-4">
				<div class="mb-2 flex items-center justify-between">
					<Label class="text-sm font-medium text-gray-900 dark:text-white">Camera Longitude</Label>
					<span class="text-sm font-medium text-gray-900 dark:text-gray-100"
						>{globalState.cameraLongitude}°</span
					>
				</div>
				<Range
					id="camera-longitude"
					min={0}
					max={45}
					step={1}
					bind:value={globalState.cameraLongitude}
				/>
			</div>

			<!-- Reset Button -->
			<Button size="xs" color="alternative" onclick={resetCameraDefaults} class="gap-1.5">
				<RotateCcw size={14} />
				Reset to Default
			</Button>
		</section>

		<!-- Danger Zone Section -->
		<section
			class="rounded-lg border border-red-300 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/10"
		>
			<h3 class="mb-3 text-lg font-semibold text-red-700 dark:text-red-500">Danger Zone</h3>
			<p class="mb-4 text-sm text-red-600 dark:text-red-400">
				Delete your data locally, from the cloud, or both. These actions cannot be undone.
			</p>

			<div class="space-y-2">
				<!-- First row: Local and Cloud buttons (side by side on sm+) -->
				<div class="flex flex-col gap-2 sm:flex-row">
					<!-- Clear Local Data Button -->
					<Button
						size="sm"
						color="red"
						outline
						onclick={handleClearLocalData}
						disabled={isDeleting}
						class="w-full gap-2"
					>
						<HardDrive size={16} />
						Clear Local Data
					</Button>

					<!-- Clear Cloud Data Button (only show if authenticated) -->
					{#if ctx.session}
						<Button
							size="sm"
							color="red"
							outline
							onclick={handleClearCloudData}
							disabled={isDeleting}
							class="w-full gap-2"
						>
							<Cloud size={16} />
							Clear Cloud Data
						</Button>
					{/if}
				</div>

				<!-- Second row: Clear All button (only show if authenticated) -->
				{#if ctx.session}
					<Button
						size="sm"
						color="red"
						onclick={handleClearAllData}
						disabled={isDeleting}
						class="w-full gap-2"
					>
						<AlertTriangle size={16} />
						{isDeleting ? 'Deleting...' : 'Clear All Data'}
					</Button>
				{/if}
			</div>
		</section>
	</div>
</Modal>

<ClearLocalDataModal bind:this={clearLocalDataModal} />
<ClearCloudDataModal bind:this={clearCloudDataModal} />
<ClearAllDataModal bind:this={clearAllDataModal} />
