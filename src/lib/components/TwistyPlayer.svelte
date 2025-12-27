<!-- https://js.cubing.net/cubing/api/classes/twisty.TwistyPlayer.html -->
<script lang="ts">
	import { casesState, getCaseAlg, getCaseScramble } from '$lib/casesState.svelte';
	import { casesStatic } from '$lib/casesStatic';
	import type { CustomAlgorithm } from '$lib/types/caseState';
	import getRotationAlg from '$lib/rotation';
	import getStickeringString from '$lib/stickering';
	import type { AlgorithmSelection } from '$lib/types/caseState';
	import type { GroupId } from '$lib/types/group';
	import type { Side } from '$lib/types/Side';
	import type { StickerColor } from '$lib/types/stickering';
	import type { Auf } from '$lib/types/trainCase';
	import { concatinateAuf } from '$lib/utils/addAuf';
	import { onMount, onDestroy } from 'svelte';
	import { RotateCw, Eye, EyeOff } from '@lucide/svelte';
	import { setupTwistyPlayerClickHandlers } from '$lib/utils/twistyPlayerClickHandler';
	import type { HintStickering } from '$lib/types/globalState';
	import { checkF2LState } from '$lib/utils/checkF2LState';
	import { isRotationMove, applyRotationToMove, combineRotations } from '$lib/utils/moveValidator';


	interface Props {
		groupId?: GroupId;
		caseId?: number;
		scrambleSelection?: number;
		algorithmSelection?: AlgorithmSelection;
		customAlgorithm?: CustomAlgorithm;
		auf?: Auf;
		side: Side;
		crossColor: StickerColor;
		frontColor: StickerColor;
		stickering?: HintStickering;
		controlPanel?: 'bottom-row' | 'none';
		experimentalDragInput?: 'auto' | 'none';
		// `size` removed: use `class` for responsive sizing instead
		scramble?: string;
		alg?: string;
		onclick?: () => void;
		// optional `class` prop allows parent components to set responsive sizing via CSS
		class?: string;
		hidePlayer?: boolean;
		showVisibilityToggle?: boolean;
		tempoScale?: number;
		showAlg?: boolean;
		logNormalizedPattern?: boolean;
		onF2LSolved?: () => void;
		onCubeSolved?: () => void;
		backView?: 'none' | 'floating';
		backViewEnabled?: boolean;
		movesAdded?: string; // Transformed moves for display
		rawMovesAdded?: string; // Raw physical moves for F2L checking
	}

	let {
		groupId,
		caseId,
		scrambleSelection = 0,
		algorithmSelection,
		customAlgorithm,
		auf = '',
		side,
		crossColor = 'white',
		frontColor = 'red',
		stickering = 'f2l',
		controlPanel = 'none',
		experimentalDragInput = 'none',
		scramble = $bindable(''),
		alg = $bindable(''),
		onclick,
		class: extraClass = '',
		hidePlayer = $bindable(false),
		showVisibilityToggle = false,
		tempoScale = 1,
		showAlg = true,
		logNormalizedPattern = true,
		onF2LSolved,
		onCubeSolved,
		backView = 'none',
		backViewEnabled = false,
		movesAdded = $bindable(''),
		rawMovesAdded = $bindable('') // Raw moves from smart cube
	}: Props = $props();

	// Allow parent components to grab the raw <twisty-player> element if needed
	let el: HTMLElement;
	let isPlayerInitialized = $state(false);
	let kpuzzle: any = null;

	// Compute width/height based on size and control panel configuration
	const aspectRatio = $derived(controlPanel === 'bottom-row' ? 1.15 : 1);

	// When the parent supplies a CSS class, the wrapper should let CSS handle sizing
	// (use classes like `w-[20vw] md:w-[30vw] aspect-[5/6]`). Otherwise use numeric
	// `size` prop for fixed pixel sizing.
	const wrapperClass = $derived(['relative mx-auto', extraClass].filter(Boolean).join(' '));

	const staticData = $derived(
		groupId !== undefined && caseId !== undefined ? casesStatic[groupId]?.[caseId] : undefined
	);
	const caseState = $derived(
		groupId !== undefined && caseId !== undefined ? casesState[groupId]?.[caseId] : undefined
	);

	// if (algorithmSelection === undefined) {
	// 	algorithmSelection = caseState.algorithmSelection;
	// }

	const algWithoutAUF = $derived(
		staticData
			? getCaseAlg(
					staticData,
					algorithmSelection ?? caseState?.algorithmSelection ?? { left: 0, right: 0 },
					customAlgorithm ?? caseState?.customAlgorithm ?? { left: '', right: '' },
					side
				)
			: undefined
	);

	const scrambleWithoutAUF = $derived(
		staticData ? getCaseScramble(staticData, side, scrambleSelection) : undefined
	);

	$effect(() => {
		if (scrambleWithoutAUF !== undefined && algWithoutAUF !== undefined) {
			const [newScramble, newAlg] = concatinateAuf(scrambleWithoutAUF, algWithoutAUF, auf);
			scramble = newScramble;
			if (showAlg) {
				alg = newAlg;
			} else {
				alg = '';
			}
		}
	});

	// Auto-reset animation when key props change
	// In Svelte 5, referencing reactive values inside $effect automatically tracks them as dependencies
	// Note: When multiple props change in the same tick, Svelte batches updates and runs the effect once
	$effect(() => {
		// Reference props to track them as dependencies (Svelte 5 pattern)
		// These trigger the effect when they change:
		void groupId;
		void caseId;
		void side;
		void scrambleSelection;
		void algorithmSelection;
		void customAlgorithm;
		void auf;
		void crossColor;
		void frontColor;

		// Call jumpToStart and resetView when any tracked prop changes
		// Wait for the player to be initialized and add a small delay to ensure it's ready
		if (el && isPlayerInitialized) {
			// Reset moves added via smart cube when case changes
			movesAdded = '';
			rawMovesAdded = '';

			// Use setTimeout to ensure the TwistyPlayer has processed the prop changes
			setTimeout(() => {
				const player = el as any;
				// Explicitly reset properties to ensure any added moves are cleared
				if (player) {
					player.alg = alg || '';
					player.experimentalSetupAlg = [setupRotation, scramble].join(' ');
					jumpToStart();
					resetView();
				}
			}, 10);
		}
	});

	const setupRotation = $derived(getRotationAlg(crossColor, frontColor));

	const CAMERA_ANGLE = { right: 25, left: -25 };
	let cameraLongitude = $derived(CAMERA_ANGLE[side]);
	let cameraLatitude = $state(25);

	// Constants for camera position tracking
	const CAMERA_POSITION_TOLERANCE = 0.1; // Tolerance for comparing camera positions
	const TWISTY_PLAYER_INIT_DELAY = 100; // Delay in ms to ensure TwistyPlayer is fully initialized

	let stickeringString = $derived(
		stickering === 'f2l' && staticData
			? getStickeringString(staticData.pieceToHide, side, crossColor, frontColor)
			: undefined
	);

	// Track whether the reset button should be visible
	let showResetButton = $state(false);

	// Store event listeners for cleanup
	let cleanupClickHandlers: (() => void) | null = null;

	export function getElement() {
		return el as HTMLElement;
	}

	// Expose animation controls
	export function jumpToStart() {
		if (el) {
			const player = el as any;
			if (typeof player.jumpToStart === 'function') {
				player.jumpToStart();
			}
		}
	}

	export function jumpToEnd() {
		if (el) {
			const player = el as any;
			if (typeof player.jumpToEnd === 'function') {
				player.jumpToEnd();
			}
		}
	}

	export function play() {
		if (el) {
			const player = el as any;
			if (typeof player.play === 'function') {
				player.play();
			}
		}
	}

	export function pause() {
		if (el) {
			const player = el as any;
			if (typeof player.pause === 'function') {
				player.pause();
			}
		}
	}

	export function togglePlay() {
		if (el) {
			const player = el as any;
			// Use the native togglePlay method from the TwistyPlayer API
			if (typeof player.togglePlay === 'function') {
				player.togglePlay();
			}
		}
	}

	export function resetView() {
		if (el) {
			const player = el as any;
			player.cameraLongitude = cameraLongitude;
			player.cameraLatitude = cameraLatitude;
		}
	}

	function toggleVisibility() {
		hidePlayer = !hidePlayer;
	}

	// Register the custom element only on the client (avoids SSR issues)
	onMount(async () => {
		await import('cubing/twisty');

		// Set up event listener to track camera position changes
		// Wait a tick for the element to be fully initialized
		setTimeout(() => {
			if (el) {
				// Mark player as initialized
				isPlayerInitialized = true;

				try {
					const player = el as any;
					// Listen for camera position changes
					if (player.experimentalModel?.twistySceneModel?.orbitCoordinatesRequest) {
						player.experimentalModel.twistySceneModel.orbitCoordinatesRequest.addFreshListener(
							(coords: any) => {
								// Show reset button if camera is not at default position
								// Check both latitude and longitude
								const isAtDefaultPosition =
									Math.abs(coords.latitude - cameraLatitude) < CAMERA_POSITION_TOLERANCE &&
									Math.abs(coords.longitude - cameraLongitude) < CAMERA_POSITION_TOLERANCE;
								showResetButton = !isAtDefaultPosition;
							}
						);
					}

					// We store the kpuzzle to use it there.
					if (player.experimentalModel?.kpuzzle) {
						player.experimentalModel.kpuzzle.addFreshListener((kp: any) => {
							kpuzzle = kp;
						});
					}

					// Add click detection event listeners if onclick handler is provided
					if (onclick) {
						const { cleanup } = setupTwistyPlayerClickHandlers(player, onclick);
						cleanupClickHandlers = cleanup;
					}
				} catch (e) {
					console.warn('Could not set up camera position listener:', e);
				}
			}
		}, TWISTY_PLAYER_INIT_DELAY);
	});

	// Public method to add a move to the player dynamically (e.g. from Bluetooth)
	export async function addMove(move: string, rawMove?: string) {
		if (el) {
			const player = el as any;
			if (player.experimentalAddMove) {
				player.experimentalAddMove(move);
				movesAdded += (movesAdded ? ' ' : '') + move;

				// Track raw move separately (defaults to same as transformed move if not provided)
				const actualRawMove = rawMove || move;
				rawMovesAdded += (rawMovesAdded ? ' ' : '') + actualRawMove;

				// Re-apply stickering if needed
				// Sometimes adding a move might reset internal state depending on twisty-player version/behavior
				if (stickeringString) {
					player.experimentalStickeringMaskOrbits = stickeringString;
				}

				if (logNormalizedPattern && kpuzzle && staticData) {
					// Use the same moves that were applied to TwistyPlayer (movesAdded)
					const movesList = movesAdded.trim().split(/\s+/).filter((m) => m);
					const movesForF2LCheckList: string[] = [];
					let currentRotation = '';

					for (const move of movesList) {
						if (isRotationMove(move)) {
							const rots = currentRotation ? [currentRotation, move] : [move];
							currentRotation = combineRotations(rots);
						} else {
							movesForF2LCheckList.push(applyRotationToMove(move, currentRotation));
						}
					}
					const movesForF2LCheck = movesForF2LCheckList.join(' ');

					await checkF2LState(
						{ kpuzzle },
						scramble,
						movesForF2LCheck,
						staticData.pieceToHide,
						side,
						onF2LSolved,
						onCubeSolved
					);
				}
			}
		}
	}

	// Cleanup event listeners when component is destroyed
	onDestroy(() => {
		if (cleanupClickHandlers) {
			cleanupClickHandlers();
		}
	});
</script>

<!--
  Note: custom-element attributes are kebab-case.
  Only include an attribute when its value is defined.
-->
<!-- class="border-2 border-red-500" -->
<div class={wrapperClass}>
	<!-- Clickable overlay to preserve onclick when player is hidden -->
	{#if onclick && hidePlayer}
		<div
			role="button"
			tabindex="0"
			class="absolute inset-0 z-10 cursor-pointer"
			{onclick}
			onkeydown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					onclick?.();
				}
			}}
			aria-label="Next case"
		></div>
	{/if}

	<twisty-player
		style:width={'100%'}
		style:height={'100%'}
		style:opacity={hidePlayer ? '0' : '1'}
		style:pointer-events={hidePlayer ? 'none' : 'auto'}
		bind:this={el}
		puzzle="3x3x3"
		{alg}
		experimental-setup-alg={[setupRotation, scramble].join(' ')}
		camera-longitude={cameraLongitude}
		camera-latitude={cameraLatitude}
		experimental-stickering-mask-orbits={stickeringString}
		control-panel={controlPanel}
		experimental-drag-input={experimentalDragInput}
		background="none"
		hint-facelets={backView}
		back-view={backViewEnabled ? 'top-right' : 'none'}
		viewer-link="none"
		camera-distance="4.7"
		tempo-scale={tempoScale}
	></twisty-player>

	<!-- Visibility toggle button (top-left corner) -->
	{#if showVisibilityToggle}
		<button
			type="button"
			onclick={toggleVisibility}
			class="hover:bg-opacity-90 absolute top-1 left-1 z-20 rounded-full p-2 text-primary-600 transition-all duration-200"
			title={hidePlayer ? 'Show Cube' : 'Hide Cube'}
			aria-label={hidePlayer ? 'Show Cube' : 'Hide Cube'}
		>
			{#if hidePlayer}
				<Eye class="size-6" strokeWidth={3} />
			{:else}
				<EyeOff class="size-6" strokeWidth={3} />
			{/if}
		</button>
	{/if}

	{#if showResetButton && !hidePlayer}
		<button
			type="button"
			onclick={resetView}
			class="hover:bg-opacity-90 absolute top-1 right-1 rounded-full p-2 text-primary-600 transition-all duration-200"
			title="Reset View"
			aria-label="Reset camera view"
		>
			<RotateCw class="size-6" strokeWidth={3} />
		</button>
	{/if}
</div>

<!-- style="width: 145px; height: 160px" -->
