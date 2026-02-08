# Convex Sync Test Plan

Comprehensive test plan for testing sessions and solves sync functionality across devices.

## Test Setup

### Prerequisites

- Two devices (or two browsers/incognito windows) labeled **Device A** and **Device B**
- Convex backend running and accessible
- Clerk authentication configured
- Clear understanding of localStorage keys: `sessions`, `solves`, `activeSessionId`, `casesState`

### Test Data Preparation

- Create 2-3 test sessions with different names (e.g., "Session A", "Session B", "Session C")
- Add 5-10 solves to each session with varied times
- Mix of timed and untimed solves
- Different F2L cases and groups
- Modify case states: change train states (unlearned → learning → finished)
- Set custom algorithms for various cases
- Change algorithm selections (left/right sides)

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
3. Device A: Modify case states (mark some cases as "learning" or "finished")
4. Device A: Set custom algorithms for 2-3 cases
5. Device A: Log in with Clerk
6. Wait for sync to complete (check console logs)
7. Device A: Verify sessions, solves, and case states appear in UI
8. Device B: Log in with same account
9. Device B: Verify all data appears including modified case states

**Expected**:

- ✅ All local sessions uploaded to Convex
- ✅ All local solves uploaded to Convex
- ✅ All modified case states uploaded to Convex
- ✅ Console shows: "Bulk upsert complete: X inserted, 0 updated, 0 skipped" for all data types
- ✅ Device B sees all data from Device A including case states

**Failure Indicators**:

- ❌ Missing sessions, solves, or case states on Device B
- ❌ Duplicate data
- ❌ Console errors
- ❌ Case states reset to defaults

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
- ✅ Device B pulls all case states from Convex
- ✅ Console shows: "Login sync complete, now have X sessions/solves/case states"
- ✅ Active session auto-selected (first non-archived)
- ✅ Case states reflect correct train states and algorithm selections

**Failure Indicators**:

- ❌ Empty session list
- ❌ Missing solves
- ❌ No active session selected
- ❌ Case states reset to defaults

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
- ✅ Same sessions, solves, and case states visible
- ✅ Same active session selected
- ✅ No duplicate data

---

#### Test 2.2: Refresh After Remote Changes

**Scenario**: Device B makes changes, Device A refreshes

**Steps**:

1. Device A: Log in, view sessions (e.g., sees "Session A", "Session B")
2. Device B: Log in, create "Session C"
3. Device B: Add 5 solves to "Session C"
4. Device B: Mark 3 F2L cases as "finished" and set custom algorithms
5. Device A: Refresh page (F5)

**Expected**:

- ✅ Device A now sees "Session A", "Session B", "Session C"
- ✅ Device A sees all 5 solves in "Session C"
- ✅ Device A sees the 3 cases marked as "finished" with custom algorithms
- ✅ Console shows: "Page load sync complete, now have 3 sessions"
- ✅ Console shows: "CaseStates sync complete"

**Failure Indicators**:

- ❌ "Session C" doesn't appear on Device A
- ❌ Solves missing
- ❌ Case state changes not reflected
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

#### Test 3.6: Move Solves between Sessions

**Scenario**: Move solves from one session to another

**Steps**:

1. Device A: Select "Session Source" with 5 solves
2. Device A: Select "Session Target" (empty)
3. Device A: Use "Move Solves" feature to move all solves from Source to Target
4. Device B: Refresh page

**Expected**:

- ✅ "Session Source" is now empty on Device B
- ✅ "Session Target" now has 5 solves on Device B
- ✅ Solve timestamps updated to reflect move (for sync)
- ✅ Console shows `moveSolvesToSession` mutation called

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
- ✅ `timestamp` field updated in Convex

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
- ✅ `deletedAt` and `timestamp` updated

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

### 7. Case States Operations

#### Test 7.1: Change Train State While Online

**Scenario**: Update case train state when logged in

**Steps**:

1. Device A: Log in
2. Device A: Navigate to case selection view
3. Device A: Change Case #1 from "unlearned" to "learning"
4. Device A: Change Case #5 from "learning" to "finished"
5. Device B: Refresh page

**Expected**:

- ✅ Train state changes appear immediately on Device A
- ✅ Device B sees updated train states after refresh
- ✅ Console shows batched update after 1-second delay
- ✅ Console shows: "Batch update complete: 0 inserted, 2 updated, 0 skipped"

**Failure Indicators**:

- ❌ Train states don't change on Device A
- ❌ Device B doesn't see changes after refresh
- ❌ Individual mutations instead of batched updates

---

#### Test 7.2: Set Custom Algorithm While Online

**Scenario**: Configure custom algorithms for cases

**Steps**:

1. Device A: Select Case #3 algorithm settings
2. Device A: Set custom algorithm for left side: "R U R' F R F'"
3. Device A: Set custom algorithm for right side: "F' R' F R U R U' R'"
4. Device A: Toggle "Use identical algorithm for both sides" off
5. Device B: Refresh and check Case #3 settings

**Expected**:

- ✅ Custom algorithms saved on Device A
- ✅ Device B sees exact custom algorithms after refresh
- ✅ "Identical algorithm" setting preserved as false
- ✅ Batched sync triggers within 1 second

---

#### Test 7.3: Algorithm Selection Changes While Online

**Scenario**: Change pre-defined algorithm selections

**Steps**:

1. Device A: For Case #2, change left algorithm selection from index 0 to index 2
2. Device A: Change right algorithm selection from index 0 to index 1
3. Device A: Wait for batch sync to complete
4. Device B: Refresh and check Case #2 algorithm selections

**Expected**:

- ✅ Algorithm indices updated correctly
- ✅ Device B shows same selections after refresh
- ✅ Custom algorithms remain empty (not affected by selection changes)
- ✅ Validation prevents out-of-bounds indices

---

#### Test 7.4: Rapid Case State Changes (Batch Testing)

**Scenario**: Make multiple changes quickly to test batching

**Steps**:

1. Device A: Log in
2. Device A: Quickly change train states for 10 different cases within 1 second
3. Device A: Wait 2 seconds (let batch complete)
4. Device B: Refresh

**Expected**:

- ✅ All 10 changes batched into single mutation
- ✅ Console shows: "Batch update complete: 0 inserted, 10 updated, 0 skipped"
- ✅ Device B sees all 10 changes after refresh
- ✅ No individual API calls (efficient batching)

---

#### Test 7.5: Case State Changes While Offline

**Scenario**: Modify case states without login, then sync

**Steps**:

1. Device A: Log out completely
2. Device A: Change 5 cases to "learning" state
3. Device A: Set custom algorithms for 3 cases
4. Device A: Change algorithm selections for 2 cases
5. Device A: Log in
6. Device B: Log in

**Expected**:

- ✅ All offline changes stored in localStorage
- ✅ On login, all changes sync to Convex
- ✅ Device B sees all offline changes
- ✅ Console shows bulk upsert with correct counts

---

#### Test 7.6: Mixed Online/Offline Case Changes

**Scenario**: Make changes online, go offline, make more changes, come back online

**Steps**:

1. Device A: Online - change Case #1 to "learning"
2. Device A: Wait for sync
3. Device A: Go offline - change Case #2 to "finished", set custom algorithm
4. Device A: Go online
5. Device B: Refresh

**Expected**:

- ✅ Case #1 already synced from step 1
- ✅ Case #2 and custom algorithm sync when back online
- ✅ Device B sees both changes
- ✅ No conflicts or data loss

---

#### Test 7.7: Identical Algorithm Toggle

**Scenario**: Test the identical algorithm feature

**Steps**:

1. Device A: Select Case #4
2. Device A: Set custom algorithm for left: "R U R'"
3. Device A: Enable "Use identical algorithm for both sides"
4. Device A: Verify right side shows mirrored version
5. Device B: Refresh and check Case #4

**Expected**:

- ✅ Right side automatically shows mirrored algorithm
- ✅ identicalAlgorithm flag set to true
- ✅ Device B shows same mirrored algorithm
- ✅ Changing left updates right (and vice versa)

---

#### Test 7.8: Algorithm Index Validation

**Scenario**: Test validation of algorithm selection indices

**Steps**:

1. Device A: Manually craft invalid case state with algorithmSelectionLeft: 999
2. Device A: Try to sync to Convex
3. Check console for validation errors

**Expected**:

- ✅ Convex rejects invalid index (>99)
- ✅ Console shows validation error
- ✅ Valid changes still sync
- ✅ Error logged but doesn't crash sync

---

### 8. Case States Conflict Resolution

#### Test 8.1: Concurrent Case State Updates

**Scenario**: Both devices modify same case simultaneously

**Steps**:

1. Device A: Change Case #7 train state to "learning" at 12:00:00
2. Device B: Change Case #7 custom algorithm at 12:00:05 (newer)
3. Device A: Refresh

**Expected**:

- ✅ Device B's change wins (newer lastModified timestamp)
- ✅ Device A sees Device B's custom algorithm after refresh
- ✅ Train state reverts to original (Device B's version is newer overall)
- ✅ Console shows which update was skipped

---

#### Test 8.2: Offline vs Online Case Changes

**Scenario**: Device A offline modifies, Device B online modifies same case

**Steps**:

1. Device A: Go offline
2. Device A: Change Case #8 to "finished" at 12:00:00
3. Device B: Change Case #8 custom algorithm at 12:00:10
4. Device A: Come online

**Expected**:

- ✅ Newer timestamp wins (Device B at 12:00:10)
- ✅ Device A's changes overridden by Device B's newer changes
- ✅ Proper conflict resolution based on lastModified

---

#### Test 8.3: Case State Reset Conflict

**Scenario**: One device resets case to defaults, other customizes it

**Steps**:

1. Device A: Heavily customize Case #9 (custom algorithms, finished state)
2. Device B: Reset Case #9 to defaults (unlearned, no custom algorithms)
3. Check which version persists

**Expected**:

- ✅ Whichever has newer lastModified timestamp wins
- ✅ No partial merging (entire case state is atomic)
- ✅ Consistent state across devices

---

### 9. Case States Edge Cases

#### Test 9.1: Case States on Fresh Device After Customization

**Scenario**: Ensure case customizations appear on new devices

**Steps**:

1. Device A: Customize 20 cases (various train states, algorithms)
2. Device A: Sync to Convex
3. Fresh Device C: Log in for first time

**Expected**:

- ✅ Device C gets all 20 customizations
- ✅ Default cases remain at defaults
- ✅ No missing or corrupted case states

---

#### Test 9.2: Algorithm Pool Boundary Testing

**Scenario**: Test algorithm selection at pool boundaries

**Steps**:

1. Device A: Find case with 3 algorithms in pool
2. Device A: Set selection to index 2 (last valid index)
3. Device A: Sync to Convex
4. Device B: Verify selection stays at index 2

**Expected**:

- ✅ Index 2 preserved correctly
- ✅ No out-of-bounds errors
- ✅ Correct algorithm displayed

---

#### Test 9.3: Case States with Special Characters

**Scenario**: Custom algorithms with special cube notation

**Steps**:

1. Device A: Set custom algorithm: "R U' R' D R' U R D' y' R' U R"
2. Device A: Include wide moves, rotations, etc.
3. Device B: Check algorithm preservation

**Expected**:

- ✅ All special characters preserved
- ✅ Exact string match on Device B
- ✅ No encoding/escaping issues

---

#### Test 9.4: Batch Timeout Edge Case

**Scenario**: Test batch timeout behavior

**Steps**:

1. Device A: Make case state change
2. Device A: Wait exactly 1 second
3. Device A: Before batch processes, make another change
4. Check batching behavior

**Expected**:

- ✅ First batch processes after 1 second
- ✅ Second change starts new batch timer
- ✅ All changes eventually sync
- ✅ No lost updates

---

#### Test 9.5: Logout During Pending Batch

**Scenario**: User logs out with pending case state changes

**Steps**:

1. Device A: Make 5 case state changes
2. Device A: Immediately log out (before 1-second batch timer)
3. Device A: Log back in
4. Device B: Check if changes synced

**Expected**:

- ✅ Pending changes flushed on logout
- ✅ All 5 changes synced to Convex
- ✅ Device B sees all changes
- ✅ No data loss from logout

---

#### Test 9.6: Very Large Algorithm Strings

**Scenario**: Test with extremely long custom algorithms

**Steps**:

1. Device A: Set custom algorithm with 500+ characters
2. Device A: Sync to Convex
3. Device B: Check algorithm preservation

**Expected**:

- ✅ Long algorithm syncs successfully
- ✅ No truncation
- ✅ Performance remains acceptable

---

### 10. Case States Data Integrity

#### Test 10.1: Case State Field Preservation

**Scenario**: Verify all case state fields preserve correctly

**Steps**:

1. Device A: Fully configure Case #10:
   - trainState: "finished"
   - algorithmSelectionLeft: 2
   - algorithmSelectionRight: null (use custom)
   - customAlgorithmLeft: "R U R'"
   - customAlgorithmRight: "F R F' U2 R' U' R"
   - identicalAlgorithm: false
2. Device B: Check all fields match exactly

**Expected**:

- ✅ All fields preserved exactly
- ✅ null values handled correctly
- ✅ Boolean flags accurate
- ✅ Numeric indices preserved

---

#### Test 10.2: Case States lastModified Accuracy

**Scenario**: Verify timestamp accuracy for conflict resolution

**Steps**:

1. Device A: Change case at specific time T1
2. Device B: Change same case at time T2 (later)
3. Check lastModified timestamps

**Expected**:

- ✅ Timestamps reflect actual change times
- ✅ Newer timestamp takes precedence
- ✅ Timestamps in milliseconds (precise)

---

#### Test 10.3: Default Case State Integrity

**Scenario**: Ensure unmodified cases maintain defaults

**Steps**:

1. Device A: Modify only Cases #1, #5, #10
2. Device B: Check Cases #2, #3, #4 remain at defaults

**Expected**:

- ✅ Unmodified cases not in sync data
- ✅ Default cases show correct initial state
- ✅ No pollution of default states

---

### 11. Conflict Resolution

#### Test 11.1: Concurrent Session Updates

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

#### Test 11.2: Offline Modification + Online Delete

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

#### Test 11.3: Duplicate Solve Prevention

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

#### Test 11.4: Concurrent Solve Updates (Timestamp Conflict)

**Scenario**: Edit same solve on two devices simultaneously

**Steps**:

1. Device A: Load solve "abc-123".
2. Device B: Load solve "abc-123".
3. Device A: Update time to 5.00s at 12:00:00 (offline or paused).
4. Device B: Update time to 6.00s at 12:00:05.
5. Sync both devices.

**Expected**:

- ✅ Solve "abc-123" has time 6.00s (newer timestamp wins)
- ✅ Device A updates to 6.00s after sync
- ✅ `timestamp` field updated to Device B's modification time

---

#### Test 11.5: Solve Move vs Delete Conflict

**Scenario**: Move solves on one device, delete them on another

**Steps**:

1. Device A: Move solves from "Session A" to "Session B" at 12:00:05.
2. Device B: Delete "Session A" (and its solves) at 12:00:00.
3. Sync both.

**Expected**:

- ✅ Move operation on Device A is newer (12:00:05 > 12:00:00)
- ✅ Solves persist in "Session B"
- ✅ Solves are NOT deleted (move timestamp > delete timestamp)
- ✅ "Session A" is deleted

---

### 12. Edge Cases

#### Test 12.1: Login on Fresh Device After Hard Delete

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

#### Test 12.2: Rapid Session Creation

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

#### Test 12.3: Session with No Active Sessions

**Scenario**: Delete all sessions except one, try to delete last

**Steps**:

1. Device A: Archive all sessions except one
2. Device A: Try to archive the last active session

**Expected**:

- ✅ Alert: "Cannot delete the last active session"
- ✅ Session remains active
- ✅ At least one session always accessible

---

#### Test 12.4: Active Session Selection After Delete

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

#### Test 12.5: Login/Logout Cycle

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

#### Test 12.6: Very Large Data Set

**Scenario**: Test performance with many sessions and solves

**Steps**:

1. Create 50 sessions with 100 solves each (5000 total solves)
2. Customize 200+ case states (various train states and algorithms)
3. Log in on fresh device

**Expected**:

- ✅ Sync completes within reasonable time (<30 seconds)
- ✅ No timeout errors
- ✅ UI remains responsive
- ✅ All data intact including customized case states

---

#### Test 12.7: Network Interruption During Sync

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

#### Test 12.8: Convex Backend Update During Session

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

#### Test 12.9: Clock Skew Handling

**Scenario**: Device has incorrect system time

**Steps**:

1. Device A: Set system time to 1 year in future.
2. Device A: Create a solve.
3. Device A: Sync.
4. Device B: (Correct time) Create a solve.
5. Device B: Check sort order.

**Expected**:

- ✅ Device A's solve appears in future (or top of list if sorted DESC)
- ✅ Sync still works (doesn't crash)
- ✅ User might see "weird" ordering but data is safe
- _Note: Conflict resolution relies on client time. Future time will always win conflicts._

---

#### Test 12.10: ID Collision on Offline Creation

**Scenario**: Two devices create item with same UUID (Statistical impossibility test)

**Steps**:

1. Device A: Offline, create Session with specific UUID "collision-test-id".
2. Device B: Offline, create Session with same UUID "collision-test-id".
3. Device A: Log in (syncs first).
4. Device B: Log in (syncs second).

**Expected**:

- ✅ Second sync detects existing ID
- ✅ Treats as "update" (merges or overwrites based on timestamp)
- ✅ NO duplicate entry in database
- ✅ System stability maintained

---

### 13. Data Integrity Checks

#### Test 13.1: Settings Preservation

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

#### Test 13.2: Solve Metadata Preservation

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

#### Test 13.3: UUID Uniqueness

**Scenario**: Ensure no ID collisions

**Steps**:

1. Create 1000 sessions/solves across both devices
2. Check for duplicate IDs

**Expected**:

- ✅ All IDs unique
- ✅ crypto.randomUUID() working correctly
- ✅ No collisions in Convex

---

### 14. Performance Tests

#### Test 14.1: Initial Sync Speed

**Scenario**: Measure sync time for typical usage

**Test Data**:

- 10 sessions
- 50 solves per session (500 total)
- 20 customized case states

**Expected**:

- ✅ Login sync completes in <5 seconds
- ✅ Page load sync completes in <2 seconds
- ✅ No UI blocking

---

#### Test 14.2: Real-time Update Latency

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
- ✅ No duplicate sessions, solves, or case states
- ✅ Deletions propagate correctly
- ✅ Case state changes sync reliably
- ✅ Batched case state updates work efficiently
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
localStorage.getItem('casesState');
localStorage.getItem('activeSessionId');
```

### Check Convex Data

- Use Convex Dashboard
- Query sessions: `ctx.db.query("sessions").collect()`
- Query solves: `ctx.db.query("solves").collect()`
- Query case states: `ctx.db.query("caseStates").collect()`

### Watch Console Logs

Look for these key messages:

- `[ConvexClerkSync] User logged in...`
- `[SessionsSyncService] Bulk upsert complete...`
- `[SessionState] Login sync complete, now have X sessions`
- `[StatisticsState] Page load sync complete, now have X solves`
- `[CasesState] Login sync complete`
- `[CaseStatesSyncService] Batch update complete: X inserted, Y updated, Z skipped`

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

**Issue**: Case state changes don't sync

- **Cause**: Batching not working, or localStorage persistence conflicts
- **Check**: Console for batch timeout messages, localStorage sync conflicts

**Issue**: Case states reset to defaults after sync

- **Cause**: Type validation failing, or conflict resolution overriding local changes
- **Check**: Convex schema validation errors, lastModified timestamps

**Issue**: Rapid case changes cause multiple API calls

- **Cause**: Batching timeout not working correctly
- **Check**: Console should show single batch update, not individual mutations
