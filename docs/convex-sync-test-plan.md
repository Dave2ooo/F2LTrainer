# Convex Sync Test Plan

Comprehensive test plan for testing sessions and solves sync functionality across devices.

## Test Setup

### Prerequisites

- Two devices (or two browsers/incognito windows) labeled **Device A** and **Device B**
- Convex backend running and accessible
- Clerk authentication configured
- Clear understanding of localStorage keys: `sessions`, `solves`, `activeSessionId`

### Test Data Preparation

- Create 2-3 test sessions with different names (e.g., "Session A", "Session B", "Session C")
- Add 5-10 solves to each session with varied times
- Mix of timed and untimed solves
- Different F2L cases and groups

### Important Notes

- **Archived**: User-visible soft delete (can be restored via UI)
- **Deleted**: True soft delete (hidden from user, syncs across devices)
- **Active**: Non-archived, non-deleted sessions visible in UI

---

## Test Categories

### 1. Initial Sync (First Login)

#### Test 1.1: Fresh Login with Local Data

**Scenario**: User has local data in localStorage, logs in for first time

**Steps**:

1. Device A: Clear all Convex data (fresh deployment)
2. Device A: Create 2 sessions offline with some solves
3. Device A: Log in with Clerk
4. Wait for sync to complete (check console logs)
5. Device A: Verify sessions and solves appear in UI
6. Device B: Log in with same account
7. Device B: Verify all 2 sessions and solves appear

**Expected**:

- ✅ All local sessions uploaded to Convex
- ✅ All local solves uploaded to Convex
- ✅ Console shows: "Bulk upsert complete: X inserted, 0 updated, 0 skipped"
- ✅ Device B sees all data from Device A

**Failure Indicators**:

- ❌ Missing sessions or solves on Device B
- ❌ Duplicate sessions
- ❌ Console errors

---

#### Test 1.2: Login with Existing Convex Data

**Scenario**: User logs in on new device, Convex already has data

**Steps**:

1. Device A: Already has synced data in Convex
2. Device B: Fresh browser, no localStorage
3. Device B: Log in with same account
4. Wait for sync to complete

**Expected**:

- ✅ Device B pulls all sessions from Convex
- ✅ Device B pulls all solves from Convex
- ✅ Console shows: "Login sync complete, now have X sessions/solves"
- ✅ Active session auto-selected (first non-archived)

**Failure Indicators**:

- ❌ Empty session list
- ❌ Missing solves
- ❌ No active session selected

---

### 2. Page Refresh Sync

#### Test 2.1: Refresh with No Changes

**Scenario**: Page refresh when nothing changed remotely

**Steps**:

1. Device A: Log in and work normally
2. Device A: Refresh page (F5)
3. Check console logs

**Expected**:

- ✅ Console shows: "Page loaded with active session, pulling from Convex..."
- ✅ Same sessions and solves visible
- ✅ Same active session selected
- ✅ No duplicate data

---

#### Test 2.2: Refresh After Remote Changes

**Scenario**: Device B makes changes, Device A refreshes

**Steps**:

1. Device A: Log in, view sessions (e.g., sees "Session A", "Session B")
2. Device B: Log in, create "Session C"
3. Device B: Add 5 solves to "Session C"
4. Device A: Refresh page (F5)

**Expected**:

- ✅ Device A now sees "Session A", "Session B", "Session C"
- ✅ Device A sees all 5 solves in "Session C"
- ✅ Console shows: "Page load sync complete, now have 3 sessions"

**Failure Indicators**:

- ❌ "Session C" doesn't appear on Device A
- ❌ Solves missing
- ❌ Sync errors in console

---

### 3. Session Operations

#### Test 3.1: Create Session While Online

**Scenario**: Create session when logged in

**Steps**:

1. Device A: Log in
2. Device A: Create new session "Online Session"
3. Device A: Add session settings (change case selection, etc.)
4. Device B: Refresh page

**Expected**:

- ✅ Session appears immediately on Device A
- ✅ Device B sees "Online Session" after refresh
- ✅ Settings preserved correctly
- ✅ Console shows mutation success

---

#### Test 3.2: Create Session While Offline

**Scenario**: Create session without login, then log in

**Steps**:

1. Device A: Don't log in (offline mode)
2. Device A: Create "Offline Session"
3. Device A: Add 3 solves
4. Device A: Log in
5. Device B: Log in

**Expected**:

- ✅ "Offline Session" syncs to Convex on login
- ✅ All 3 solves sync to Convex
- ✅ Device B sees "Offline Session" with 3 solves

---

#### Test 3.3: Update Session Settings

**Scenario**: Change session settings across devices

**Steps**:

1. Device A: Update session settings (e.g., change train mode, case selection)
2. Device A: Make multiple changes
3. Device B: Refresh page
4. Device B: Check session settings

**Expected**:

- ✅ All settings changes visible on Device B
- ✅ Settings merged with DEFAULT_SETTINGS (new settings have defaults)
- ✅ No settings lost

---

#### Test 3.4: Update Session Name and Metadata

**Scenario**: Rename session, toggle favorite, change lastPlayedAt

**Steps**:

1. Device A: Rename "Session A" to "Renamed Session"
2. Device A: Toggle favorite on
3. Device A: Switch to this session (updates lastPlayedAt)
4. Device B: Refresh

**Expected**:

- ✅ Device B sees "Renamed Session"
- ✅ Favorite star visible
- ✅ Session sorted correctly by lastPlayedAt

---

#### Test 3.5: Duplicate Session

**Scenario**: Duplicate session across devices

**Steps**:

1. Device A: Duplicate "Session A" → creates "Session A (Copy)"
2. Check that settings are deep copied
3. Device B: Refresh

**Expected**:

- ✅ Device B sees both original and duplicated session
- ✅ Both sessions have same settings initially
- ✅ Modifying one doesn't affect the other
- ✅ Different UUIDs

---

### 4. Session Archiving (Soft Delete)

#### Test 4.1: Archive Session While Online

**Scenario**: Archive session when logged in

**Steps**:

1. Device A: Archive "Session A"
2. Device A: Verify it moves to archived list
3. Device B: Refresh

**Expected**:

- ✅ "Session A" no longer in active list on Device A
- ✅ "Session A" appears in archived list on Device A
- ✅ Device B shows same after refresh
- ✅ Can still view session stats

---

#### Test 4.2: Archive Session While Offline

**Scenario**: Archive session without login, then log in

**Steps**:

1. Device A: Log out
2. Device A: Archive "Session B"
3. Device A: Verify archived locally
4. Device A: Log in
5. Device B: Refresh

**Expected**:

- ✅ "Session B" syncs as archived to Convex
- ✅ Device B sees "Session B" in archived list
- ✅ Not in active list on either device

---

#### Test 4.3: Restore Archived Session

**Scenario**: Restore session from archive

**Steps**:

1. Device A: Archive "Session C"
2. Device B: Refresh (sees it archived)
3. Device A: Restore "Session C"
4. Device B: Refresh

**Expected**:

- ✅ "Session C" back in active list on Device A
- ✅ Device B sees it in active list after refresh
- ✅ `archived: false` in database

---

### 5. Session Hard Delete (True Soft Delete)

#### Test 5.1: Hard Delete While Online

**Scenario**: Permanently delete session when logged in

**Steps**:

1. Device A: Hard delete "Session A" (from session manager, delete permanently)
2. Device A: Verify it disappears from all lists
3. Device B: Refresh

**Expected**:

- ✅ "Session A" invisible on Device A (not in active or archived)
- ✅ "Session A" invisible on Device B after refresh
- ✅ Session still in localStorage but `deleted: true`
- ✅ Session still in Convex but `deleted: true`

---

#### Test 5.2: Hard Delete While Offline (Critical Test!)

**Scenario**: Delete session without login, then log in

**Steps**:

1. Device A: Log out completely
2. Device A: Hard delete "Session B"
3. Device A: Verify it disappears from UI
4. Check localStorage - session should still exist with `deleted: true`
5. Device A: Log in
6. Device B: Log in or refresh

**Expected**:

- ✅ Session marked `deleted: true` in Device A localStorage
- ✅ On login, deleted session syncs to Convex
- ✅ Device B doesn't see "Session B" anymore
- ✅ No resurrection of deleted session

**Failure Indicators**:

- ❌ Session removed from localStorage entirely (won't sync!)
- ❌ Session reappears on Device A after login
- ❌ Device B still sees "Session B"

---

#### Test 5.3: Hard Delete with Associated Solves

**Scenario**: Delete session that has solves

**Steps**:

1. Device A: Create session with 10 solves
2. Device A: Hard delete the session
3. Check that solves are also soft-deleted
4. Device B: Refresh

**Expected**:

- ✅ Session disappears from UI on both devices
- ✅ Solves for that session are soft-deleted
- ✅ Solves don't appear in statistics
- ✅ `deleteSolvesBySession` mutation called

---

### 6. Solve Operations

#### Test 6.1: Add Solve While Online

**Scenario**: Add solve when logged in

**Steps**:

1. Device A: Complete a case (add a solve)
2. Device A: Record time, recognition time, execution time
3. Device B: Refresh and check statistics

**Expected**:

- ✅ Solve appears in Device A statistics immediately
- ✅ Device B sees the solve after refresh
- ✅ All timing data preserved
- ✅ Associated with correct session

---

#### Test 6.2: Add Multiple Solves While Offline

**Scenario**: Add solves without login

**Steps**:

1. Device A: Log out
2. Device A: Complete 10 cases (add 10 solves)
3. Device A: Log in
4. Device B: Log in

**Expected**:

- ✅ All 10 solves sync to Convex
- ✅ Device B sees all 10 solves
- ✅ Correct timestamps
- ✅ Console shows: "Bulk upsert complete: 10 inserted..."

---

#### Test 6.3: Update Solve Time

**Scenario**: Modify a solve's time

**Steps**:

1. Device A: Edit a solve, change time from DNF to 5.23s
2. Device B: Refresh

**Expected**:

- ✅ Time updated on Device A
- ✅ Device B sees new time
- ✅ Statistics recalculate (avg, best)

---

#### Test 6.4: Delete Single Solve

**Scenario**: Remove a solve

**Steps**:

1. Device A: Delete a specific solve
2. Device B: Refresh

**Expected**:

- ✅ Solve removed from Device A statistics
- ✅ Solve removed from Device B after refresh
- ✅ Solve soft-deleted in Convex (`deleted: true`)

---

#### Test 6.5: Clear All Solves in Session

**Scenario**: Clear entire session statistics

**Steps**:

1. Device A: Open session with 20 solves
2. Device A: Clear all statistics
3. Device B: Refresh and check that session

**Expected**:

- ✅ All 20 solves removed from Device A
- ✅ Device B sees empty statistics after refresh
- ✅ All solves soft-deleted in Convex

---

### 7. Conflict Resolution

#### Test 7.1: Concurrent Session Updates

**Scenario**: Both devices modify same session simultaneously

**Steps**:

1. Device A: Log in, update "Session A" settings at 12:00:00
2. Device B: Log in, DON'T refresh, update "Session A" settings at 12:00:05
3. Device A: Refresh

**Expected**:

- ✅ Newer timestamp wins (Device B at 12:00:05)
- ✅ Device A sees Device B's changes after refresh
- ✅ No data corruption
- ✅ Console shows which update was skipped

---

#### Test 7.2: Offline Modification + Online Delete

**Scenario**: Device A modifies offline, Device B deletes online

**Steps**:

1. Device A: Log out, modify "Session A" settings
2. Device B: Hard delete "Session A"
3. Device A: Log in

**Expected**:

- ✅ Whichever has newer `lastModified` wins
- ✅ If delete is newer, session stays deleted
- ✅ If modification is newer, session is restored but modified
- ✅ Proper conflict resolution

---

#### Test 7.3: Duplicate Solve Prevention

**Scenario**: Ensure same solve doesn't get inserted twice

**Steps**:

1. Device A: Complete case, add solve with ID "abc-123"
2. Device A: Sync to Convex
3. Device B: Manually try to add solve with same ID "abc-123"

**Expected**:

- ✅ Convex rejects duplicate (ID already exists)
- ✅ Or timestamp comparison prevents duplicate
- ✅ No duplicate solves in statistics

---

### 8. Edge Cases

#### Test 8.1: Login on Fresh Device After Hard Delete

**Scenario**: Ensure deleted sessions don't resurrect

**Steps**:

1. Device A: Hard delete "Session X"
2. Device A: Sync completed
3. Fresh Device C: Log in for first time

**Expected**:

- ✅ Device C doesn't see "Session X"
- ✅ Deleted sessions filtered at query level
- ✅ No resurrection

---

#### Test 8.2: Rapid Session Creation

**Scenario**: Create many sessions quickly

**Steps**:

1. Device A: Create 10 sessions rapidly (script or fast clicking)
2. Device B: Refresh

**Expected**:

- ✅ All 10 sessions sync correctly
- ✅ No race conditions
- ✅ All have unique IDs
- ✅ Correct order by timestamp

---

#### Test 8.3: Session with No Active Sessions

**Scenario**: Delete all sessions except one, try to delete last

**Steps**:

1. Device A: Archive all sessions except one
2. Device A: Try to archive the last active session

**Expected**:

- ✅ Alert: "Cannot delete the last active session"
- ✅ Session remains active
- ✅ At least one session always accessible

---

#### Test 8.4: Active Session Selection After Delete

**Scenario**: Delete currently active session

**Steps**:

1. Device A: Set "Session A" as active
2. Device A: Hard delete "Session A"
3. Check which session becomes active

**Expected**:

- ✅ Switches to next non-deleted, non-archived session
- ✅ Graceful fallback selection
- ✅ activeSessionId updated

---

#### Test 8.5: Login/Logout Cycle

**Scenario**: Multiple login/logout cycles

**Steps**:

1. Device A: Log in, create session, log out
2. Device A: Log in again (same account)
3. Device A: Create another session, log out
4. Device A: Log in again

**Expected**:

- ✅ All sessions persist across cycles
- ✅ No duplicate sessions
- ✅ Correct sync on each login

---

#### Test 8.6: Very Large Data Set

**Scenario**: Test performance with many sessions and solves

**Steps**:

1. Create 50 sessions with 100 solves each (5000 total solves)
2. Log in on fresh device

**Expected**:

- ✅ Sync completes within reasonable time (<30 seconds)
- ✅ No timeout errors
- ✅ UI remains responsive
- ✅ All data intact

---

#### Test 8.7: Network Interruption During Sync

**Scenario**: Lose network mid-sync

**Steps**:

1. Device A: Start login process
2. Device A: Disable network during sync
3. Device A: Re-enable network
4. Device A: Retry

**Expected**:

- ✅ Graceful error handling
- ✅ Retry succeeds
- ✅ No partial sync corruption

---

#### Test 8.8: Convex Backend Update During Session

**Scenario**: Backend gets updated while user is online

**Steps**:

1. Device A: Working normally
2. Deploy new Convex functions
3. Device A: Continue working

**Expected**:

- ✅ Convex client reconnects automatically
- ✅ No data loss
- ✅ Sync continues working

---

### 9. Data Integrity Checks

#### Test 9.1: Settings Preservation

**Scenario**: Verify all settings fields preserve correctly

**Steps**:

1. Device A: Configure session with specific settings:
   - Train mode: drill
   - Case selection: specific cases only
   - Smart frequency: both options on
   - Hint settings: custom
2. Device B: Refresh and check all settings

**Expected**:

- ✅ All settings match exactly
- ✅ No fields lost or reset to defaults
- ✅ Deep nested objects preserved

---

#### Test 9.2: Solve Metadata Preservation

**Scenario**: Verify all solve fields preserve

**Steps**:

1. Device A: Add solve with all optional fields:
   - Time, recognition time, execution time
   - AUF, side, scramble selection
   - Train mode, session ID
2. Device B: Check solve details

**Expected**:

- ✅ All fields present and correct
- ✅ Timestamps accurate
- ✅ Optional fields preserved (not lost if undefined)

---

#### Test 9.3: UUID Uniqueness

**Scenario**: Ensure no ID collisions

**Steps**:

1. Create 1000 sessions/solves across both devices
2. Check for duplicate IDs

**Expected**:

- ✅ All IDs unique
- ✅ crypto.randomUUID() working correctly
- ✅ No collisions in Convex

---

### 10. Performance Tests

#### Test 10.1: Initial Sync Speed

**Scenario**: Measure sync time for typical usage

**Test Data**:

- 10 sessions
- 50 solves per session (500 total)

**Expected**:

- ✅ Login sync completes in <5 seconds
- ✅ Page load sync completes in <2 seconds
- ✅ No UI blocking

---

#### Test 10.2: Real-time Update Latency

**Scenario**: Measure time for changes to appear on other device

**Steps**:

1. Device A: Create session, note time
2. Device B: Refresh, note time when visible

**Expected**:

- ✅ Change visible within 1-2 seconds of refresh
- ✅ Convex mutation completes quickly

---

## Test Tracking Template

Use this template to track your testing progress:

```markdown
## Test Session: [Date] [Time]

### Environment

- Device A: [Browser/OS]
- Device B: [Browser/OS]
- Convex Deployment: [dev/prod]
- Network: [WiFi/Mobile/etc]

### Test Results

| Test ID | Test Name                       | Status  | Notes                   |
| ------- | ------------------------------- | ------- | ----------------------- |
| 1.1     | Fresh Login with Local Data     | ✅ PASS |                         |
| 1.2     | Login with Existing Convex Data | ❌ FAIL | Session X didn't appear |
| ...     | ...                             | ...     | ...                     |

### Issues Found

1. [Issue description]
   - Steps to reproduce
   - Expected vs Actual
   - Priority: High/Medium/Low

### Summary

- Tests Passed: X/Y
- Critical Issues: N
- Sync working: Yes/No
```

---

## Success Criteria

All tests should pass with:

- ✅ No data loss across devices
- ✅ No duplicate sessions or solves
- ✅ Deletions propagate correctly
- ✅ Conflict resolution works as expected
- ✅ Offline changes sync on login
- ✅ Page refreshes pull latest data
- ✅ No console errors (except expected warnings)
- ✅ UI remains responsive
- ✅ No infinite sync loops

## Known Limitations

- Deleted items stay in localStorage/Convex (not a bug, by design)
- Active session ID is local-only (not synced)
- 90-day cleanup not yet implemented
- No restore UI for hard-deleted sessions

---

## Debugging Tips

### Check localStorage

```javascript
// In browser console
localStorage.getItem('sessions');
localStorage.getItem('solves');
localStorage.getItem('activeSessionId');
```

### Check Convex Data

- Use Convex Dashboard
- Query sessions: `ctx.db.query("sessions").collect()`
- Query solves: `ctx.db.query("solves").collect()`

### Watch Console Logs

Look for these key messages:

- `[ConvexClerkSync] User logged in...`
- `[SessionsSyncService] Bulk upsert complete...`
- `[SessionState] Login sync complete, now have X sessions`
- `[StatisticsState] Page load sync complete, now have X solves`

### Common Issues

**Issue**: Session reappears after hard delete

- **Cause**: Session removed from array instead of marked deleted
- **Check**: localStorage should show `deleted: true`

**Issue**: Device B doesn't see changes

- **Cause**: Not refreshing, or page load sync not triggering
- **Check**: Console for "Page load sync" message

**Issue**: Duplicate sessions

- **Cause**: ID collision or sync running twice
- **Check**: IDs should be unique UUIDs

**Issue**: Settings reset to defaults

- **Cause**: Not merging with DEFAULT_SETTINGS
- **Check**: Settings object structure in Convex
