# Drill Mode Architecture

This document explains the Drill Mode feature for smart cube training, including all components, state management, and data flow.

## Overview

Drill Mode is a training mode that tracks **recognition time** and **execution time** separately. Unlike Classic Smart mode, it provides no algorithm hints - users must solve cases purely from memory.

**Key Features:**

- Split timing: recognition vs execution
- Countdown before starting (3-2-1)
- No algorithm hints during solving
- Direct move application (no validation/transformation)
- Success overlay on case completion
- Give up, Skip, and Stop actions

## Components

### TrainDrill.svelte

**Path:** `src/lib/components/TrainView/TrainDrill.svelte`

Main component orchestrating the drill session. Handles:

- State machine management
- Smart cube move subscription
- TwistyPlayer integration
- Action button handlers

### DrillTimer.svelte

**Path:** `src/lib/components/TrainView/DrillTimer.svelte`

Timer component displaying split times:

- Recognition time (case shown → first non-U move)
- Execution time (first non-U move → F2L solved)
- Total time

**Exported Methods:**

```typescript
startRecognition(): void  // Start recognition phase timer
endRecognition(): number  // End recognition, start execution, return recognition time
stopExecution(): number   // Stop timer, return execution time
reset(): void             // Reset to idle state
getRecognitionTime(): number
getExecutionTime(): number
getTotalTime(): number
getPhase(): Phase
```

### TrainView.svelte

**Path:** `src/lib/components/TrainView/TrainView.svelte`

Routes to appropriate training component based on settings:

```
trainMode === 'drill' && smartCubeEnabled → TrainDrill
trainMode !== 'drill' && smartCubeEnabled → TrainClassicSmart
otherwise → TrainClassic
```

## State Machine

```
DrillPhase:
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  'stopped' ──[Start]──► 'countdown' ──[3,2,1]──►       │
│       ▲                                                 │
│       │                                                 │
│    [Stop]                                               │
│       │                                                 │
│  'solving' ◄──────────────────────────────────────┐    │
│       │                                           │    │
│  [first non-U move]                               │    │
│       ▼                                           │    │
│  'executing'                                      │    │
│       │                                           │    │
│   [F2L solved]                                    │    │
│       ▼                                           │    │
│  'transitioning' ──[1s delay]─────────────────────┘    │
│                                                         │
│  'gave_up' ──[Redo]──► 'solving'                       │
│           ──[Resume]──► next case                      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Data Flow

### Move Handling

```
Smart Cube → bluetoothState.subscribeToMoves() → handleSmartCubeMove()
    │
    ├── Ignore if phase is 'stopped', 'countdown', 'transitioning', or 'gave_up'
    │
    ├── Check if first non-U move → transition to 'executing' phase
    │
    └── Apply move directly to TwistyPlayer: twistyPlayerRef.addMove(m, m)
```

Unlike TrainClassicSmart, moves are applied **directly** without transformation or validation.

### Timing

```
[Case shown] → startRecognition()
                    │
              recognition timer running
                    │
[First non-U move] → endRecognition() → startExecution()
                         │
                   execution timer running
                         │
[F2L solved] → stopExecution() → record times
```

### Solve Recording

```typescript
statisticsState.addSolve({
	id,
	groupId,
	caseId,
	time: totalTime, // recognitionTime + executionTime
	timestamp: Date.now(),
	auf,
	side,
	scrambleSelection,
	sessionId,
	recognitionTime, // NEW: drill mode only
	executionTime // NEW: drill mode only
});
```

## Data Types

### Extended Solve Type

**Path:** `src/lib/types/statisticsState.ts`

```typescript
interface Solve {
	// ... existing fields ...
	recognitionTime?: number | null; // in centiseconds
	executionTime?: number | null; // in centiseconds
}

interface CompressedSolve {
	// ... existing fields ...
	rt?: number | null; // recognitionTime compressed
	et?: number | null; // executionTime compressed
}
```

### Helper Function

**Path:** `src/lib/utils/moveValidator.ts`

```typescript
function isUMove(move: string): boolean;
// Returns true for U, U', U2 moves
// Used to determine recognition → execution transition
```

## UI States

### Stopped

- Shows "Drill Mode" heading with description
- "Start Drill" button
- Selected cases count

### Countdown

- Large pulsing number (3, 2, 1)
- "Get ready..." text
- 0.5s per number

### Solving/Executing

- TwistyPlayer with scrambled case
- Action buttons: Give up, Skip, Stop
- DrillTimer showing live times

### Transitioning

- Green success overlay with checkmark
- Timer shows completed times (frozen)
- 1 second duration

### Gave Up

- Algorithm text display
- Redo button (retry same case)
- Resume button (next case)

## Key Design Decisions

1. **No move validation** - Unlike TrainClassicSmart, moves are applied directly. The TwistyPlayer's F2L detection determines success.

2. **Recognition = until first non-U move** - U moves are considered part of recognition as users often do AUF while recognizing.

3. **No scramble display** - Removed for cleaner UI since the TwistyPlayer shows the case visually.

4. **Timer persists during transition** - Times stay visible during the 1s success animation so users can see their result.

5. **Smart cube required** - Drill mode enforces `smartCubeEnabled: true` in TrainView routing.

6. **Connection check** - When not connected, shows connect button group instead of Start. Auto-stops drill if connection is lost during session.

## File Summary

| File                        | Purpose                |
| --------------------------- | ---------------------- |
| `TrainDrill.svelte`         | Main drill component   |
| `DrillTimer.svelte`         | Split timing display   |
| `TrainView.svelte`          | Mode routing           |
| `statisticsState.ts`        | Extended Solve types   |
| `statisticsState.svelte.ts` | Compression with rt/et |
| `moveValidator.ts`          | isUMove helper         |
