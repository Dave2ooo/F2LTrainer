# Convex Sync Test Plan

Comprehensive test plan for testing sessions and solves sync functionality across devices.
This plan consolidates related scenarios into integrated workflows for efficiency.

## Test Setup

### Prerequisites

- Two devices (or two browsers/incognito windows) labeled **Device A** and **Device B**
- Clerk authentication configured
- Clear understanding of localStorage keys: `sessions`, `solves`, `activeSessionId`, `casesState`

### Test Data Preparation

- Create 2-3 test sessions with different names
- Add 5-10 solves to each session (mix of timed/untimed)
- Modify case states: change train states, set custom algorithms

---

## Part 1: Initial Sync & Basics

### Test 1: Full Sync on Login (Online & Offline Data)

**Scenario**: Verify that all locally created data (sessions, solves, case states) syncs upon login, and existing cloud data is pulled.

**Steps**:

1. **Device A (Offline Preparation)**:
   - Clear all data (fresh start).
   - Create 2 sessions ("Offline Session 1", "Offline Session 2").
   - Add 3 solves to each.
   - Modify 3 case states (change train state, set custom algs).
2. **Device A**: Log in. Wait for sync.
3. **Device B**: Log in with same account (fresh state).

**Expected**:

- ✅ Device B shows all sessions, solves, and case states created on Device A.
- ✅ Console logs show "Bulk upsert complete" on Device A.
- ✅ Console logs show "Login sync complete" on Device B.

### Test 2: Sync on Refresh & Remote Changes

**Scenario**: Verify that changes made on one device appear on another after a page refresh.

**Steps**:

1. **Device B**: Create "Session C", add 5 solves, change 2 case states.
2. **Device A**: Refresh page (F5).

**Expected**:

- ✅ Device A sees "Session C", its solves, and the case state changes.
- ✅ Active session remains selected (if valid).

---

## Part 2: Session Management (CRUD)

### Test 3: Session Lifecycle (Create, Edit, Duplicate)

**Scenario**: Test creation, modification, and duplication of sessions in various states.

**Steps**:

1. **Create (Online)**: Device A creates "Online Session". Device B refreshes -> Sees it.
2. **Edit**: Device A renames "Online Session" to "Renamed Session" and toggles "Favorite". Device B refreshes -> Sees changes.
3. **Duplicate**: Device A duplicates "Renamed Session". Device B refreshes -> Sees both original and copy (with deep-copied settings).
4. **Offline Creation**: Device A goes offline, creates "Offline Session 3", logs back in. Device B refreshes -> Sees "Offline Session 3".

**Expected**:

- ✅ All changes sync correctly to Device B.
- ✅ Settings are preserved across all operations.
- ✅ UUIDs are unique for duplicated sessions.

### Test 4: Session Deletion & Archiving (Soft vs Hard)

**Scenario**: Verify archiving (user-reversible) and hard deletion (permanent from UI, soft-delete in DB).

**Steps**:

1. **Archive**: Device A archives "Session A". Device B refreshes -> Sees "Session A" in archive list.
2. **Restore**: Device A restores "Session A". Device B refreshes -> Sees "Session A" in active list.
3. **Hard Delete (Online)**: Device A hard-deletes "Session A". Device B refreshes -> "Session A" disappears.
4. **Hard Delete (Offline - Critical)**:
   - Device A logs out.
   - Device A hard-deletes "Offline Session 1".
   - Device A logs in.
   - Device B refreshes.

**Expected**:

- ✅ Hard-deleted sessions disappear from UI on both devices.
- ✅ Offline deletions sync correctly upon login (no "resurrection" of deleted sessions).
- ✅ Associated solves are also soft-deleted in the backend.

---

## Part 3: Solve Management

### Test 5: Solve Lifecycle (Add, Edit, Delete, Move)

**Scenario**: Test the full lifecycle of a solve, including editing times, deleting, and moving between sessions.

**Steps**:

1. **Add**: Device A completes a solve (5.00s). Device B refreshes -> Sees solve.
2. **Edit**: Device A updates time to 4.50s. Device B refreshes -> Sees 4.50s.
3. **Move**: Device A moves all solves from "Session B" to "Renamed Session". Device B refreshes -> Sees solves in new session.
4. **Delete**: Device A deletes the solve. Device B refreshes -> Solve disappears.
5. **Clear Session**: Device A clears all solves in "Renamed Session". Device B refreshes -> Session is empty.

**Expected**:

- ✅ All operations sync correctly.
- ✅ Timestamps update on edit/move to ensure proper sync.
- ✅ Moved solves retain their data but change session ID.

### Test 6: Offline Solve Sync

**Scenario**: Accumulate solves offline and sync them in bulk.

**Steps**:

1. **Device A**: Log out.
2. **Device A**: Do 10 solves.
3. **Device A**: Log in.
4. **Device B**: Refresh.

**Expected**:

- ✅ All 10 solves appear on Device B with correct timestamps.
- ✅ No duplicate solves.

---

## Part 4: Case State Management (Learning Progress)

### Test 7: Case State Workflows (Batching & Consistency)

**Scenario**: Test modifying learning states and custom algorithms, including batching behavior.

**Steps**:

1. **Train State**: Device A changes Case #1 to "Learning". Device B refreshes -> Sees "Learning".
2. **Custom Algorithm**: Device A sets custom alg for Case #2 (Left: "R U R'", Right: "L' U' L"). Device B refreshes -> Sees algs.
3. **Identical Toggle**: Device A enables "Identical Algorithm" for Case #3. Device B refreshes -> Sees flag true, right alg matches left.
4. **Selection Change**: Device A changes selected algorithm index for Case #4. Device B refreshes -> Sees new index.
5. **Rapid Batching**: Device A changes 5 case states within 1 second. Device B refreshes -> Sees all 5 changes.

**Expected**:

- ✅ All changes sync accurately.
- ✅ Rapid changes are batched into fewer API calls.
- ✅ Complex algorithm strings (special chars) are preserved exactly.

---

## Part 5: Conflict Resolution & Edge Cases

### Test 8: Conflict Resolution (Timestamp Wins)

**Scenario**: Verify that the latest change (based on client timestamp) wins in conflict scenarios.

**Steps**:

1. **Concurrent Solve Edit**:
   - Device A loads Solve X (time 5.00s). Device B loads Solve X.
   - Device A changes time to 4.00s at 12:00:00 (freeze time/offline).
   - Device B changes time to 6.00s at 12:00:05.
   - Both sync.
   - **Result**: Solve X time is 6.00s (Device B wins).
2. **Concurrent Case Edit**:
   - Device A sets Case #1 to "Finished" at 12:00:00.
   - Device B sets Case #1 alg to "R U R'" at 12:00:05.
   - Both sync.
   - **Result**: Case #1 has alg "R U R'" (Device B wins).
3. **Move vs Delete**:
   - Device A moves solves from Session Y to Z at 12:00:05.
   - Device B deletes Session Y at 12:00:00.
   - Both sync.
   - **Result**: Solves are safetly in Session Z. Session Y is deleted.

### Test 9: Integrity & Edge Cases

**Scenario**: Test system limits and unusual conditions.

**Steps**:

1. **Clock Skew**: Set Device A time to +1 year. Create solve. Sync. Solve should exist (future timestamp wins).
2. **ID Collision**: (Theoretical) Two offline devices create same UUID. Sync handles it as an update (no crash).
3. **Large Data**: Create 50 sessions + 5000 solves. Sync on login. Verify performance (<5s).
4. **Network Drop**: Disable network during sync. Re-enable. Sync retries and succeeds.

---

## Success Criteria

- ✅ **No Data Loss**: All created data eventually reaches all devices.
- ✅ **Consistency**: Devices converge to the same state.
- ✅ **Resilience**: Offline operations and network interruptions are handled gracefully.
- ✅ **Performance**: UI remains responsive during sync.
