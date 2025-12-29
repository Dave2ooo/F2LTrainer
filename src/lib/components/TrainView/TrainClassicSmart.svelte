<script lang="ts">
	import { Button, P } from 'flowbite-svelte';
	import TwistyPlayer from '../TwistyPlayer.svelte';
	import {
		advanceToNextTrainCase,
		advanceToPreviousTrainCase,
		getNumberOfSelectedCases,
		trainState
	} from '$lib/trainCaseQueue.svelte';
	import { tick, untrack } from 'svelte';
	import { casesState, getCaseAlg, getCaseScramble } from '$lib/casesState.svelte';
	import { statisticsState } from '$lib/statisticsState.svelte';
	import { sessionState } from '$lib/sessionState.svelte';
	import Settings from '$lib/components/Modals/Settings.svelte';
	import EditAlg from '$lib/components/Modals/EditAlgModal.svelte';
	import { casesStatic } from '$lib/casesStatic';
	import { concatinateAuf } from '$lib/utils/addAuf';
	import HintButtonSmart from './HintButtonSmart.svelte';
	import { globalState } from '$lib/globalState.svelte';
	import { ArrowLeft, ArrowRight, Pointer, Check, RotateCcw } from '@lucide/svelte';
	import Details from './Details.svelte';
	import TrainStateSelect from './TrainStateSelect.svelte';
	import SmartTimer from './SmartTimer.svelte';
	import ResponsiveLayout from './ResponsiveLayout.svelte';
	import { bluetoothState } from '$lib/bluetooth/store.svelte';
	import {
		isRotationMove,
		matchesMoveSequence,
		normalizeMoves,
		applyRotationToMove,
		combineRotations,
		inverseRotation,
		isWideMove,
		wideToSingleLayerMove,
		getWideImplicitRotation,
		isSliceMove,
		getSliceImplicitRotation,
		getSliceFirstMoves,
		inverseMove
	} from '$lib/utils/moveValidator';
	import { fade } from 'svelte/transition';
	import { simplifyAlg } from '$lib/utils/simplifyAlg';

	let editAlgRef = $state<EditAlg>();
	let smartTimerRef = $state<SmartTimer>();
	let timerStarted = $state(false); // Track if timer has been started for current case

	let twistyPlayerRef = $state<any>();

	let scramble = $state('');

	let alg = $state('');

	// Separate display algorithm for HintButtonSmart (calculated with AUF)
	let displayAlg = $state('');

	// Algorithm progress tracking
	let algMovesParsed = $state<string[]>([]); // Full algorithm as array
	let currentMoveIndex = $state(0); // Index of next expected move
	let moveBuffer = $state<string[]>([]); // Recent moves from smart cube for validation
	let validationFeedback = $state<'correct' | 'incorrect' | 'neutral'>('neutral');
	let cumulativeRotation = $state(''); // Track cumulative rotations we've skipped
	let undoMoves = $state<string[]>([]); // Track undo moves needed to correct mistakes
	let isTransitioning = $state(false); // Track if we are in the success/transition state
	let showRotationWarning = $state(false); // Show "Rotate to Home" warning
	let caseHasRotation = $state(false); // Track if current case involved any rotation moves

	let lastProcessedMoveCounter = -1;

	$effect(() => {
		// Depend on moveCounter to trigger updates
		const currentCounter = bluetoothState.moveCounter;

		// If we are transitioning (showing success state), ignore inputs
		// but update the counter so they are "consumed" and not processed later
		if (isTransitioning) {
			lastProcessedMoveCounter = currentCounter;
			return;
		}

		if (currentCounter > lastProcessedMoveCounter) {
			const missedMoves = bluetoothState.getMovesSince(lastProcessedMoveCounter);
			lastProcessedMoveCounter = currentCounter;

			if (twistyPlayerRef) {
				// Clear rotation warning on any new move
				if (showRotationWarning) {
					showRotationWarning = false;
				}

				missedMoves.forEach(({ move }) => {
					try {
						const m = move.trim();
						if (m) {
							// Add raw move to buffer for validation
							moveBuffer = [...moveBuffer, m];

							// Log every raw move from smart cube
							console.log('%c[Smart Cube Move]', 'color: #e91e63; font-weight: bold', m);

							// Check if the next non-rotation expected move is a wide move
							// We need to look past rotations because they are auto-applied during validation
							// and the raw move from the smart cube might be consumed by a wide move after rotations
							let lookAheadIndex = currentMoveIndex;
							while (
								lookAheadIndex < algMovesParsed.length &&
								isRotationMove(algMovesParsed[lookAheadIndex])
							) {
								lookAheadIndex++;
							}
							const nextNonRotationMove = algMovesParsed[lookAheadIndex];
							const isNextWideMove = nextNonRotationMove && isWideMove(nextNonRotationMove);

							// Transform move for TwistyPlayer (algorithm frame)
							const inverseRot = inverseRotation(cumulativeRotation);
							const transformedMove = applyRotationToMove(m, inverseRot);

							// If next expected move is a wide move, we skip adding the display move
							// (wide move will be added during validation to avoid double-application)
							// BUT we still need to add the raw move for F2L checking!
							if (isNextWideMove) {
								// Add only the raw move for F2L checking, skip display
								twistyPlayerRef.addMove('', m);
							} else {
								// Normal move: add both display and raw
								twistyPlayerRef.addMove(transformedMove, m);
							}

							// Validate against algorithm
							validateMoveProgress();
						}
					} catch (e) {
						console.warn('Failed to apply move:', move, e);
					}
				});
			}
		}
	});

	// Parse algorithm and reset progress tracking when algorithm changes
	$effect(() => {
		if (displayAlg) {
			// Use untrack to prevent infinite loops when modifying reactive state
			untrack(() => {
				// Remove parentheses from algorithm before parsing
				const cleanAlg = displayAlg.replace(/[()]/g, '');
				algMovesParsed = cleanAlg.split(' ').filter((m) => m.trim() !== '');
				console.log(
					'%c[Algorithm Loaded]',
					'color: #9b59b6; font-weight: bold',
					algMovesParsed.join(' ')
				);
				currentMoveIndex = 0;
				moveBuffer = [];
				validationFeedback = 'neutral';
				cumulativeRotation = ''; // Reset cumulative rotation
				undoMoves = []; // Reset undo moves
				// Sync move counter to prevent old Bluetooth moves from being applied to new algorithm
				lastProcessedMoveCounter = bluetoothState.moveCounter;
			});
		} else {
			untrack(() => {
				algMovesParsed = [];
				currentMoveIndex = 0;
				moveBuffer = [];
				validationFeedback = 'neutral';
				cumulativeRotation = '';
				undoMoves = [];
				// Sync move counter to prevent old Bluetooth moves from being applied
				lastProcessedMoveCounter = bluetoothState.moveCounter;
			});
		}
	});

	function validateMoveProgress() {
		// Check if user is in undo mode (has pending undo moves)
		if (undoMoves.length > 0) {
			validateUndoProgress();
			return;
		}

		// Skip if algorithm is complete
		if (currentMoveIndex >= algMovesParsed.length) {
			validationFeedback = 'neutral';
			return;
		}

		console.group('%c[Validation]', 'color: #3498db; font-weight: bold');
		console.log('State:', {
			currentMoveIndex,
			buffer: [...moveBuffer],
			rotation: cumulativeRotation
		});
		console.log(
			'Expected:',
			algMovesParsed.slice(currentMoveIndex, currentMoveIndex + 3).join(' ')
		);

		// Check if there are pending rotations and apply them before validating
		if (twistyPlayerRef && isRotationMove(algMovesParsed[currentMoveIndex])) {
			// Collect all consecutive rotations
			const rotationsToApply: string[] = [];
			let rotationIndex = currentMoveIndex;
			while (
				rotationIndex < algMovesParsed.length &&
				isRotationMove(algMovesParsed[rotationIndex])
			) {
				rotationsToApply.push(algMovesParsed[rotationIndex]);
				rotationIndex++;
			}

			// Apply all rotations to TwistyPlayer
			console.log('%c→ Auto-applying rotations:', 'color: #e67e22', rotationsToApply.join(' '));
			for (const rotation of rotationsToApply) {
				// Pass empty string for rawMove to skip adding to rawMovesAdded (display only)
				twistyPlayerRef.addMove(rotation, '');
			}

			// Update cumulative rotation
			const allRotations = cumulativeRotation
				? [cumulativeRotation, ...rotationsToApply]
				: rotationsToApply;
			cumulativeRotation = combineRotations(allRotations);
			caseHasRotation = true;
			console.log('Cumulative rotation now:', cumulativeRotation);

			// Advance index past all rotations
			currentMoveIndex = rotationIndex;
		}

		// Check if next expected move is a wide move
		if (currentMoveIndex < algMovesParsed.length && isWideMove(algMovesParsed[currentMoveIndex])) {
			const wideMove = algMovesParsed[currentMoveIndex];
			const singleLayerMove = wideToSingleLayerMove(wideMove);
			const implicitRotation = getWideImplicitRotation(wideMove);

			console.log(
				'%c→ Wide move expected:',
				'color: #9b59b6',
				wideMove,
				'→ looking for',
				singleLayerMove
			);

			if (singleLayerMove) {
				// Transform buffer and check for single-layer move match
				const inverseRot = inverseRotation(cumulativeRotation);
				const transformedBuffer = moveBuffer.map((move) => applyRotationToMove(move, inverseRot));
				const normalized = normalizeMoves(transformedBuffer);

				// Try to match against the single-layer equivalent
				const { match, consumedCount } = matchesMoveSequence(normalized, [singleLayerMove]);

				if (match && consumedCount > 0) {
					console.log('%c✓ Wide move matched!', 'color: #27ae60; font-weight: bold');
					console.groupEnd();

					// Apply wide move to TwistyPlayer (display only, skip rawMovesAdded)
					twistyPlayerRef.addMove(wideMove, '');

					// Track the implicit rotation internally for transforming subsequent moves
					// IMPORTANT: Prepend the rotation (not append) because wide moves cause a physical
					// reorientation of the cube in the user's hands. This is the same as slice moves.
					// The rotation happens in the absolute frame, so it needs to be undone first.
					// Also flag that a rotation occurred for post-case warning
					caseHasRotation = true;

					const rotationsToUpdate = [implicitRotation, cumulativeRotation].filter((r) => r !== '');
					cumulativeRotation = combineRotations(rotationsToUpdate);

					// Advance past the wide move
					currentMoveIndex++;
					moveBuffer = [];
					validationFeedback = 'correct';

					setTimeout(() => {
						validationFeedback = 'neutral';
					}, 500);
					return;
				}
			}
		}

		// Get expected moves (lookahead window)
		const expectedMoves = algMovesParsed.slice(currentMoveIndex, currentMoveIndex + 5);

		// Apply INVERSE rotation to move buffer (transform from absolute to rotated frame)
		const inverseRot = inverseRotation(cumulativeRotation);
		const transformedBuffer = moveBuffer.map((move) => applyRotationToMove(move, inverseRot));
		const normalized = normalizeMoves(transformedBuffer);

		console.log(
			'Buffer:',
			moveBuffer.join(' '),
			'→ transformed:',
			transformedBuffer.join(' '),
			'→ normalized:',
			normalized.join(' ')
		);

		// Check for match
		const { match, consumedCount } = matchesMoveSequence(normalized, expectedMoves);

		if (match && consumedCount > 0) {
			console.log('%c✓ Match! Advancing by', 'color: #27ae60; font-weight: bold', consumedCount);
			validationFeedback = 'correct';

			// Check for implicit rotations in the matched moves (e.g. from slice moves)
			// When users do slice moves (S, M, E) on a smart cube, they typically grip the cube
			// in a way that causes a physical reorientation. We need to track this so subsequent
			// moves are correctly interpreted from the user's perspective.
			const matchedMoves = algMovesParsed.slice(currentMoveIndex, currentMoveIndex + consumedCount);
			for (const matchedMove of matchedMoves) {
				if (isSliceMove(matchedMove)) {
					const implicitRot = getSliceImplicitRotation(matchedMove);
					if (implicitRot) {
						console.log('Slice move', matchedMove, '→ applying rotation', implicitRot);
						// Add to TwistyPlayer for visual display (skip rawMovesAdded)
						twistyPlayerRef.addMove(implicitRot, '');
						// Add to cumulativeRotation to account for user's physical grip change
						// IMPORTANT: Prepend the slice rotation (not append) because the user's physical
						// grip change happens in the absolute frame. When transforming absolute → algorithm,
						// we need to undo the slice rotation first, then undo the algorithm rotation.
						// Also flag that a rotation occurred for post-case warning
						caseHasRotation = true;

						const rotationsToUpdate = [implicitRot, cumulativeRotation].filter((r) => r !== '');
						cumulativeRotation = combineRotations(rotationsToUpdate);
						console.log('Cumulative rotation now:', cumulativeRotation);
					}
				}
			}

			currentMoveIndex += consumedCount;
			moveBuffer = [];

			// Start timer on first validated move
			if (!timerStarted && currentMoveIndex > 0) {
				smartTimerRef?.startTimer();
				timerStarted = true;
			}

			setTimeout(() => {
				validationFeedback = 'neutral';
			}, 500);
		} else if (normalized.length >= 1) {
			// Before triggering undo, check if we might be waiting for a double move or slice move
			// Smart cubes send U2 as "U U" or "U' U'" - we need to wait for the second move
			// Slice moves like S require two face moves (F' B or B F')
			const expectedMove = expectedMoves[0];
			const isExpectedDoubleMove = expectedMove && expectedMove.includes('2');
			const expectedBaseFace = expectedMove ? expectedMove.replace(/['2]/g, '') : '';

			// Check if buffer could be building toward a double move
			// This happens when:
			// 1. Expected move is a double move (like U2)
			// 2. Buffer has exactly one move on the same face (like U or U')
			const couldBeDoubleMove =
				isExpectedDoubleMove &&
				moveBuffer.length === 1 &&
				normalized.length === 1 &&
				normalized[0].replace(/['2]/g, '') === expectedBaseFace;

			// Check if buffer could be building toward a slice move
			// This happens when:
			// 1. Expected move is a slice move (S, M, E)
			// 2. Buffer has exactly one move that matches the first part of the slice
			let couldBeSliceMove = false;
			if (isSliceMove(expectedMove) && moveBuffer.length === 1 && normalized.length === 1) {
				const validFirstMoves = getSliceFirstMoves(expectedMove);
				couldBeSliceMove = validFirstMoves.includes(normalized[0]);
			}

			if (couldBeDoubleMove) {
				console.log("Waiting for potential double move (U2 = U U or U' U')...");
			} else if (couldBeSliceMove) {
				console.log("Waiting for potential slice move (e.g. S = F' B or B F')...");
			} else {
				// If we have 1+ normalized moves and no match found, it's a wrong move
				// Show undo guidance immediately
				console.log(
					'%c✗ Wrong move detected - no match found',
					'color: #e74c3c; font-weight: bold'
				);
				validationFeedback = 'incorrect';
				// Add undo moves for all wrong moves in buffer
				addUndoMovesFromBuffer();
			}
		} else {
			console.log('Waiting for more moves...');
		}

		console.groupEnd();
	}

	/**
	 * Add undo moves for all moves in the buffer
	 * Called when wrong moves are detected
	 */
	function addUndoMovesFromBuffer() {
		const inverseRot = inverseRotation(cumulativeRotation);

		// Generate undo moves for each move in the buffer (in reverse order)
		const newUndoMoves: string[] = [];
		for (let i = moveBuffer.length - 1; i >= 0; i--) {
			const rawMove = moveBuffer[i];
			const inverseRaw = inverseMove(rawMove);
			const undoInAlgFrame = applyRotationToMove(inverseRaw, inverseRot);
			newUndoMoves.push(undoInAlgFrame);
		}

		console.log(
			'%c[Undo Guidance]',
			'color: #f39c12; font-weight: bold',
			'Adding undo moves:',
			newUndoMoves.join(' ')
		);

		undoMoves = [...undoMoves, ...newUndoMoves];
		moveBuffer = []; // Clear the buffer after generating undo moves
	}

	/**
	 * Validate incoming moves against expected undo moves
	 * Called when user is in undo mode
	 */
	function validateUndoProgress() {
		if (moveBuffer.length === 0) return;

		console.group('%c[Undo Validation]', 'color: #f39c12; font-weight: bold');
		console.log('Undo moves remaining:', undoMoves.join(' '));
		console.log('Buffer:', moveBuffer.join(' '));

		const inverseRot = inverseRotation(cumulativeRotation);

		// Check each move in buffer against expected undo moves
		for (const rawMove of moveBuffer) {
			if (undoMoves.length === 0) break;

			// Transform incoming move to algorithm frame
			const incomingInAlgFrame = applyRotationToMove(rawMove, inverseRot);
			const expectedUndo = undoMoves[0];

			console.log('Checking:', rawMove, '→', incomingInAlgFrame, 'vs expected:', expectedUndo);

			if (incomingInAlgFrame === expectedUndo) {
				console.log('%c✓ Undo move matched!', 'color: #27ae60; font-weight: bold');
				undoMoves = undoMoves.slice(1); // Remove first undo move
				validationFeedback = 'correct';
				setTimeout(() => {
					validationFeedback = 'neutral';
				}, 300);
			} else {
				// Wrong undo move - add another undo move for this mistake
				console.log('%c✗ Wrong undo move!', 'color: #e74c3c; font-weight: bold');
				const inverseRaw = inverseMove(rawMove);
				const undoInAlgFrame = applyRotationToMove(inverseRaw, inverseRot);
				undoMoves = [undoInAlgFrame, ...undoMoves];
				validationFeedback = 'incorrect';
			}
		}

		moveBuffer = []; // Clear buffer after processing

		if (undoMoves.length === 0) {
			console.log('%c✓ All undo moves completed!', 'color: #27ae60; font-weight: bold');
			validationFeedback = 'correct';
			setTimeout(() => {
				validationFeedback = 'neutral';
			}, 500);
		}

		console.groupEnd();
	}

	// local reactive mirror of the global state.current
	let currentTrainCase = $derived(trainState.current);

	// Compute the time to display: use case time if available, otherwise keep last displayed time
	// Note: currentTrainCase.time can be null (untimed) or undefined (new case)
	// We only want to fallback to lastDisplayedTime if it is undefined.
	// If it is null, we want to pass null to the timer so it shows 00.00
	let displayTime = $derived(
		currentTrainCase?.time !== undefined ? currentTrainCase.time : trainState.lastDisplayedTime
	);

	let currentAlgorithmSelection = $derived(
		currentTrainCase
			? casesState[currentTrainCase.groupId][currentTrainCase.caseId].algorithmSelection
			: undefined
	);

	// Calculate the display algorithm with AUF for HintButtonSmart
	$effect(() => {
		if (currentTrainCase) {
			const { groupId, caseId, auf, side, scramble: scrambleSelection } = currentTrainCase;
			const staticData = casesStatic[groupId]?.[caseId];

			if (staticData) {
				const caseState = casesState[groupId]?.[caseId];

				// Get the algorithm without AUF
				const algWithoutAUF = getCaseAlg(
					staticData,
					currentAlgorithmSelection ?? caseState?.algorithmSelection ?? { left: 0, right: 0 },
					caseState?.customAlgorithm ?? { left: '', right: '' },
					side
				);

				// Get the scramble without AUF
				const scrambleWithoutAUF = getCaseScramble(staticData, side, scrambleSelection);

				// Add AUF to the algorithm
				if (algWithoutAUF && scrambleWithoutAUF && auf !== undefined) {
					const [, algWithAUF] = concatinateAuf(scrambleWithoutAUF, algWithoutAUF, auf);
					displayAlg = simplifyAlg(algWithAUF);
				} else {
					displayAlg = '';
				}
			} else {
				displayAlg = '';
			}
		} else {
			displayAlg = '';
		}
	});

	function markAsSolved(force: boolean = false) {
		if (currentTrainCase) {
			if (force || !currentTrainCase.solved) {
				currentTrainCase.solved = true;
			}
		}
	}

	async function onNext() {
		if (currentTrainCase) {
			const { groupId, caseId } = currentTrainCase;

			// If no solve has been recorded for this case instance yet, record an untimed solve
			if (currentTrainCase.solveId === undefined) {
				const solveId = statisticsState.getNextSolveId();

				// Add new untimed solve
				statisticsState.addSolve({
					id: solveId,
					groupId,
					caseId,
					time: null,
					timestamp: Date.now(),
					auf: currentTrainCase.auf,
					side: currentTrainCase.side,
					scrambleSelection: currentTrainCase.scramble,
					sessionId: sessionState.activeSessionId || undefined
				});

				// Update the TrainCase with the solve ID so we don't record it again
				currentTrainCase.solveId = solveId;
			}
		}

		markAsSolved();
		advanceToNextTrainCase();
		// Wait for next tick to ensure DOM is updated
		await tick();
		// Sync the move counter so we don't apply old moves to the new case
		lastProcessedMoveCounter = bluetoothState.moveCounter;

		// Show rotation warning if the previous case involved rotations
		if (caseHasRotation) {
			showRotationWarning = true;
			// Auto-dismiss after 1.5 seconds (slightly longer to be readable, fade handles smoothness)
			setTimeout(() => {
				showRotationWarning = false;
			}, 1500);
		} else {
			showRotationWarning = false;
		}

		// Reset progress tracking
		moveBuffer = [];
		currentMoveIndex = 0;
		validationFeedback = 'neutral';
		cumulativeRotation = '';
		caseHasRotation = false;
		undoMoves = [];
		isTransitioning = false;
		// Reset timer for new case
		smartTimerRef?.resetTimer();
		timerStarted = false;
	}

	async function onPrevious() {
		advanceToPreviousTrainCase();
		// Wait for next tick to ensure DOM is updated
		await tick();
		// Sync the move counter so we don't apply old moves to the new case
		// Sync the move counter so we don't apply old moves to the new case
		lastProcessedMoveCounter = bluetoothState.moveCounter;

		// Reset progress tracking
		moveBuffer = [];
		currentMoveIndex = 0;
		validationFeedback = 'neutral';
		cumulativeRotation = '';
		caseHasRotation = false;
		showRotationWarning = false;
		undoMoves = [];
		isTransitioning = false;
		// Reset timer for new case
		smartTimerRef?.resetTimer();
		timerStarted = false;
	}

	/**
	 * Record the solve time and save to statistics
	 * Called when F2L is solved (timer stopped automatically)
	 */
	function recordSolveTime(timeInCentiseconds: number) {
		if (currentTrainCase) {
			const { groupId, caseId } = currentTrainCase;

			// Get next solve ID
			const solveId = statisticsState.getNextSolveId();
			// Save time and solve ID to the TrainCase
			currentTrainCase.time = timeInCentiseconds;
			currentTrainCase.solveId = solveId;
			// Update the last displayed time
			trainState.lastDisplayedTime = timeInCentiseconds;

			// Add new solve
			statisticsState.addSolve({
				id: solveId,
				groupId,
				caseId,
				time: timeInCentiseconds,
				timestamp: Date.now(),
				auf: currentTrainCase.auf,
				side: currentTrainCase.side,
				scrambleSelection: currentTrainCase.scramble,
				sessionId: sessionState.activeSessionId || undefined
			});

			// Mark as solved
			markAsSolved(true);
		}
	}

	let settingsRef = $state<Settings>();
</script>

<ResponsiveLayout>
	{#snippet leftContent()}
		<div class="my-2 flex items-center justify-center gap-0 sm:gap-2 md:my-4 md:gap-4">
			<Button
				class="bg-transparent p-1 hover:bg-transparent dark:bg-transparent dark:hover:bg-transparent"
				type="button"
				onclick={onPrevious}><ArrowLeft class="size-8 text-primary-600 md:size-12" /></Button
			>
			<div class="min-w-48 text-center font-mono text-2xl font-semibold md:text-3xl">
				{scramble}
			</div>
			<Button
				class="bg-transparent p-1 hover:bg-transparent dark:bg-transparent dark:hover:bg-transparent"
				type="button"
				onclick={onNext}><ArrowRight class="size-8 text-primary-600 md:size-12" /></Button
			>
		</div>

		<div
			class="relative mx-auto size-60 md:size-80"
			onpointerdowncapture={() => {
				globalState.hasUsedTwistyPlayer = true;
			}}
		>
			{#if isTransitioning}
				<div
					class="absolute inset-0 z-50 flex animate-pulse items-center justify-center rounded-xl bg-green-500/20 backdrop-blur-[1px] transition-all duration-300"
				>
					<Check size={80} class="text-green-600 drop-shadow-lg dark:text-green-400" />
				</div>
			{/if}

			{#if showRotationWarning && !isTransitioning}
				<div
					transition:fade={{ duration: 300 }}
					class="absolute inset-0 z-50 flex flex-col items-center justify-center gap-2 rounded-xl bg-yellow-500/20 backdrop-blur-[1px]"
				>
					<RotateCcw size={60} class="text-yellow-600 drop-shadow-lg dark:text-yellow-400" />
					<div
						class="text-center text-3xl font-bold text-yellow-600 drop-shadow-sm dark:text-yellow-400"
					>
						Rotate to<br />Home Position
					</div>
				</div>
			{/if}

			{#if currentTrainCase}
				<TwistyPlayer
					bind:this={twistyPlayerRef}
					bind:scramble
					bind:movesAdded={alg}
					groupId={currentTrainCase.groupId}
					caseId={currentTrainCase.caseId}
					algorithmSelection={currentAlgorithmSelection}
					auf={currentTrainCase.auf}
					side={currentTrainCase.side}
					crossColor={currentTrainCase.crossColor}
					frontColor={currentTrainCase.frontColor}
					scrambleSelection={currentTrainCase.scramble}
					stickering={globalState.trainHintStickering}
					backView={sessionState.activeSession?.settings.backView || 'none'}
					backViewEnabled={sessionState.activeSession?.settings.backViewEnabled || false}
					experimentalDragInput="auto"
					class="size-full"
					controlPanel="bottom-row"
					onclick={onNext}
					showVisibilityToggle={false}
					tempoScale={5}
					showAlg={false}
					onF2LSolved={() => {
						// Prevent double triggering
						if (isTransitioning) return;

						// Only trigger onNext if moves have actually been applied AND validated
						// This prevents false triggers during algorithm changes
						// Both conditions must be true:
						// 1. alg has content (moves have been added to TwistyPlayer)
						// 2. currentMoveIndex > 0 (at least one move has been validated against algorithm)
						const shouldTrigger = alg && alg.trim() !== '' && currentMoveIndex > 0;
						if (shouldTrigger) {
							isTransitioning = true;

							// Stop timer and record time
							const elapsedTime = smartTimerRef?.stopTimer();
							if (elapsedTime !== undefined) {
								recordSolveTime(elapsedTime);
							}

							setTimeout(() => {
								onNext();
							}, 500); // 500ms delay for visual feedback
						}
					}}
				/>
				{#if !globalState.hasUsedTwistyPlayer}
					<Pointer
						class="pointer-events-none absolute top-1/2 left-1/2 z-50 size-15 -translate-x-1/2 -translate-y-1/2 animate-bounce text-primary-600"
					/>
				{/if}
			{:else}
				<div class="flex h-60 items-center justify-center">
					<P>Loading case...</P>
				</div>
			{/if}
		</div>

		<HintButtonSmart
			alg={displayAlg}
			movesAdded={alg}
			{currentMoveIndex}
			{validationFeedback}
			{undoMoves}
			editDisabled={currentMoveIndex > 0 || alg.trim() !== ''}
			onEditAlg={() => {
				editAlgRef?.openModal();
			}}
		/>
		<div class:hidden={!globalState.trainShowTimer}>
			<SmartTimer bind:this={smartTimerRef} initialTime={displayTime} />
		</div>

		<div class="flex flex-row justify-center gap-2">
			<TrainStateSelect />

			<Button onclick={() => settingsRef?.openModal()}
				>{getNumberOfSelectedCases()} cases selected</Button
			>
		</div>

		<Details />

		<Settings bind:this={settingsRef} />

		{#if currentTrainCase}
			<EditAlg
				bind:this={editAlgRef}
				groupId={currentTrainCase.groupId}
				caseId={currentTrainCase.caseId}
				side={currentTrainCase.side}
			/>
		{/if}
	{/snippet}
</ResponsiveLayout>
