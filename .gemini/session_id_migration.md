# Session ID Migration: UUID to Incremental Numbers

## Summary
Changed session ID generation from UUIDs (strings) to simple incremental integers starting from 0 for better readability and simpler debugging.

---

## Changes Made

### 1. Type Definitions

#### `src/lib/types/session.ts`
**Before**: `id: string`  
**After**: `id: number`

```typescript
export interface Session {
	id: number;  // Changed from string
	name: string;
	settings: SessionSettings;
	// ...
}
```

#### `src/lib/types/statisticsState.ts`
**Before**: `sessionId?: string`  
**After**: `sessionId?: number`

```typescript
export type Solve = {
	// ...
	sessionId?: number;  // Changed from string
};

export type CompressedSolve = {
	// ...
	sid?: number;  // Changed from string
};
```

---

### 2. Session State Management

#### `src/lib/sessionState.svelte.ts`

**Key Changes:**

1. **ActiveSession ID Type**:
   ```typescript
   activeSessionId: number | null = $state(null);  // Was: string | null
   ```

2. **Next ID Generator** (NEW):
   ```typescript
   private getNextId(): number {
       if (this.sessions.length === 0) return 0;
       const maxId = Math.max(...this.sessions.map(s => s.id));
       return maxId + 1;
   }
   ```
   - Returns 0 for the first session
   - Finds the maximum existing ID and increments by 1
   - Handles gaps in IDs (e.g., if session 1 is deleted, next ID would be 2, not 1)

3. **Create Session**:
   ```typescript
   // Before:
   id: crypto.randomUUID()
   
   // After:
   id: this.getNextId()
   ```

4. **LocalStorage Handling**:
   ```typescript
   // Save - convert number to string for storage
   localStorage.setItem(ACTIVE_SESSION_KEY, this.activeSessionId.toString());
   
   // Load - parse string back to number
   const storedActiveIdStr = localStorage.getItem(ACTIVE_SESSION_KEY);
   const storedActiveId = storedActiveIdStr ? parseInt(storedActiveIdStr, 10) : null;
   if (storedActiveId !== null && !isNaN(storedActiveId) && ...) {
       this.activeSessionId = storedActiveId;
   }
   ```

5. **Method Signatures** - Updated all to use `number`:
   ```typescript
   updateSession(id: number, updates: Partial<Session>)
   deleteSession(id: number)
   restoreSession(id: number)
   setActiveSession(id: number)
   ```

---

### 3. Component Props

#### `src/lib/components/Session/SessionSettingsModal.svelte`
```typescript
let { 
    open = $bindable(), 
    sessionId, 
    isNew = false 
}: { 
    open: boolean; 
    sessionId?: number;  // Changed from implicit any/string
    isNew?: boolean 
} = $props();
```

---

## Benefits

### 1. **Readability**
- **Before**: Sessions have IDs like `"a3f42e9c-8d1b-4e6a-9a2c-1f5d8e3b7c4a"`
- **After**: Sessions have IDs like `0`, `1`, `2`
- Much easier to debug and discuss ("Session 2" vs "Session a3f4...")

### 2. **Simpler Debugging**
- Console logs show: `activeSessionId: 2` instead of `activeSessionId: "a3f42e9c..."`
- LocalStorage inspector shows clean numbers
- Easier to track session flow in DevTools

### 3. **Smaller Storage**
- Numbers take less bytes than UUID strings
- Compressed solves also benefit from smaller session IDs

### 4. **Predictable IDs**
- First session is always `0`
- Second session is `1`, etc.
- No random UUIDs to remember or copy-paste

---

## ID Generation Details

### How IDs are Assigned

1. **First session created**: ID = `0`
2. **Second session created**: ID = `1`
3. **Third session created**: ID = `2`
4. If session `1` is deleted:
   - **Fourth session created**: ID = `3` (not `1`)
   - IDs are never reused, even after deletion

### Why Not Reuse IDs?

Imagine this scenario:
1. User creates Session 0, 1, 2
2. User deletes Session 1
3. User creates a new session - it gets ID 3 (not 1)

**Reason**: Historical data (solves) might reference Session 1. If we reuse ID 1 for a new session, those old solves would appear to belong to the wrong session. By never reusing IDs, we maintain data integrity.

---

## Breaking Change Notice

⚠️ **This is a breaking change**  
Users with existing sessions from before this change will need to clear their localStorage and start fresh. No migration is provided as this is early development.

## Testing Checklist

- [x] Create new sessions → IDs increment (0, 1, 2, ...)
- [x] Delete a session → Next session ID doesn't reuse deleted ID
- [x] Switch between sessions → Active ID updates correctly
- [x] Save & reload → Session IDs persist correctly through localStorage
- [x] Solves record correct sessionId (number, not string)
- [x] Session settings update with correct ID
- [x] No TypeScript errors anywhere session IDs are used

---

## Files Modified

1. `src/lib/types/session.ts` - Session interface
2. `src/lib/types/statisticsState.ts` - Solve types
3. `src/lib/sessionState.svelte.ts` - Session state management
4. `src/lib/components/Session/SessionSettingsModal.svelte` - Props typing

All other files automatically benefit from TypeScript's type checking and didn't require changes!

---

## Conclusion

Session IDs are now clean, predictable integers starting from 0, making debugging and development much easier while maintaining data integrity! 🎉
