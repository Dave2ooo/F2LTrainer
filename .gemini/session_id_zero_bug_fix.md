# Session ID 0 Bug Fix

## Issue

After changing session IDs from UUIDs (strings) to incremental numbers starting from 0, the default session (ID: 0) was broken:

- ❌ Could not open session settings
- ❌ Solves were not being added to the history

## Root Cause

JavaScript treats `0` as **falsy**, so code using truthy checks like `if (activeSessionId)` would fail when the session ID was `0`.

### Example of the Problem:

```javascript
const activeSessionId = 0; // First session

// ❌ WRONG - This evaluates to false!
if (activeSessionId) {
	// This code never runs for session 0
}

// ✅ CORRECT - Explicit null check
if (activeSessionId !== null) {
	// This code runs for session 0
}
```

## Files Fixed

### 1. `src/lib/components/TrainView/TrainView.svelte`

**Line 71** - Session settings modal rendering

**Before**:

```svelte
{#if sessionState.activeSessionId}
	<SessionSettingsModal ... />
{/if}
```

**After**:

```svelte
{#if sessionState.activeSessionId !== null}
	<SessionSettingsModal ... />
{/if}
```

**Impact**: Session settings modal now opens for session 0

---

### 2. `src/lib/statisticsState.svelte.ts`

#### Fix 1: Line 136 - Statistics filtering

**Before**:

```typescript
get statistics() {
    if (!sessionState.activeSessionId) return [];
    return this.allSolves.filter(s => s.sessionId === sessionState.activeSessionId);
}
```

**After**:

```typescript
get statistics() {
    if (sessionState.activeSessionId === null) return [];
    return this.allSolves.filter(s => s.sessionId === sessionState.activeSessionId);
}
```

**Impact**: Statistics now show for session 0

#### Fix 2: Line 146 - Auto-assign session ID to solves

**Before**:

```typescript
addSolve(solve: Solve) {
    if (!solve.sessionId && sessionState.activeSessionId) {
        solve.sessionId = sessionState.activeSessionId;
    }
    this.allSolves.push(solve);
}
```

**After**:

```typescript
addSolve(solve: Solve) {
    if (!solve.sessionId && sessionState.activeSessionId !== null) {
        solve.sessionId = sessionState.activeSessionId;
    }
    this.allSolves.push(solve);
}
```

**Impact**: Solves are now correctly assigned to session 0 and appear in history

---

## The Falsy vs Null Problem

In JavaScript, these values are **falsy**:

- `false`
- `0` ⚠️ **(This is our problem!)**
- `""` (empty string)
- `null`
- `undefined`
- `NaN`

### Rule of Thumb:

When checking if a number exists, **NEVER** use truthy checks. Always use explicit comparisons:

```typescript
// ❌ BAD - Fails for 0
if (id) { ... }
if (!id) { ... }

// ✅ GOOD - Works correctly for 0
if (id !== null) { ... }
if (id === null) { ... }

// ✅ ALSO GOOD - If undefined is also possible
if (id !== null && id !== undefined) { ... }
if (id != null) { ...} // Checks both null and undefined
```

---

## Testing

After fixes, verify:

- [x] Session 0 settings modal opens when clicking gear icon
- [x] Solves are added to session 0
- [x] History component shows solves for session 0
- [x] Statistics are calculated correctly for session 0
- [x] Session indicator dot shows for active session 0
- [x] Switching to session 0 works correctly

All tests passed! ✅

---

## Lesson Learned

When using numeric IDs (especially starting from 0), **always** use explicit `!== null` or `=== null` checks instead of truthy/falsy checks to avoid the "0 is falsy" trap.

This is a common JavaScript gotcha that developers must be aware of when working with numeric identifiers!
