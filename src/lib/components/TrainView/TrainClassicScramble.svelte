<script lang="ts">
	import { Button, ButtonGroup, P, Spinner } from 'flowbite-svelte';
	import TwistyPlayer from '../TwistyPlayer.svelte';
	import {
		advanceToNextTrainCase,
		getNumberOfSelectedCases,
		trainState
	} from '$lib/trainCaseQueue.svelte';
	import { tick, untrack, onDestroy } from 'svelte';
	import { casesState, getCaseAlg, getCaseScramble } from '$lib/casesState.svelte';
	import { sessionState, DEFAULT_SETTINGS } from '$lib/sessionState.svelte';
	import Settings from '$lib/components/Modals/Settings.svelte';
	import EditAlg from '$lib/components/Modals/EditAlgModal.svelte';
	import { casesStatic } from '$lib/casesStatic';
	import { concatinateAuf } from '$lib/utils/addAuf';
	import HintButtonSmart from './HintButtonSmart.svelte';
	import { globalState } from '$lib/globalState.svelte';
	import { Pointer, Check, RotateCcw, Bluetooth, EllipsisVertical, Undo2 } from '@lucide/svelte';
	import Details from './Details.svelte';
	import TrainStateSelect from './TrainStateSelect.svelte';
	import RecapProgress from './RecapProgress.svelte';
	import { bluetoothState } from '$lib/bluetooth/store.svelte';
	import { savedCubesState } from '$lib/bluetooth/savedCubes.svelte';
	import { connectNewCube, connectSavedCube } from '$lib/bluetooth/actions';
	import BluetoothModal from '$lib/components/Modals/BluetoothModal.svelte';
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

	type Phase = 'scrambling' | 'countdown' | 'solving' | 'executing' | 'transitioning';
	let phase = $state<Phase>('scrambling');

	let editAlgRef = $state<EditAlg>();
	let twistyPlayerRef = $state<any>();

	let displayScramble = $state('');
	let displayAlg = $state('');

	let algMovesParsed = $state<string[]>([]);
	let currentMoveIndex = $state(0);
	let moveBuffer = $state<string[]>([]);
	let validationFeedback = $state<'correct' | 'incorrect' | 'neutral'>('neutral');
	let cumulativeRotation = $state('');
	let undoMoves = $state<string[]>([]);
	let showRotationWarning = $state(false);
	let movesAdded = $state('');
	let caseHasRotation = $state(false);

	const SUBSCRIBER_ID = 'train-classic-scramble';
	const SUBSCRIBER_PRIORITY = 50;

	// Only subscribe when we have a train case
	$effect(() => {
		const hasTrainCase = !!trainState.current;
		if (hasTrainCase) {
			bluetoothState.subscribeToMoves(SUBSCRIBER_ID, handleSmartCubeMove, SUBSCRIBER_PRIORITY);
			return () => {
				bluetoothState.unsubscribeFromMoves(SUBSCRIBER_ID);
			};
		}
	});

	let currentTrainCase = $derived(trainState.current);
	let currentAlgorithmSelection = $derived(
		currentTrainCase
			? casesState[currentTrainCase.groupId][currentTrainCase.caseId].algorithmSelection
			: undefined
	);

	$effect(() => {
		if (currentTrainCase) {
			const { groupId, caseId, auf, side, scramble: scrambleSelection } = currentTrainCase;
			const staticData = casesStatic[groupId]?.[caseId];

			if (staticData) {
				const caseState = casesState[groupId]?.[caseId];
				const algWithoutAUF = getCaseAlg(
					staticData,
					currentAlgorithmSelection ?? caseState?.algorithmSelection ?? { left: 0, right: 0 },
					caseState?.customAlgorithm ?? { left: '', right: '' },
					side
				);
				const scrambleWithoutAUF = getCaseScramble(staticData, side, scrambleSelection);

				if (algWithoutAUF && scrambleWithoutAUF && auf !== undefined) {
					const [newScramble, newAlg] = concatinateAuf(scrambleWithoutAUF, algWithoutAUF, auf);
					displayScramble = simplifyAlg(newScramble);
					displayAlg = simplifyAlg(newAlg);
				} else {
					displayScramble = '';
					displayAlg = '';
				}
			}
		} else {
			displayScramble = '';
			displayAlg = '';
		}
	});

	$effect(() => {
		// When phase changes to scrambling or displayScramble changes
		if (phase === 'scrambling' && displayScramble) {
			untrack(() => {
				const cleanAlg = displayScramble.replace(/[()]/g, '');
				algMovesParsed = cleanAlg.split(' ').filter((m) => m.trim() !== '');
				currentMoveIndex = 0;
				moveBuffer = [];
				validationFeedback = 'neutral';
				cumulativeRotation = '';
				undoMoves = [];
				movesAdded = '';
			});
		} else if (phase !== 'scrambling') {
			untrack(() => {
				const cleanAlg = displayAlg.replace(/[()]/g, '');
				algMovesParsed = cleanAlg.split(' ').filter((m) => m.trim() !== '');
				currentMoveIndex = 0;
				moveBuffer = [];
				validationFeedback = 'neutral';
				cumulativeRotation = '';
				undoMoves = [];
				movesAdded = '';
			});
		}
	});

	function handleSmartCubeMove(move: string) {
		const m = move.trim();
		if (!m) return;

		if (phase === 'transitioning' || phase === 'countdown') return;

		if (!twistyPlayerRef) return;
		if (showRotationWarning) showRotationWarning = false;

		try {
			moveBuffer = [...moveBuffer, m];

			let lookAheadIndex = currentMoveIndex;
			while (lookAheadIndex < algMovesParsed.length && isRotationMove(algMovesParsed[lookAheadIndex])) {
				lookAheadIndex++;
			}
			const nextNonRotationMove = algMovesParsed[lookAheadIndex];
			const isNextWideMove = nextNonRotationMove && isWideMove(nextNonRotationMove);

			const inverseRot = inverseRotation(cumulativeRotation);
			const transformedMove = applyRotationToMove(m, inverseRot);

			if (isNextWideMove) {
				twistyPlayerRef.addMove('', m);
			} else {
				twistyPlayerRef.addMove(transformedMove, m);
				movesAdded += (movesAdded ? ' ' : '') + transformedMove;
			}

			validateMoveProgress();

		} catch (e) {
			console.warn('Failed to apply move:', m, e);
		}
	}

	function addUndoMovesFromBuffer() {
		const inverseRot = inverseRotation(cumulativeRotation);
		const newUndoMoves: string[] = [];
		for (let i = moveBuffer.length - 1; i >= 0; i--) {
			const rawMove = moveBuffer[i];
			const inverseRaw = inverseMove(rawMove);
			const undoInAlgFrame = applyRotationToMove(inverseRaw, inverseRot);
			newUndoMoves.push(undoInAlgFrame);
		}
		undoMoves = [...undoMoves, ...newUndoMoves];
		moveBuffer = [];
	}

	function validateUndoProgress() {
		if (moveBuffer.length === 0) return;
		const inverseRot = inverseRotation(cumulativeRotation);

		for (const rawMove of moveBuffer) {
			if (undoMoves.length === 0) break;
			const incomingInAlgFrame = applyRotationToMove(rawMove, inverseRot);
			const expectedUndo = undoMoves[0];

			if (incomingInAlgFrame === expectedUndo) {
				undoMoves = undoMoves.slice(1);
				validationFeedback = 'correct';
				setTimeout(() => { validationFeedback = 'neutral'; }, 300);
			} else {
				const inverseRaw = inverseMove(rawMove);
				const undoInAlgFrame = applyRotationToMove(inverseRaw, inverseRot);
				undoMoves = [undoInAlgFrame, ...undoMoves];
				validationFeedback = 'incorrect';
			}
		}
		moveBuffer = [];
		if (undoMoves.length === 0) {
			validationFeedback = 'correct';
			setTimeout(() => { validationFeedback = 'neutral'; }, 500);
		}
	}

	function validateMoveProgress() {
		if (undoMoves.length > 0) {
			validateUndoProgress();
			return;
		}

		if (currentMoveIndex >= algMovesParsed.length) {
			validationFeedback = 'neutral';
			return;
		}

		if (twistyPlayerRef && isRotationMove(algMovesParsed[currentMoveIndex])) {
			const rotationsToApply: string[] = [];
			let rotationIndex = currentMoveIndex;
			while (rotationIndex < algMovesParsed.length && isRotationMove(algMovesParsed[rotationIndex])) {
				rotationsToApply.push(algMovesParsed[rotationIndex]);
				rotationIndex++;
			}

			for (const rotation of rotationsToApply) {
				twistyPlayerRef.addMove(rotation, '');
			}

			const allRotations = cumulativeRotation ? [cumulativeRotation, ...rotationsToApply] : rotationsToApply;
			cumulativeRotation = combineRotations(allRotations);
			caseHasRotation = true;
			currentMoveIndex = rotationIndex;
		}

		if (currentMoveIndex < algMovesParsed.length && isWideMove(algMovesParsed[currentMoveIndex])) {
			const wideMove = algMovesParsed[currentMoveIndex];
			const singleLayerMove = wideToSingleLayerMove(wideMove);
			const implicitRotation = getWideImplicitRotation(wideMove);

			if (singleLayerMove) {
				const inverseRot = inverseRotation(cumulativeRotation);
				const transformedBuffer = moveBuffer.map((move) => applyRotationToMove(move, inverseRot));
				const normalized = normalizeMoves(transformedBuffer);
				const { match, consumedCount } = matchesMoveSequence(normalized, [singleLayerMove]);

				if (match && consumedCount > 0) {
					twistyPlayerRef.addMove(wideMove, '');
					caseHasRotation = true;
					const rotationsToUpdate = [implicitRotation, cumulativeRotation].filter((r) => r !== '');
					cumulativeRotation = combineRotations(rotationsToUpdate);
					currentMoveIndex++;
					moveBuffer = [];
					validationFeedback = 'correct';
					setTimeout(() => { validationFeedback = 'neutral'; }, 500);
					checkPhaseCompletion();
					return;
				}
			}
		}

		const expectedMoves = algMovesParsed.slice(currentMoveIndex, currentMoveIndex + 5);
		const inverseRot = inverseRotation(cumulativeRotation);
		const transformedBuffer = moveBuffer.map((move) => applyRotationToMove(move, inverseRot));
		const normalized = normalizeMoves(transformedBuffer);
		const { match, consumedCount } = matchesMoveSequence(normalized, expectedMoves);

		if (match && consumedCount > 0) {
			validationFeedback = 'correct';
			const matchedMoves = algMovesParsed.slice(currentMoveIndex, currentMoveIndex + consumedCount);
			for (const matchedMove of matchedMoves) {
				if (isSliceMove(matchedMove)) {
					const implicitRot = getSliceImplicitRotation(matchedMove);
					if (implicitRot) {
						twistyPlayerRef.addMove(implicitRot, '');
						caseHasRotation = true;
						const rotationsToUpdate = [implicitRot, cumulativeRotation].filter((r) => r !== '');
						cumulativeRotation = combineRotations(rotationsToUpdate);
					}
				}
			}

			currentMoveIndex += consumedCount;
			moveBuffer = [];
			setTimeout(() => { validationFeedback = 'neutral'; }, 500);
			checkPhaseCompletion();
		} else if (normalized.length >= 1) {
			const expectedMove = expectedMoves[0];
			const isExpectedDoubleMove = expectedMove && expectedMove.includes('2');
			const expectedBaseFace = expectedMove ? expectedMove.replace(/['2]/g, '') : '';
			const couldBeDoubleMove = isExpectedDoubleMove && moveBuffer.length === 1 && normalized.length === 1 && normalized[0].replace(/['2]/g, '') === expectedBaseFace;
			
			let couldBeSliceMove = false;
			if (isSliceMove(expectedMove) && moveBuffer.length === 1 && normalized.length === 1) {
				const validFirstMoves = getSliceFirstMoves(expectedMove);
				couldBeSliceMove = validFirstMoves.includes(normalized[0]);
			}

			if (!couldBeDoubleMove && !couldBeSliceMove) {
				validationFeedback = 'incorrect';
				addUndoMovesFromBuffer();
			}
		}
	}

	function checkPhaseCompletion() {
		if (currentMoveIndex >= algMovesParsed.length) {
			if (phase === 'scrambling') {
				console.log('Scramble finished! Advancing to countdown (TODO)');
				// Switch to solving for testing step 2
				phase = 'solving';
			}
		}
	}

	let settingsRef = $state<Settings>();
	let bluetoothModalOpen = $state(false);

	let latestSavedCube = $derived.by(() => {
		if (savedCubesState.cubes.length === 0) return null;
		return [...savedCubesState.cubes].sort((a, b) => b.lastConnected - a.lastConnected)[0];
	});

	let connectButtonLabel = $derived.by(() => {
		if (bluetoothState.isConnected) {
			const saved = bluetoothState.deviceId ? savedCubesState.getCube(bluetoothState.deviceId) : null;
			return saved?.customName || bluetoothState.deviceName || 'Connected';
		}
		if (latestSavedCube) return latestSavedCube.customName;
		return 'Connect Cube';
	});

	async function handleSmartConnect() {
		if (bluetoothState.isConnected) {
			bluetoothModalOpen = true;
			return;
		}
		if (latestSavedCube) {
			await connectSavedCube(latestSavedCube.id);
		} else {
			await connectNewCube();
		}
	}
	
	let completedMoves = $derived(algMovesParsed.slice(0, currentMoveIndex));
	let currentMoves = $derived(
		currentMoveIndex < algMovesParsed.length ? [algMovesParsed[currentMoveIndex]] : []
	);
	let futureMoves = $derived(
		currentMoveIndex < algMovesParsed.length ? algMovesParsed.slice(currentMoveIndex + 1) : []
	);

	// Tailwind classes for scramble guide
	const completedChipClass =
		'rounded bg-green-100 dark:bg-green-900 px-2 py-1 font-mono font-semibold text-green-700 dark:text-green-300 opacity-70';
	const currentChipClass =
		'rounded bg-blue-500 dark:bg-blue-600 px-2 py-1 font-mono font-semibold text-white animate-pulse shadow-lg';
	const futureChipVisible =
		'rounded bg-gray-100 dark:bg-gray-700 px-2 py-1 font-mono font-semibold text-gray-600 dark:text-gray-400';
	const undoChipClass =
		'rounded bg-amber-500 dark:bg-amber-600 px-2 py-1 font-mono font-semibold text-white shadow-md';

	const getContainerFeedbackClass = (feedback: 'correct' | 'incorrect' | 'neutral') => {
		if (feedback === 'correct') return 'border-green-500 bg-green-50 dark:bg-green-950/20';
		if (feedback === 'incorrect') return 'border-red-500 bg-red-50 dark:bg-red-950/20 animate-shake';
		return 'border-transparent';
	};

	async function onNext() {
		// Just for testing step 2 - advance immediately
		advanceToNextTrainCase();
		await tick();
		phase = 'scrambling';
		twistyPlayerRef?.reset();
		movesAdded = '';
	}
</script>

{#if bluetoothState.isConnected}
	<div class="my-2 flex items-center justify-center gap-0 sm:gap-2 md:my-4 md:gap-4"></div>

	<!-- Scramble guide (always visible in scramble phase) -->
	{#if phase === 'scrambling'}
		<div class="my-2 flex w-full flex-col items-center md:my-4">
			<div class="mb-2 text-center text-sm font-bold uppercase tracking-widest text-primary-600">
				Scramble
			</div>
			<div
				class="flex min-w-48 flex-wrap items-center justify-center gap-1 rounded-lg border-2 p-3 font-mono text-xl font-semibold transition-colors md:text-3xl {getContainerFeedbackClass(
					validationFeedback
				)}"
			>
				{#each completedMoves as move}
					<span class={completedChipClass}>{move}</span>
				{/each}

				{#if currentMoves.length > 0}
					{#each currentMoves as move}
						<span class={currentChipClass}>{move}</span>
					{/each}
				{/if}

				{#each futureMoves as move}
					<span class={futureChipVisible}>{move}</span>
				{/each}
			</div>

			{#if undoMoves.length > 0}
				<div
					class="mt-3 flex flex-col items-center gap-2 rounded-lg border-2 border-amber-400 bg-amber-50 p-3 dark:border-amber-600 dark:bg-amber-950/30"
				>
					<div class="flex items-center gap-2 text-amber-700 dark:text-amber-400">
						<Undo2 class="size-5" strokeWidth={2.5} />
						<span class="text-sm font-semibold tracking-wide uppercase">Undo Required</span>
					</div>
					<div class="flex flex-wrap items-center justify-center gap-1">
						{#each undoMoves as move}
							<span class={undoChipClass}>{move}</span>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	{/if}

	<div
		class="relative mx-auto size-50 md:size-60"
		onpointerdowncapture={() => {
			globalState.hasUsedTwistyPlayer = true;
		}}
	>
		{#if phase === 'transitioning'}
			<div
				class="absolute inset-0 z-50 flex animate-pulse items-center justify-center rounded-xl bg-green-500/20 backdrop-blur-[1px] transition-all duration-300"
			>
				<Check size={80} class="text-green-600 drop-shadow-lg dark:text-green-400" />
			</div>
		{/if}

		{#if showRotationWarning && phase !== 'transitioning'}
			<div
				transition:fade={{ duration: 300 }}
				class="absolute inset-0 z-50 flex flex-col items-center justify-center gap-2 rounded-xl bg-yellow-500/20 backdrop-blur-[1px]"
			>
				<RotateCcw size={60} class="text-yellow-600 drop-shadow-lg dark:text-yellow-400" />
				<div class="text-center text-3xl font-bold text-yellow-600 drop-shadow-sm dark:text-yellow-400">
					Rotate to<br />Home Position
				</div>
			</div>
		{/if}

		{#if currentTrainCase}
			<TwistyPlayer
				bind:this={twistyPlayerRef}
				groupId={currentTrainCase.groupId}
				caseId={currentTrainCase.caseId}
				algorithmSelection={currentAlgorithmSelection}
				auf={currentTrainCase.auf}
				side={currentTrainCase.side}
				crossColor={currentTrainCase.crossColor}
				frontColor={currentTrainCase.frontColor}
				enableEOColoring={sessionState.activeSession?.settings.trainLearnEO ?? DEFAULT_SETTINGS.trainLearnEO}
				scrambleSelection={currentTrainCase.scramble}
				stickering={sessionState.activeSession?.settings.trainHintStickering ?? DEFAULT_SETTINGS.trainHintStickering}
				backView={sessionState.activeSession?.settings.backView || 'none'}
				backViewEnabled={sessionState.activeSession?.settings.backViewEnabled || false}
				experimentalDragInput="auto"
				class="size-full"
				controlPanel="none"
				showVisibilityToggle={false}
				tempoScale={5}
				showAlg={false}
				disableAutoScramble={phase === 'scrambling'}
				hidePlayer={phase === 'scrambling' && !(sessionState.activeSession?.settings.scrambleShowCube ?? true)}
				onF2LSolved={() => {
					if (phase === 'solving' || phase === 'executing') {
						phase = 'transitioning';
						setTimeout(() => {
							onNext();
						}, 500);
					}
				}}
			/>
			{#if !globalState.hasUsedTwistyPlayer}
				<Pointer
					class="pointer-events-none absolute top-1/2 left-1/2 z-10 size-15 -translate-x-1/2 -translate-y-1/2 animate-bounce text-primary-600"
				/>
			{/if}
		{:else}
			<div class="flex h-60 items-center justify-center">
				<P>Loading case...</P>
			</div>
		{/if}
	</div>

	{#if undoMoves.length >= 2}
		<div class="mt-2 flex justify-center">
			<span class="text-md rounded-full bg-purple-600 px-3 py-1 font-semibold text-white shadow-md">
				Hold Green Front, White Up
			</span>
		</div>
	{/if}

	<HintButtonSmart
		alg={displayAlg}
		movesAdded={phase === 'scrambling' ? '' : movesAdded}
		currentMoveIndex={phase === 'scrambling' ? 0 : currentMoveIndex}
		validationFeedback={phase === 'scrambling' ? 'neutral' : validationFeedback}
		undoMoves={phase === 'scrambling' ? [] : undoMoves}
		editDisabled={true}
		hintMode={'always'}
		hasMadeFirstMove={phase !== 'scrambling'}
		onEditAlg={() => {}}
	/>

	<RecapProgress />
{:else}
	<div class="flex flex-col items-center justify-center gap-6 py-20">
		<div class="flex flex-col items-center gap-3">
			<P class="text-center text-sm text-gray-500 dark:text-gray-400">
				Connect a smart cube to start training
			</P>
			<ButtonGroup>
				<Button color="light" onclick={handleSmartConnect} disabled={bluetoothState.isConnecting}>
					{#if bluetoothState.isConnecting}
						<Spinner class="mr-2" size="5" />
						<span class="text-base font-medium">Connecting...</span>
					{:else}
						<Bluetooth class="mr-2 size-5" />
						<span class="text-base font-medium">{connectButtonLabel}</span>
					{/if}
				</Button>
				<Button color="light" onclick={() => (bluetoothModalOpen = true)}>
					<EllipsisVertical class="size-5" />
				</Button>
			</ButtonGroup>
		</div>
	</div>
{/if}

<div class="flex flex-row items-center justify-center gap-2">
	<TrainStateSelect
		onremove={async () => {
			advanceToNextTrainCase();
			await tick();
			phase = 'scrambling';
		}}
	/>
	<span class="text-sm text-gray-500 dark:text-gray-400"
		>{getNumberOfSelectedCases()} cases selected</span
	>
</div>

<Details />

<Settings bind:this={settingsRef} />
<BluetoothModal bind:open={bluetoothModalOpen} />

{#if currentTrainCase}
	<EditAlg
		bind:this={editAlgRef}
		groupId={currentTrainCase.groupId}
		caseId={currentTrainCase.caseId}
		side={currentTrainCase.side}
	/>
{/if}

<div class="h-20 w-full shrink-0"></div>
