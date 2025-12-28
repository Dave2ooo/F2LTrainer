# Smart Cube Training Architecture

This document explains how the smart cube training flow works, focusing on algorithm handling, move validation, and F2L detection.

## Overview

The smart cube training involves three main components:

1. **TrainClassicSmart.svelte** - Receives moves from smart cube, validates against algorithm
2. **TwistyPlayer.svelte** - Displays the cube state, handles F2L detection
3. **checkF2LState.ts** - Determines if F2L is solved

## Data Flow Diagram

```
Smart Cube (Bluetooth)
        │
        ▼
bluetoothState.moveCounter (absolute moves: U, R, F, etc.)
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│ TrainClassicSmart.svelte                                    │
│ ┌─────────────────────┐                                     │
│ │ $effect on          │                                     │
│ │ moveCounter         │─────────────────────────────────┐   │
│ └─────────────────────┘                                 │   │
│         │                                               │   │
│         ▼                                               ▼   │
│ ┌─────────────────────┐    ┌────────────────────────────┐   │
│ │ moveBuffer[]        │───▶│ validateMoveProgress()     │   │
│ │ (absolute moves)    │    │ - handles rotations        │   │
│ └─────────────────────┘    │ - handles wide moves       │   │
│                            │ - handles slice moves      │   │
│                            │ - updates currentMoveIndex │   │
│                            └────────────────────────────┘   │
│         │                                                   │
│         ▼                                                   │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Transform move to "algorithm frame" using               │ │
│ │ cumulativeRotation (inverse rotation)                   │ │
│ └─────────────────────────────────────────────────────────┘ │
│         │                                                   │
│         ▼                                                   │
│    twistyPlayerRef.addMove(transformedMove, rawMove)        │
└─────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│ TwistyPlayer.svelte                                         │
│ ┌─────────────────────┐   ┌──────────────────────────────┐  │
│ │ movesAdded          │   │ rawMovesAdded                │  │
│ │ (transformed moves) │   │ (absolute moves)             │  │
│ └─────────────────────┘   └──────────────────────────────┘  │
│         │                                                   │
│         ▼                                                   │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ F2L Check Logic:                                        │ │
│ │ - Iterates through movesAdded                           │ │
│ │ - Tracks rotations, expands wide moves to single-layer  │ │
│ │ - Applies rotations to get absolute frame               │ │
│ │ - Passes to checkF2LState()                             │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│ checkF2LState.ts                                            │
│ - Creates Alg from: scramble + converted_moves              │
│ - Uses kpuzzle.algToTransformation() to get cube state      │
│ - Checks corner/edge positions for F2L slots                │
│ - Calls onF2LSolved() if solved                             │
└─────────────────────────────────────────────────────────────┘
        │
        ▼
    onNext() → advances to next case
```

---

## Key State Variables

### In TrainClassicSmart.svelte

| Variable             | Type                                    | Description                                                                              |
| -------------------- | --------------------------------------- | ---------------------------------------------------------------------------------------- |
| `alg`                | `string`                                | **Bound to TwistyPlayer's `movesAdded`**. Contains transformed moves in algorithm frame. |
| `displayAlg`         | `string`                                | The expected algorithm with AUF applied. Parsed into `algMovesParsed`.                   |
| `algMovesParsed`     | `string[]`                              | Array of expected moves from the algorithm (parentheses removed).                        |
| `currentMoveIndex`   | `number`                                | Index pointing to the next expected move in `algMovesParsed`.                            |
| `moveBuffer`         | `string[]`                              | Buffer of recent **absolute** moves from smart cube awaiting validation.                 |
| `cumulativeRotation` | `string`                                | Tracks combined rotations encountered so far (e.g., `"y"`, `"y2"`, `"x y"`).             |
| `validationFeedback` | `'correct' \| 'incorrect' \| 'neutral'` | Visual feedback state for UI.                                                            |

### In TwistyPlayer.svelte

| Variable        | Type     | Description                                                     |
| --------------- | -------- | --------------------------------------------------------------- |
| `movesAdded`    | `string` | Moves applied to the visual player (algorithm frame). Bindable. |
| `rawMovesAdded` | `string` | Absolute moves from smart cube. Used for some calculations.     |
| `scramble`      | `string` | The scramble algorithm. Bindable.                               |

---

## Coordinate Frames

The smart cube training uses two coordinate frames:

### 1. Absolute Frame (Smart Cube Frame)

- Moves as detected by the smart cube
- Always relative to the physical cube's fixed orientation
- Example: If you do an R move, it's always "R" regardless of rotations

### 2. Algorithm Frame (Rotated Frame)

- Moves as they appear in the algorithm
- Account for rotations like `y`, `x`, `z`
- Example: After `y` rotation, what was `F` in the algorithm becomes `R` in absolute frame

### Transformation Between Frames

```typescript
// To convert from absolute → algorithm frame:
const inverseRot = inverseRotation(cumulativeRotation);
const transformedMove = applyRotationToMove(absoluteMove, inverseRot);

// Example:
// cumulativeRotation = "y"
// absoluteMove = "R"  (user physically did R)
// inverseRot = "y'"
// transformedMove = "F"  (shows as F in algorithm frame)
```

---

## Algorithm Validation Flow (validateMoveProgress)

### Step 1: Handle Rotations

When the next expected move is a rotation (x, y, z):

1. Collect all consecutive rotations
2. Apply them to TwistyPlayer visualization
3. Update `cumulativeRotation`
4. Advance `currentMoveIndex` past all rotations
5. **Rotations are auto-applied** - user doesn't perform them on smart cube

### Step 2: Handle Wide Moves

When the next expected move is a wide move (r, l, u, d, f, b):

1. Map wide move to expected single-layer move (e.g., `r` expects `L` from smart cube)
2. Check if `moveBuffer` contains the expected single-layer move
3. If match: apply wide move to TwistyPlayer, update `cumulativeRotation` with implicit rotation
4. **Smart cube detects the opposite face** (L for r, R for l, etc.)

### Step 3: Handle Regular Moves

1. Transform `moveBuffer` to algorithm frame using inverse of `cumulativeRotation`
2. Normalize moves (coalesce U+U→U2, handle cancellations)
3. Match against expected moves using `matchesMoveSequence()`
4. If match: advance `currentMoveIndex`, clear buffer

### Step 4: Handle Slice Moves (M, E, S)

1. Within matched moves, detect slice moves
2. Apply rotation to TwistyPlayer to keep visual in sync
3. **PREPEND** implicit rotation to `cumulativeRotation` (not append) - when users physically perform slice moves, their grip orientation changes. The slice rotation is prepended because it represents a change in the absolute frame, which should be undone first when transforming moves.

---

## F2L Detection Flow (in TwistyPlayer.addMove)

### Current Implementation

```typescript
// 1. Parse movesAdded into list
const movesList = movesAdded.split(' ');

// 2. Track rotations and expand wide moves
for (const move of movesList) {
    if (isRotationMove(move)) {
        // Update currentRotation
        currentRotation = combineRotations([currentRotation, move]);
    } else if (isWideMove(move)) {
        // Wide move detected
        const singleLayer = wideToSingleLayerMove(move);  // r → L
        const implicitRot = getWideImplicitRotation(move); // r → x

        // Apply rotation to get to absolute frame
        movesForF2LCheckList.push(applyRotationToMove(singleLayer, currentRotation));

        // Update rotation
        currentRotation = combineRotations([currentRotation, implicitRot]);
    } else {
        // Regular move - apply current rotation
        movesForF2LCheckList.push(applyRotationToMove(move, currentRotation));
    }
}

// 3. Pass to checkF2LState
checkF2LState({ kpuzzle }, scramble, movesForF2LCheck, ...);
```

### What checkF2LState Does

```typescript
// Create algorithm from scramble + moves
const currentAppliedAlg = new Alg(scramble + ' ' + movesForF2LCheck);

// Apply to kpuzzle to get resulting cube state
const normalizedPattern = kpuzzle.algToTransformation(currentAppliedAlg).toKPattern();

// Check if F2L slots are solved (checking corner/edge positions)
const f2lSolved = isF2LSolved(corners, edges, piecesToHide, side);

// If solved, call the callback
if (f2lSolved) {
	onF2LSolved?.(); // This triggers onNext() in TrainClassicSmart
}
```

---

## HintButtonSmart.svelte

### Purpose

Displays the algorithm with progress indication:

- **Completed moves**: Green, dimmed
- **Current move(s)**: Blue, pulsing (highlighted)
- **Future moves**: Blurred

### Props

| Prop                 | Type                                    | Description                                            |
| -------------------- | --------------------------------------- | ------------------------------------------------------ |
| `alg`                | `string`                                | The full algorithm to display (displayAlg from parent) |
| `currentMoveIndex`   | `number`                                | Current position in algorithm                          |
| `movesAdded`         | `string`                                | Applied moves (for "Applied Moves" section)            |
| `validationFeedback` | `'correct' \| 'incorrect' \| 'neutral'` | Border/background feedback                             |

### Special Behavior

- If current move is a rotation, shows 2 moves (rotation + next move) without blur
- Progress indicator shows `currentMoveIndex / totalMoves`

---

## Known Issues / Challenges

### Wide Moves

- **Problem**: Smart cube detects `L` when user does `r` (since r = R + L direction layers)
- **Current Approach**: Map wide move to opposite single-layer (r → L)
- **Complication**: KPuzzle doesn't directly support lowercase wide moves or notation like `2Rw`

### Rotations

- **Problem**: User doesn't physically rotate the cube, so smart cube doesn't send rotation moves
- **Current Approach**: Auto-apply rotations and track in `cumulativeRotation`
- **Complication**: F2L checking needs to account for rotations when comparing states

### F2L Detection with Rotations/Wide Moves

- **Challenge**: Moves added to TwistyPlayer are in algorithm frame, but F2L checking needs absolute frame moves
- **The conversion logic** must accurately:
  1. Track rotations (explicit and implicit from wide moves)
  2. Convert movesAdded back to absolute frame
  3. Pass valid move notation to cubing.js Alg parser

---

## Triggering Next Case

The case advances when:

1. **F2L is detected as solved** → `onF2LSolved` callback calls `onNext()`
2. **User clicks TwistyPlayer** → `onclick` calls `onNext()`
3. **User clicks arrow buttons** → `onNext()` / `onPrevious()`
4. **Timer stops** → `handleTimerStop()` records solve, then calls `onNext()`

---

## Debug Logging

Console logs by prefix:

- `[Parsing]` - Algorithm parsing
- `[Validation]` - Move validation in progress
- `[Rotation]` - Rotation handling
- `[Wide Move]` - Wide move detection
- `[Slice Move]` - Slice move handling
- `[F2L Check]` - F2L checking (in checkF2LState.ts)
