# Convex Sync Test Plan (Continuous Workflow)

This test plan is designed as a **single continuous workflow**. Perform these steps in order. The state created in each step is required for the subsequent steps.

## Prerequisites

1.  **Device A**: Primary browser (e.g., Chrome).
2.  **Device B**: Secondary browser (e.g., Firefox, Edge, or Incognito window).
3.  **Account**: A single Clerk account to log in to both devices.
4.  **Preparation**:
    - Open `localhost:5173` on both devices.
    - **Clear Local Storage** on both devices (DevTools -> Application -> Local Storage -> Clear All) to ensure a fresh start.

---

## Phase 1: The Fresh Start (Offline-First)

**Goal**: Verify that data created while unauthenticated (offline mode) is persisted locally.

1.  **Device A (Logged Out)**:
    - Create a session named **"Session Alpha"**.
    - Add **5 solves** to "Session Alpha" (Times: 10s, 11s, 12s, 13s, 14s).
    - Create a second session named **"Session Beta"**.
    - Add **3 solves** to "Session Beta".
    - Go to **Train View**: Select "Basic" group, modify Case #3 (Right) to **"Learning"**.
    - Set a Custom Algorithm for Case #3 (Right): `U R U' R'`.

2.  **Verification (Device A)**:
    - Refresh the page.
    - ✅ **"Session Alpha"** exists with 5 solves.
    - ✅ **"Session Beta"** exists with 3 solves.
    - ✅ Case #3 is still "Learning" with custom alg `U R U' R'`.

---

## Phase 2: Going Cloud (First Sync)

**Goal**: Verify that local data is pushed to the cloud upon first login.

3.  **Device A**:
    - Click **Log In** and authenticate.
    - Wait for the "Syncing..." indicator to finish.

4.  **Verification (Device A Console)**:
    - Check console for: `[ConvexClerkSync] User authenticated, starting sync...`
    - Check console for: `[SessionsSyncService] Bulk upsert complete...`

5.  **Device B (The Sentinel)**:
    - Open App (Logged Out). Verify it is empty (default state).
    - Click **Log In** and authenticate with the **same account**.

6.  **Verification (Device B)**:
    - ✅ **"Session Alpha"** appears with 5 solves.
    - ✅ **"Session Beta"** appears with 3 solves.
    - ✅ **Case #3** shows "Learning" status and custom alg `U R U' R'`.

---

## Phase 3: Cross-Device Collaboration

**Goal**: Verify that changes made on one device propagate to the other.

7.  **Device B (Active)**:
    - Rename **"Session Alpha"** to **"Session Alpha Updated"**.
    - **Delete "Session Beta"** (Soft delete).
    - Create a new session **"Session Gamma"**.
    - Add **1 solve** to "Session Gamma" (Time: 5s).
    - Change Case #3 to **"Finished"**.

8.  **Device A (Passive)**:
    - Refresh the page.

9.  **Verification (Device A)**:
    - ✅ **"Session Alpha Updated"** is visible (name changed).
    - ✅ **"Session Beta"** is **GONE** (deleted).
    - ✅ **"Session Gamma"** is visible with 1 solve.
    - ✅ **Case #3** is "Finished".

---

## Phase 4: Offline Divergence & Persistence

**Goal**: Verify that deletions and creations made while offline/logged-out are persisted and synced correctly later.

10. **Device A (Going Dark)**:
    - **Log Out**. (This simulates being offline/unauthenticated).
    - **Delete "Session Gamma"** locally.
    - Go to **"Session Alpha Updated"**:
      - Delete the solve with time **10s**.
      - Add a new solve with time **99s**.

11. **Persistence Check (Device A)**:
    - **Refresh the page** (Stay logged out).
    - ✅ **"Session Gamma"** should NOT reappear.
    - ✅ **"Session Alpha Updated"** count should be 5 (4 original + 1 new). Start count was 5, delete 1, add 1.

12. **Reconnection (Device A)**:
    - **Log In**.
    - Wait for sync.

13. **Verification (Device B)**:
    - Refresh Page.
    - ✅ **"Session Gamma"** is **GONE**.
    - ✅ **"Session Alpha Updated"** shows the **99s** solve.
    - ✅ The **10s** solve is **GONE**.

---

## Phase 5: Conflict Resolution (Last Write Wins)

**Goal**: Verify that concurrent edits are resolved by timestamp.

14. **Setup**:
    - Ensure both devices are looking at **"Session Alpha Updated"**.
    - Identify the solve with time **14s**.

15. **The Race**:
    - **Device A (Logged In)**: Edit the 14s solve -> Change time to **14.11s**. (Do not refresh B yet).
    - **Device B (Logged In)**: Edit the same 14s solve -> Change time to **14.99s**. (Perform this action 1-2 seconds _after_ Device A).

16. **Sync**:
    - Refresh Device A.
    - Refresh Device B.

17. **Verification**:
    - ✅ Both devices should show **14.99s** (The later edit wins).

---

## Phase 6: Solve Lifecycle & Cleanup

**Goal**: Verify detailed solve operations and local storage hygiene.

18. **Device A**:
    - Move all solves from **"Session Alpha Updated"** to a new session **"Archive Session"**.

19. **Device B**:
    - Refresh.
    - ✅ **"Session Alpha Updated"** is empty (0 solves).
    - ✅ **"Archive Session"** contains ~5 solves.

20. **Device A (Cleanup)**:
    - Delete **"Archive Session"**.
    - Delete **"Session Alpha Updated"**.

21. **Final Verification (Device B)**:
    - Refresh.
    - ✅ Session list is empty (or shows default empty session).
    - ✅ No stray solves remain.

---

## Phase 7: Storage Hygiene (Automated)

**Goal**: Verify old deleted items don't clog up storage.

22. **Device A**:
    - Open DevTools -> Console.
    - **Simulate old deleted SESSION**:
      ```javascript
      const oldSession = {
      	id: 'old-deleted-session',
      	name: 'Old',
      	deletedAt: Date.now() - 8 * 24 * 60 * 60 * 1000, // 8 days ago
      	settings: {}
      };
      const sessions = JSON.parse(localStorage.getItem('sessions') || '[]');
      sessions.push(oldSession);
      localStorage.setItem('sessions', JSON.stringify(sessions));
      ```
    - **Simulate old deleted SOLVE linked to the session**:
      ```javascript
      // Solves are stored in compressed format ('da' = deletedAt, 'sid' = sessionId)
      const linkedSolve = {
      	id: 'linked-solve',
      	gId: 'b', // basic
      	cId: 1,
      	t: 5000,
      	ts: Math.floor(Date.now() / 1000),
      	sid: 'old-deleted-session', // Linked to the deleted session
      	da: Date.now(),
      	m: 'c'
      };
      const solves = JSON.parse(localStorage.getItem('solves') || '[]');
      solves.push(linkedSolve);
      localStorage.setItem('solves', JSON.stringify(solves));
      ```
    - **Simulate standalone old deleted SOLVE**:
      ```javascript
      const standaloneSolve = {
      	id: 'standalone-deleted-solve',
      	gId: 'b',
      	cId: 2,
      	t: 6000,
      	ts: Math.floor((Date.now() - 8 * 24 * 60 * 60 * 1000) / 1000),
      	da: Date.now() - 8 * 24 * 60 * 60 * 1000, // 8 days ago
      	m: 'c'
      	// No 'sid' - standalone solve
      };
      solves.push(standaloneSolve);
      localStorage.setItem('solves', JSON.stringify(solves));
      ```
    - Refresh Page.

23. **Verification**:
    - Check Console logs.
    - ✅ Should see message: `[SessionState] Cleaned up 1 old deleted session(s)...`
    - ✅ Should see message: `[StatisticsState] Cleaned up 2 old deleted solve(s)...`
    - Check localStorage `sessions`.
    - ✅ The 'old-deleted-session' should be removed.
    - Check localStorage `solves`.
    - ✅ Both 'linked-solve' and 'standalone-deleted-solve' should be removed.

---

## Summary of Success

If you reached this point:

1.  **Offline Creation** works.
2.  **Cloud Sync** works.
3.  **Cross-Device** updates work.
4.  **Offline Deletions** persist and sync.
5.  **Conflict Resolution** favors the latest change.
6.  **Cleanup** logic is functional.
