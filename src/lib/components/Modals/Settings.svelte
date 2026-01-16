<script lang="ts">
	import { Button, Range, Label } from 'flowbite-svelte';
	import Modal from '../Modal.svelte';
	import { Trash2, RotateCcw } from '@lucide/svelte';
	import ClearStorageModal from './ClearStorageModal.svelte';
	import { clearAllLocalStorage } from '$lib/utils/localStorage';
	import ThemeSwitch from '$lib/components/ThemeSwitch.svelte';
	import {
		globalState,
		DEFAULT_CAMERA_LATITUDE,
		DEFAULT_CAMERA_LONGITUDE
	} from '$lib/globalState.svelte';
	import { onMount } from 'svelte';

	let open = $state(false);
	let clearStorageModal: ClearStorageModal;
	let twistyPlayerLoaded = $state(false);
	let previewPlayer: HTMLElement | undefined = $state();

	export function openModal() {
		open = true;
	}

	async function handleClearStorage() {
		const confirmed = await clearStorageModal.confirm();
		if (confirmed) {
			clearAllLocalStorage();
			// Reload the page to reset all state
			window.location.reload();
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
				This will permanently delete all your progress, sessions, and settings. This action cannot
				be undone.
			</p>
			<Button
				size="sm"
				color="red"
				outline
				onclick={handleClearStorage}
				class="w-full gap-2 sm:w-auto"
			>
				<Trash2 size={16} />
				Clear All Data
			</Button>
		</section>
	</div>
</Modal>

<ClearStorageModal bind:this={clearStorageModal} />
