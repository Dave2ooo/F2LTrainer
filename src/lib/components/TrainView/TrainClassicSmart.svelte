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
		inverseRotation
	} from '$lib/utils/moveValidator';

	let editAlgRef = $state<EditAlg>();
	let timerRef = $state<Timer>();

	let twistyPlayerRef = $state<any>();

	let scramble = $state('');

	let alg = $state('');

	// Separate display algorithm for HintButtonSmart (calculated with AUF)
	let displayAlg = $state('');

	// Transformed moves for display (accounting for rotations)
	let transformedMovesForDisplay = $derived.by(() => {
		if (!alg || !cumulativeRotation) return alg;
		// Apply INVERSE rotation to transform from absolute (smart cube) to rotated (algorithm) frame
		const inverseRot = inverseRotation(cumulativeRotation);
		const moves = alg.split(' ').filter((m) => m.trim() !== '');
		const transformed = moves.map((move) => applyRotationToMove(move, inverseRot));
		return transformed.join(' ');
	});

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
							// Transform move for TwistyPlayer (algorithm frame)
							const inverseRot = inverseRotation(cumulativeRotation);
							const transformedMove = applyRotationToMove(m, inverseRot);

							// Send transformed move for display, raw move for F2L checking
							twistyPlayerRef.addMove(transformedMove, m);

							// Add raw move to buffer for validation
							moveBuffer = [...moveBuffer, m];

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
				console.log('[Parsing] displayAlg:', displayAlg, 'cleanAlg:', cleanAlg);
				algMovesParsed = cleanAlg.split(' ').filter((m) => m.trim() !== '');
				console.log('[Parsing] algMovesParsed:', algMovesParsed);
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

	// Auto-apply rotation moves to TwistyPlayer when they're next
	$effect(() => {
		// Track these dependencies explicitly
		const playerRef = twistyPlayerRef;
		const moves = algMovesParsed;
		const index = currentMoveIndex;

		console.log('[Auto-Rotation Check]', {
			hasPlayer: !!playerRef,
			movesLength: moves.length,
			currentIndex: index,
			currentMove: moves[index],
			isRotation: moves[index] ? isRotationMove(moves[index]) : false
		});

		// Check if current move is a rotation and auto-apply it
		if (playerRef && moves.length > 0 && index < moves.length && isRotationMove(moves[index])) {
			// Use setTimeout to allow TwistyPlayer to update to new case first
			setTimeout(() => {
				untrack(() => {
					const rotation = moves[index];
					console.log('[Auto-Rotation] Applying rotation:', rotation);

					// Apply rotation to TwistyPlayer
					try {
						playerRef.addMove(rotation);
						console.log('[Auto-Rotation] Successfully applied:', rotation);
					} catch (e) {
						console.error('[Auto-Rotation] Failed to apply:', rotation, e);
					}

					// Collect rotation for cumulative tracking
					const newRotations = cumulativeRotation ? [cumulativeRotation, rotation] : [rotation];
					cumulativeRotation = combineRotations(newRotations);

					// Advance index past this rotation
					currentMoveIndex++;

					// Provide brief visual feedback
					validationFeedback = 'correct';
					setTimeout(() => {
						validationFeedback = 'neutral';
					}, 300);
				});
			}, 150); // Small delay to allow TwistyPlayer to update
		}
	});

	function validateMoveProgress() {
		console.log('[Validation] Starting validation', {
			currentMoveIndex,
			algLength: algMovesParsed.length,
			moveBuffer,
			algMovesParsed
		});

		// Skip if algorithm is complete
		if (currentMoveIndex >= algMovesParsed.length) {
			console.log('[Validation] Algorithm complete, skipping validation');
			validationFeedback = 'neutral';
			return;
		}

		// Get expected moves (lookahead window)
		const expectedMoves = algMovesParsed.slice(currentMoveIndex, currentMoveIndex + 5);
		console.log('[Validation] Expected moves:', expectedMoves);

		// Apply INVERSE rotation to move buffer (transform from absolute to rotated frame)
		const inverseRot = inverseRotation(cumulativeRotation);
		const transformedBuffer = moveBuffer.map((move) => applyRotationToMove(move, inverseRot));
		console.log(
			'[Validation] Transformed buffer (with inverse rotation):',
			transformedBuffer,
			'from:',
			moveBuffer,
			'using inverse of:',
			cumulativeRotation,
			'which is:',
			inverseRot
		);

		// Normalize the TRANSFORMED move buffer
		const normalized = normalizeMoves(transformedBuffer);
		console.log('[Validation] Normalized buffer:', normalized);

		// Check for match
		const { match, consumedCount } = matchesMoveSequence(normalized, expectedMoves);
		console.log('[Validation] Match result:', { match, consumedCount });

		if (match && consumedCount > 0) {
			// Correct moves detected
			console.log('[Validation] ✓ Correct moves! Advancing by', consumedCount);
			validationFeedback = 'correct';
			currentMoveIndex += consumedCount;
			moveBuffer = []; // Clear buffer after successful match

			// Reset feedback after brief delay
			setTimeout(() => {
				validationFeedback = 'neutral';
			}, 500);
		} else if (normalized.length > 6) {
			// Too many moves without matching - likely off track
			console.log('[Validation] ✗ Incorrect - buffer too long without match');
			validationFeedback = 'incorrect';
		} else {
			console.log('[Validation] Waiting for more moves...');
		}
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
			movesAdded={transformedMovesForDisplay}
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
