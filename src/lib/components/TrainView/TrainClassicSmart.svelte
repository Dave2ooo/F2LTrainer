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
	import { ArrowLeft, ArrowRight, Pointer } from '@lucide/svelte';
	import Details from './Details.svelte';
	import TrainStateSelect from './TrainStateSelect.svelte';
	import Timer from './Timer.svelte';
	import { createKeyboardHandlers } from './trainViewEventHandlers.svelte';
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
		getSliceImplicitRotation
	} from '$lib/utils/moveValidator';

	let editAlgRef = $state<EditAlg>();
	let timerRef = $state<Timer>();

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

	let lastProcessedMoveCounter = -1;

	$effect(() => {
		// Depend on moveCounter to trigger updates
		const currentCounter = bluetoothState.moveCounter;

		if (currentCounter > lastProcessedMoveCounter) {
			const missedMoves = bluetoothState.getMovesSince(lastProcessedMoveCounter);
			lastProcessedMoveCounter = currentCounter;

			if (twistyPlayerRef) {
				missedMoves.forEach(({ move }) => {
					try {
						const m = move.trim();
						if (m) {
							// Add raw move to buffer for validation
							moveBuffer = [...moveBuffer, m];

							// Log every raw move from smart cube
							console.log(
								'%c[Smart Cube Move]',
								'color: #e91e63; font-weight: bold',
								m
							);

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
			});
		} else {
			untrack(() => {
				algMovesParsed = [];
				currentMoveIndex = 0;
				moveBuffer = [];
				validationFeedback = 'neutral';
				cumulativeRotation = '';
			});
		}
	});

	function validateMoveProgress() {
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
						const rotationsToUpdate = [implicitRot, cumulativeRotation].filter((r) => r !== '');
						cumulativeRotation = combineRotations(rotationsToUpdate);
						console.log('Cumulative rotation now:', cumulativeRotation);
					}
				}
			}

			currentMoveIndex += consumedCount;
			moveBuffer = [];
			setTimeout(() => {
				validationFeedback = 'neutral';
			}, 500);
		} else if (normalized.length > 6) {
			console.log('%c✗ Buffer overflow - likely wrong moves', 'color: #e74c3c; font-weight: bold');
			validationFeedback = 'incorrect';
		} else {
			console.log('Waiting for more moves...');
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
					displayAlg = algWithAUF;
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
		// Reset progress tracking
		moveBuffer = [];
		currentMoveIndex = 0;
		validationFeedback = 'neutral';
		cumulativeRotation = '';
	}

	async function onPrevious() {
		advanceToPreviousTrainCase();
		// Wait for next tick to ensure DOM is updated
		await tick();
		// Sync the move counter so we don't apply old moves to the new case
		lastProcessedMoveCounter = bluetoothState.moveCounter;
		// Reset progress tracking
		moveBuffer = [];
		currentMoveIndex = 0;
		validationFeedback = 'neutral';
		cumulativeRotation = '';
	}

	function handleTimerStop(timeInCentiseconds: number) {
		if (currentTrainCase) {
			const { groupId, caseId } = currentTrainCase;

			// Time is already in centiseconds (1/100s), no conversion needed
			// This eliminates all floating-point precision issues

			// Check if this case already has a solve ID (i.e., user is correcting a previous time)
			if (currentTrainCase.solveId !== undefined) {
				// Update existing solve
				statisticsState.updateSolve(currentTrainCase.solveId, timeInCentiseconds);

				// Update the time in the TrainCase
				currentTrainCase.time = timeInCentiseconds;
				// Update the last displayed time
				trainState.lastDisplayedTime = timeInCentiseconds;
			} else {
				// This is a new solve - get the next solve ID
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
		onNext();
	}

	// Create keyboard event handlers
	const { handleKeydown, handleKeyup } = createKeyboardHandlers(
		() => timerRef,
		onNext,
		handleTimerStop
	);

	let settingsRef = $state<Settings>();
</script>

<svelte:window onkeydown={handleKeydown} onkeyup={handleKeyup} />

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
					onF2LSolved={onNext}
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
			onEditAlg={() => {
				editAlgRef?.openModal();
			}}
		/>
		{#if globalState.trainShowTimer}
			<Timer bind:this={timerRef} onStop={handleTimerStop} initialTime={displayTime} />
		{/if}

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
