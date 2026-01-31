# Soft Delete Implementation

## Overview

This document describes the soft delete implementation for sessions and solves in F2LTrainer. Soft deletes allow items to be marked as deleted without physically removing them from the database, enabling proper cross-device deletion propagation and potential future recovery features.

## Implementation Details

### Database Schema

Both `sessions` and `solves` tables include two optional fields:

- `deleted?: boolean` - Indicates if the item is soft-deleted (default: undefined/false)
- `deletedAt?: number` - Timestamp when the item was deleted (milliseconds since epoch)

### Key Design Decisions

1. **Separate from Archived**: The `deleted` field is separate from `archived`. Archived sessions are user-visible "hidden" sessions, while deleted sessions are truly deleted from the user's perspective.

2. **Soft Delete by Default**: All delete operations (including "hard delete") use soft deletes. Physical deletion is not used.

3. **No Migration Needed**: Existing items without `deleted` field are treated as not deleted (falsy check).

4. **Cleanup Strategy**: Auto-cleanup of old soft-deleted items (90 days) is planned for future implementation.

## Modified Files

### Convex Schema & Mutations

**src/convex/schema.ts**

- Added `deleted?: boolean` and `deletedAt?: number` to both `sessions` and `solves` tables
- Removed the `deletedSessions` tombstone table

**src/convex/sessions.ts**

- `getSessionsForCurrentUser`: Filters out deleted sessions (`.filter(s => !s.deleted)`)
- `addSession`: Includes `deleted` and `deletedAt` in validator
- `updateSession`: Includes `deleted` and `deletedAt` in updates
- `deleteSession`: Sets `archived: true` (archive functionality - user-visible soft delete)
- `restoreSession`: Sets `archived: false, lastModified: Date.now()` (unarchive functionality)
- `hardDeleteSession`: Sets `deleted: true, deletedAt: Date.now()` (true soft delete for sync)
- `bulkUpsertSessions`: Handles `deleted` and `deletedAt` fields in sync
- Removed `getDeletedSessionIds` query (no longer needed)

**src/convex/solves.ts**

- `getSolvesForCurrentUser`: Filters out deleted solves
- `addSolve`: Includes `deleted` and `deletedAt` in validator
- `deleteSolve`: Sets `deleted: true, deletedAt: Date.now()` (soft delete)
- `deleteSolvesBySession`: Soft deletes all solves for a session
- `bulkUpsertSolves`: Handles `deleted` and `deletedAt` fields in sync
- Defined `solveObjectValidator` for reuse across mutations

### Type Definitions

**src/lib/types/session.ts**

- Added `deleted?: boolean` to Session interface
- Added `deletedAt?: number` to Session interface

**src/lib/types/statisticsState.ts**

- Added `deleted?: boolean` to Solve interface
- Added `deletedAt?: number` to Solve interface

### Sync Services

**src/lib/services/sessionsSyncService.ts**

- `syncOnLogin()`: Maps `deleted` and `deletedAt` when converting from Convex
- `pullFromConvex()`: Maps `deleted` and `deletedAt` when converting from Convex
- Removed `getDeletedSessionIds()` method (no longer needed with soft deletes)

**src/lib/services/solvesSyncService.ts**

- `syncOnLogin()`: Maps `deleted` and `deletedAt` when converting from Convex
- `pullFromConvex()`: Maps `deleted` and `deletedAt` when converting from Convex

### State Management

**src/lib/sessionState.svelte.ts**

- `handlePageLoadSync()`: Pulls from Convex, checks if active session is deleted OR archived
- `handleLoginSync()`: Uploads local data, merges with Convex, checks if active session is deleted OR archived
- `deleteSession()`: Sets `archived: true, lastModified: Date.now()` for proper offline sync
- `restoreSession()`: Sets `archived: false, lastModified: Date.now()` for proper offline sync
- `hardDeleteSession()`: Sets `deleted: true, deletedAt: Date.now()` instead of removing from array
- Added `visibleSessions` and `activeSessions` getters for UI filtering

**src/lib/statisticsState.svelte.ts**

- No changes needed (sync service handles filtering)

## How It Works

### Cross-Device Deletion Flow

1. **Device A deletes a session**:
   - Calls `hardDeleteSession` mutation
   - Sets `deleted: true, deletedAt: Date.now()` in Convex
   - Updates local state to remove session from localStorage

2. **Device B refreshes page**:
   - Calls `pullFromConvex()` (page load sync)
   - Receives sessions from Convex (soft-deleted items are filtered at query level)
   - Updates localStorage with Convex data (session is gone)

### Conflict Resolution

Soft deletes participate in the same conflict resolution as other fields:

- Timestamp-based: newer `lastModified` or `timestamp` wins
- If Device A deletes (sets `deleted: true`) and Device B modifies (updates fields), whichever has the newer timestamp wins
- This ensures deletion propagates correctly even when offline devices come back online

### Filtering Strategy

**Server-Side (Convex Queries)**:

- All `get*` queries filter out soft-deleted items: `.filter(s => !s.deleted)`
- Mutations receive and store `deleted` and `deletedAt` fields
- Soft-deleted items never appear in query results

**Client-Side (localStorage)**:

- Deleted sessions are kept in localStorage (marked with `deleted: true`)
- This allows offline deletions to sync when logging in later
- Sync services map `deleted` and `deletedAt` fields when converting from Convex
- Page load sync overwrites localStorage with Convex data
- UI components filter out deleted sessions using `.filter(s => !s.deleted)`
- State provides `visibleSessions` and `activeSessions` getters for convenience

## Testing Checklist

- [ ] Device A deletes session → Device B refreshes → session removed on B
- [ ] Device A deletes session → Device A refreshes → session still removed
- [ ] Device B modifies session while A has it deleted offline → correct conflict resolution
- [ ] Deleted sessions don't appear in session selection UI
- [ ] Deleted solves don't appear in statistics
- [ ] Archived sessions still work correctly (separate from deleted)
- [ ] First-time login syncs correctly with soft deletes

## Future Enhancements

### Auto-Cleanup Job (Not Yet Implemented)

Plan for cleanup of old soft-deleted items:

- Convex cron job runs daily
- Physically deletes items where `deleted: true` and `deletedAt < now - 90 days`
- Only affects items deleted more than 90 days ago
- Implementation: See Option C in design discussions

### Restore Functionality (Not Planned)

While soft deletes enable restore functionality, there are currently no plans to implement a UI for restoring deleted items. If needed in the future:

- Add `restoreSession` mutation that sets `deleted: undefined, deletedAt: undefined`
- Add UI in settings to view and restore deleted items
- Consider separate "trash" view with 30-day retention

## Notes

- **Archived vs Deleted**: Keep these concepts separate. `archived: true` means user-hidden but recoverable, `deleted: true` means truly deleted from user perspective.
- **Performance**: Soft deletes add minimal overhead. Filtering happens at query level in Convex (indexed).
- **Storage**: Old soft-deleted items will accumulate until cleanup job is implemented. Not a concern for typical usage.
- **Conflict Resolution**: Soft delete fields participate in timestamp-based conflict resolution naturally.
