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
	import { simplifyAlg } from '$lib/utils/simplifyAlg';
	import { onMount, onDestroy } from 'svelte';
	import { RotateCw, Eye, EyeOff } from '@lucide/svelte';
	import { setupTwistyPlayerClickHandlers } from '$lib/utils/twistyPlayerClickHandler';
	import { Button, Tooltip } from 'flowbite-svelte';
	import type { HintStickering } from '$lib/types/globalState';
	import { checkF2LState } from '$lib/utils/checkF2LState';
	import { globalState } from '$lib/globalState.svelte';
	import {
		applyEOMaskToStickeringString,
		getEODisplayColor,
		recolorMysteryEdge
	} from '$lib/utils/edgeOrientationDisplay';
	import { sessionState } from '$lib/sessionState.svelte';
	import { bluetoothState } from '$lib/bluetooth/store.svelte';
	import * as THREE from 'three';

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
		onF2LSolved?: (entireF2LSolved: boolean) => void;
		onCubeSolved?: () => void;
		backView?: 'none' | 'floating';
		backViewEnabled?: boolean;
		movesAdded?: string; // Transformed moves for display
		enableEOColoring?: boolean;
		disableAutoScramble?: boolean; // if true, scramble from groupid/caseid will not be applied
		enableGyroOverride?: boolean;
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
		onF2LSolved,
		onCubeSolved,
		backView = 'none',
		backViewEnabled = false,
		movesAdded = $bindable(''),
		enableEOColoring = false,
		disableAutoScramble = false,
		enableGyroOverride
	}: Props = $props();

	// Raw moves tracked internally for F2L checking (not exposed to parent)
	let rawMovesAdded = $state('');

	// Derive whether F2L check is enabled from presence of callbacks
	const enableF2LCheck = $derived(!!(onF2LSolved || onCubeSolved));

	// Allow parent components to grab the raw <twisty-player> element if needed
	let el: HTMLElement;
	let isPlayerInitialized = $state(false);
	let kpuzzle: any = $state(null);

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
			if (!disableAutoScramble) {
				scramble = newScramble;
			} else {
				scramble = '';
			}
			if (showAlg) {
				alg = simplifyAlg(newAlg);
			} else {
				alg = '';
			}
		}
	});

	$effect(() => {
		void stickeringString;
		void isPlayerInitialized;

		if (!el || !isPlayerInitialized || !stickeringString) {
			return;
		}

		const player = el as any;
		player.experimentalStickeringMaskOrbits = stickeringString;
		applyEOColorIfNeeded();
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
				if (player) {
					jumpToStart();
					resetView();
					// Recolor after reset completes to ensure scene is stable
					applyEOColorIfNeeded();

					// Re-attach click handlers in case jumpToStart or prop changes recreated the internal DOM
					if (onclick) {
						if (cleanupClickHandlers) cleanupClickHandlers();
						const { cleanup } = setupTwistyPlayerClickHandlers(player, onclick);
						cleanupClickHandlers = cleanup;
					}
				}
			}, 50);
		}
	});

	const setupRotation = $derived(getRotationAlg(crossColor, frontColor));

	let cameraLongitude = $derived((side === 'right' ? 1 : -1) * globalState.cameraLongitude);
	let cameraLatitude = $derived(globalState.cameraLatitude);

	// Constants for camera position tracking
	const CAMERA_POSITION_TOLERANCE = 0.1; // Tolerance for comparing camera positions
	const TWISTY_PLAYER_INIT_DELAY = 100; // Delay in ms to ensure TwistyPlayer is fully initialized

	let stickeringString = $derived.by(() => {
		if (stickering === 'centers-only') {
			// 12 'I' chars for edges and 8 'I' chars for corners to ignore all their stickers
			return 'EDGES:IIIIIIIIIIII,CORNERS:IIIIIIII,CENTERS:------';
		}
		if (stickering !== 'f2l' || !staticData) return undefined;

		let baseStr = getStickeringString(staticData.pieceToHide, side, crossColor, frontColor);

		if (enableEOColoring && groupId && caseId && baseStr) {
			baseStr = applyEOMaskToStickeringString(
				baseStr,
				groupId,
				caseId,
				side,
				crossColor,
				frontColor
			);
		}

		return baseStr;
	});

	// Effect to dynamically recolor the "Mystery" edge piece (M) based on EO state
	function applyEOColorIfNeeded(): void {
		const currentStickeringString = stickeringString;
		const learnEO = enableEOColoring;
		const orientedColor = globalState.eoOrientedColor;
		const unorientedColor = globalState.eoUnorientedColor;

		if (
			!learnEO ||
			!currentStickeringString ||
			!el ||
			!groupId ||
			!caseId ||
			!orientedColor ||
			!unorientedColor
		) {
			return;
		}

		const transformedColor = getEODisplayColor(groupId, caseId, orientedColor, unorientedColor);
		if (transformedColor !== undefined) {
			void recolorMysteryEdge(el, transformedColor);
		}
	}

	$effect(() => {
		void movesAdded;
		applyEOColorIfNeeded();
	});

	// Track whether the reset button should be visible
	let isCameraRotated = $state(false);
	let gyroActive = $derived(
		(enableGyroOverride ?? sessionState.activeSession?.settings.gyroEnabled ?? false) &&
			bluetoothState.gyroSupported
	);
	let showResetButton = $derived(isCameraRotated || gyroActive);

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

	export function resetView(resetGyro = false) {
		if (el) {
			const player = el as any;
			player.cameraLongitude = cameraLongitude;
			player.cameraLatitude = cameraLatitude;
		}
		// Only re-center the gyroscope if explicitly requested
		if (resetGyro === true) {
			gyroBasis = null;
		}
	}

	export function reset() {
		if (el) {
			const player = el as any;
			player.alg = alg || '';
			jumpToStart();
			resetView();
			// Recolor after reset completes to ensure scene is stable
			setTimeout(() => {
				applyEOColorIfNeeded();
			}, 50);
		}
		movesAdded = '';
		rawMovesAdded = '';
	}

	function toggleVisibility() {
		hidePlayer = !hidePlayer;
	}

	// Register the custom element only on the client (avoids SSR issues)
	let animationFrameId: number | null = null;
	let gyroBasis: THREE.Quaternion | null = null;
	const HOME_ORIENTATION = new THREE.Quaternion();

	onMount(async () => {
		await import('cubing/twisty');

		const animateOrientation = async () => {
			if (el) {
				const player = el as any;
				const gyroscopeEnabled =
					enableGyroOverride ?? sessionState.activeSession?.settings.gyroEnabled ?? false;

				if (gyroscopeEnabled && bluetoothState.gyroSupported) {
					try {
						const puzzleObject = await player.experimentalCurrentThreeJSPuzzleObject();
						const vantages = await player.experimentalCurrentVantages();
						const vantage = [...vantages][0] as any;

						if (puzzleObject && vantage) {
							const rawQuat = bluetoothState.rawQuaternion;
							if (rawQuat) {
								const rawQuaternion = new THREE.Quaternion(
									rawQuat.x,
									rawQuat.z,
									-rawQuat.y,
									rawQuat.w
								).normalize();

								if (!gyroBasis) {
									gyroBasis = rawQuaternion.clone().conjugate();
								}

								const displayQuaternion = rawQuaternion
									.clone()
									.premultiply(gyroBasis)
									.premultiply(HOME_ORIENTATION);

								puzzleObject.quaternion.slerp(displayQuaternion, 0.25);
								if (vantage.render) vantage.render();
							}
						}
					} catch (e) {
						// ignore if twisty scene not initialized
					}
					animationFrameId = requestAnimationFrame(animateOrientation);
				} else {
					gyroBasis = null;
					// reset orientation smoothly back to normal
					let needsMoreSlerp = false;
					try {
						const puzzleObject = await player.experimentalCurrentThreeJSPuzzleObject();
						if (puzzleObject && puzzleObject.quaternion.angleTo(HOME_ORIENTATION) > 0.01) {
							puzzleObject.quaternion.slerp(HOME_ORIENTATION, 0.1);
							const vantages = await player.experimentalCurrentVantages();
							const vantage = [...vantages][0] as any;
							if (vantage?.render) vantage.render();
							needsMoreSlerp = true;
						} else if (puzzleObject && puzzleObject.quaternion.angleTo(HOME_ORIENTATION) > 0) {
							// Snap to exactly 0 to avoid tiny floating point errors keeping it alive forever
							puzzleObject.quaternion.copy(HOME_ORIENTATION);
							const vantages = await player.experimentalCurrentVantages();
							const vantage = [...vantages][0] as any;
							if (vantage?.render) vantage.render();
						}
					} catch (e) {}

					// Throttle when idle to drastically reduce GC pressure and memory usage
					if (needsMoreSlerp) {
						animationFrameId = requestAnimationFrame(animateOrientation);
					} else {
						// Poll much slower when idle
						setTimeout(() => {
							if (el) animationFrameId = requestAnimationFrame(animateOrientation);
						}, 200);
					}
				}
			}
		};

		animationFrameId = requestAnimationFrame(animateOrientation);

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
								isCameraRotated = !isAtDefaultPosition;
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
	// If move is empty string, only rawMove is tracked (for F2L checking without display)
	// If rawMove is empty string, only display is updated (for synthetic moves like rotations)
	export async function addMove(move: string, rawMove?: string) {
		if (el) {
			const player = el as any;
			if (player.experimentalAddMove) {
				// Only add to TwistyPlayer display if move is not empty
				if (move !== '') {
					player.experimentalAddMove(move);
					movesAdded += (movesAdded ? ' ' : '') + move;
				}

				// Track raw move separately for F2L checking
				// If rawMove is undefined, default to move; if rawMove is empty string, skip adding
				if (rawMove !== '') {
					const actualRawMove = rawMove ?? move;
					if (actualRawMove !== '') {
						rawMovesAdded += (rawMovesAdded ? ' ' : '') + actualRawMove;
					}
				}

				if (enableF2LCheck && kpuzzle && staticData) {
					// Use raw moves directly for F2L checking - they're already in absolute frame
					await checkF2LState(
						{ kpuzzle },
						scramble,
						rawMovesAdded,
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
		if (el) {
			const player = el as any;
			if (player._customMysteryMaterial) {
				player._customMysteryMaterial.dispose();
				player._customMysteryMaterial = null;
			}
			if (player._activeRecolorFrameId !== undefined && player._activeRecolorFrameId !== null) {
				cancelAnimationFrame(player._activeRecolorFrameId);
				player._activeRecolorFrameId = null;
			}
		}

		if (cleanupClickHandlers) {
			cleanupClickHandlers();
		}
		if (animationFrameId !== null) {
			cancelAnimationFrame(animationFrameId);
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
		style:width="100%"
		style:height="100%"
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
		<Button
			color={'none' as any}
			type="button"
			onclick={toggleVisibility}
			class="hover:bg-opacity-90 absolute top-1 left-1 z-20 rounded-full p-2 text-primary-600 transition-all duration-200 focus:ring-0"
			title={hidePlayer ? 'Show Cube' : 'Hide Cube'}
			aria-label={hidePlayer ? 'Show Cube' : 'Hide Cube'}
		>
			{#if hidePlayer}
				<Eye class="size-6" strokeWidth={3} />
			{:else}
				<EyeOff class="size-6" strokeWidth={3} />
			{/if}
		</Button>
		<Tooltip placement="right">{hidePlayer ? 'Show Cube' : 'Hide Cube'}</Tooltip>
	{/if}

	{#if showResetButton && !hidePlayer}
		<Button
			color={'none' as any}
			type="button"
			onclick={() => resetView(true)}
			class="hover:bg-opacity-90 absolute {controlPanel === 'bottom-row'
				? 'bottom-16'
				: 'bottom-1'} right-1 rounded-full p-2 text-primary-600 transition-all duration-200 focus:ring-0 focus:outline-none"
			aria-label="Reset camera view"
		>
			<RotateCw class="size-6" strokeWidth={3} />
		</Button>
		<Tooltip placement="left"
			>{gyroActive && bluetoothState.isConnected ? 'Reset Gyro' : 'Reset View'}</Tooltip
		>
	{/if}
</div>

<!-- style="width: 145px; height: 160px" -->
