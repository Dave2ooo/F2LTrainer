# New Training Mode: "Scramble Yourself"

This mode combines Standard Practice (classic) with smart cube integration, requiring the user to physically scramble their cube while the virtual cube tracks and validates their moves. After scrambling, a configurable countdown starts, then the user solves the case while being timed with recognition/execution splits.

## Step-by-Step Implementation

1. Start by adding the option to [SessionSettingsModal.svelte](file:///d:/WebDevelopment/F2LTrainer/src/lib/components/Session/SessionSettingsModal.svelte) without including it into convex. Make this new setting show the new train component which is empty for now.
2. After checking if it works, add the scramble to the train component and the twisty player. Make sure that the twisty player shows the unscrambled cube before the user applies a scramble. Right now [TwistyPlayer.svelte](file:///d:/WebDevelopment/F2LTrainer/src/lib/components/TwistyPlayer.svelte) automatically adds a scramble according to its groupid and caseid.
3. After checking if the scrambling works correctly, implement the countdown.
4. After checking that, add the algorithm hint. It would be best if we could use [HintButtonSmart.svelte](file:///d:/WebDevelopment/F2LTrainer/src/lib/components/TrainView/HintButtonSmart.svelte) for this and just adapt it a bit if necessary.
5. After that works, add the [DrillTimer.svelte](file:///d:/WebDevelopment/F2LTrainer/src/lib/components/TrainView/DrillTimer.svelte). Decide if you want to reuse this component or create a copy.
6. After that works, add the [Details.svelte](file:///d:/WebDevelopment/F2LTrainer/src/lib/components/TrainView/Details.svelte), [RecapProgress.svelte](file:///d:/WebDevelopment/F2LTrainer/src/lib/components/TrainView/RecapProgress.svelte) and [TrainStateSelect.svelte](file:///d:/WebDevelopment/F2LTrainer/src/lib/components/TrainView/TrainStateSelect.svelte).
7. After that works, implement it into convex.

## Resolved Design Decisions

- **Statistics trainMode:** New 4th value `smartScramble` for separate tracking
- **Countdown duration:** Configurable via Range slider (like Drill Flow), with progressbar
- **Virtual cube during scramble:** Optional — new checkbox "Show cube while scrambling"
- **Wrong scramble moves:** Undo guidance (same as HintButtonSmart)
- **Transition delay after solve:** Fixed 500ms with green checkmark (TrainClassicSmart style)
- **Checkbox visibility:** Always visible inside Standard Practice card, only effective when `trainMode === 'classic'`

## Proposed Changes

### Statistics Types & Compression

#### [MODIFY] [statisticsState.ts](file:///d:/WebDevelopment/F2LTrainer/src/lib/statisticsState.ts)
- Add `smartScramble` to TrainMode union: `'classic' | 'smart' | 'drill' | 'smartScramble'`
- Add `ss` to CompressedSolve.m union: `'c' | 's' | 'd' | 'ss'`

#### [MODIFY] [statisticsState.svelte.ts](file:///d:/WebDevelopment/F2LTrainer/src/lib/statisticsState.svelte.ts)
- Add `smartScramble: 'ss'` to `MODE_MAP`
- Add `ss: 'smartScramble'` to `REVERSE_MODE_MAP`

---

### Session Types & Settings

#### [MODIFY] [session.ts](file:///d:/WebDevelopment/F2LTrainer/src/lib/session.ts)
Add to `SessionSettings` interface:
```typescript
scrambleYourself: boolean; // Enable "Scramble Yourself" mode
scrambleCountdownDuration: number; // Seconds before solving starts (like drillTimeBetweenCases)
scrambleShowCube: boolean; // Show virtual cube while scrambling
```

#### [MODIFY] [sessionState.svelte.ts](file:///d:/WebDevelopment/F2LTrainer/src/lib/sessionState.svelte.ts)
Add to `DEFAULT_SETTINGS`:
```typescript
scrambleYourself: false,
scrambleCountdownDuration: 1.0,
scrambleShowCube: true,
```

---

### Session Settings UI

#### [MODIFY] [SessionSettingsModal.svelte](file:///d:/WebDevelopment/F2LTrainer/src/lib/components/Session/SessionSettingsModal.svelte)
Inside the Standard Practice radio card:
- Add a Checkbox for "Scramble yourself" — always visible regardless of which trainMode is selected, but only takes effect when `trainMode === 'classic'`
- Brief description: "Scramble your smart cube yourself. Requires Smart Cube."

Below the Training Activity section (conditionally shown when `scrambleYourself === true` AND `trainMode === 'classic'`):
- Add a "Scramble Flow" card (similar to the existing "Drill Flow" card)
- Range slider for `scrambleCountdownDuration` (0–5s, step 0.25s)
  - Label: "Countdown Duration" with current value display (e.g., "1.0s")
  - Description: "Time between completing scramble and seeing the case."
- Checkbox for `scrambleShowCube`: "Show Cube While Scrambling"
  - Description: "Display the virtual cube updating as you scramble. When off, the cube is hidden until you start solving."

---

### Training View Routing

#### [MODIFY] [TrainView.svelte](file:///d:/WebDevelopment/F2LTrainer/src/lib/components/TrainView/TrainView.svelte)
Update the routing logic:
```svelte
{#if activeSettings.trainMode === 'drill'}
  <TrainDrill bind:isRunning={isDrillRunning} />
{:else if bluetoothState.isConnected && activeSettings.scrambleYourself}
  <!-- Scramble Yourself mode (requires classic + connected smart cube) -->
  <TrainClassicScramble />
{:else if bluetoothState.isConnected}
  <!-- Auto smart cube training when connected -->
  <TrainClassicSmart />
{:else}
  <!-- Default Classic Mode -->
  <TrainClassic />
{/if}
```

---

### New Training Component

#### [NEW] [TrainClassicScramble.svelte](file:///d:/WebDevelopment/F2LTrainer/src/lib/components/TrainView/TrainClassicScramble.svelte)
This is the main new component. It combines elements from `TrainClassicSmart` and `TrainDrill`.

**State Machine Phases:**
`scrambling` → `countdown` → `solving` → `executing` → `transitioning` → (next case → `scrambling`)

**Phase details:**

- **scrambling:**
  - The scramble text is shown at the top.
  - The virtual cube starts unsolved. If `scrambleShowCube` is true, the `TwistyPlayer` is visible; otherwise, it's hidden.
  - Each smart cube move is applied to the virtual `TwistyPlayer` via `addMove()`.
  - Validated against the scramble sequence using `HintButtonSmart`'s validation logic.
  - Wrong moves trigger undo guidance (amber undo chips).
  - When all scramble moves are matched → transition to `countdown`.
  - `HintButtonSmart` displays the scramble as the algorithm to follow, with completed/current/future move chips.
- **countdown:**
  - The virtual cube is hidden.
  - A progressbar countdown is shown (configurable duration via `scrambleCountdownDuration`).
  - Uses the same radial progress animation style as `TrainDrill`'s transition overlay.
  - "Hold Green Front, White Up" badge shown.
  - Smart cube moves are ignored during countdown.
- **solving:**
  - The virtual cube is shown (scramble was already applied move-by-move).
  - `DrillTimer` starts the recognition phase.
  - Smart cube moves are tracked; first non-U move transitions to `executing`.
- **executing:**
  - `DrillTimer` switches to execution phase.
  - Move validation against the algorithm is active (like `TrainClassicSmart`).
  - `HintButtonSmart` shows the solving algorithm with progress tracking.
  - `onF2LSolved` detection triggers completion.
- **transitioning:**
  - Green checkmark overlay with pulse animation (from `TrainClassicSmart`).
  - Solve time (recognition + execution) recorded with `trainMode: 'smartScramble'`.
  - After 500ms delay, advance to next case and reset to `scrambling`.

**Key implementation details:**
- During the scramble phase, the `TwistyPlayer` uses an empty scramble so the cube appears solved. The scramble moves get applied via `addMove()` as the user performs them on the physical cube.
- The scramble sequence is parsed from the scramble string (using `getCaseScramble` + `concatinateAuf`).
- During the solve phase, the cube already has the scramble applied. The user's solving moves are tracked via `addMove()`.
- `HintButtonSmart` is reused in both phases:
  - Scrambling: `alg` prop = scramble moves, `currentMoveIndex` tracks scramble progress.
  - Solving: `alg` prop = solving algorithm (with AUF), `currentMoveIndex` tracks algorithm progress.
- `DrillTimer` handles recognition/execution timing (only during solve phase).
- Bluetooth connection pattern identical to `TrainClassicSmart` (subscriber pattern with priority).
- Rotation warning (from `TrainClassicSmart`) shown between cases if cumulative rotation is non-empty.

**Components reused:**
- `TwistyPlayer`
- `HintButtonSmart`
- `DrillTimer`
- `RecapProgress`
- `Details`
- `TrainStateSelect`
- `BluetoothModal`
- `EditAlg`
- `Settings`

---

### Session Manager / Toolbar

#### [MODIFY] [SessionToolbar.svelte](file:///d:/WebDevelopment/F2LTrainer/src/lib/components/Session/SessionToolbar.svelte)
- If the session has `scrambleYourself: true` and `trainMode: 'classic'`, optionally show a visual indicator badge.

#### [MODIFY] [SessionManagerModal.svelte](file:///d:/WebDevelopment/F2LTrainer/src/lib/components/Session/SessionManagerModal.svelte)
- Same optional visual indicator for sessions with `scrambleYourself` enabled.

## Verification Plan

### Automated Tests
- Run `npm run check` to verify TypeScript compilation
- Run `npm run build` to ensure no build errors

### Manual Verification
1. Create a new session, check "Scramble yourself" under Standard Practice
2. Verify the "Scramble Flow" settings card appears with Range slider and "Show Cube" checkbox
3. Connect a smart cube → verify `TrainClassicScramble` loads
4. **Scramble phase:** Verify scramble text shown, moves applied to virtual cube, wrong moves show undo guidance, cube visibility respects `scrambleShowCube` setting
5. **Countdown:** Verify progressbar countdown runs for configured duration after scramble complete
6. **Solve phase:** Verify timer starts, recognition/execution split works, F2L detection triggers completion
7. **Transition:** Verify checkmark overlay, auto-advance to next case back to scramble phase
8. Verify `RecapProgress`, `Details`, `TrainStateSelect` all work
9. Disconnect smart cube → verify it falls back to `TrainClassic`
10. Uncheck "Scramble yourself" → verify normal `TrainClassicSmart` behavior when connected
11. Check statistics are saved with `trainMode: 'smartScramble'`
12. Verify "Scramble yourself" checkbox is visible even when Speed Drill is selected (but has no effect)
