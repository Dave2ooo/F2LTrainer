# Session Selection Testing Plan

## Test Date: _____________
## Tester: _____________

---

## 1. Session Creation & Management

### 1.1 Create New Session
- [✅] Click session dropdown in Train View
- [✅] Click "Create New Session"
- [✅] **Expected:** Session settings modal opens with "New Session" name
- [✅] **Expected:** Settings modal shows `isNew = true` behavior
- [✅] Change session name to something unique (e.g., "Test Session 1")
- [✅] Click Update/Save
- [✅] **Expected:** New session is created and becomes active
- [✅] **Expected:** Session appears in dropdown menu with active indicator dot
- [✅] **Result:** ✅ PASS / ❌ FAIL - Notes: _______________

### 1.2 Session Dropdown Display
- [✅] Open session dropdown
- [✅] **Expected:** No bullet points/markers before session names
- [✅] **Expected:** Proper gap between session name and active indicator dot
- [✅] **Expected:** Active session shows blue dot indicator
- [❌] **Expected:** Session names truncate properly if too long
- [❌] **Result:** ✅ PASS / ❌ FAIL - Notes: Long session names get shortened in the dropdown element but not when dropdown is expanded. So the individual items show the full name which protrudes out of the dropdown list.

### 1.3 Switch Between Sessions
- [✅] Create at least 2 sessions with different names
- [✅] Open session dropdown and select a different session
- [✅] **Expected:** Active indicator dot moves to selected session
- [✅] **Expected:** Train view regenerates cases based on new session settings
- [✅] **Expected:** Console logs "Generated X cases from Y unique candidates"
- [✅] **Result:** ✅ PASS / ❌ FAIL - Notes: _______________

### 1.4 Delete Session
- [✅] Create a disposable test session
- [✅] Open session settings for that session
- [✅] Click "Delete Session"
- [✅] **Expected:** Confirmation modal appears
- [✅] Confirm deletion
- [✅] **Expected:** Session is archived (soft delete)
- [✅] **Expected:** Session no longer appears in dropdown
- [✅] Try to delete the last remaining session
- [✅] **Expected:** Alert/error preventing deletion of last session
- [✅] **Result:** ✅ PASS / ❌ FAIL - Notes: localstorage shows archived: true

---

## 2. Case Selection - Group Mode

### 2.1 Group Mode Selection
- [✅] Open session settings
- [✅] Navigate to "Case Selection" tab
- [✅] **Expected:** "Case Selection Mode" shows "Group" and "Individual" buttons
- [✅] Ensure "Group" mode is selected (blue)
- [✅1] **Expected:** F2L Groups and Training State checkboxes are visible
- [✅] **Expected:** Individual case selector is NOT visible
- [✅] **Result:** ✅ PASS / ❌ FAIL - Notes: _______________

### 2.2 Group Selection Filtering
- [✅] In Group mode, select only "Basic" group
- [✅] Uncheck all other groups
- [✅] Select only "Learning" training state
- [✅] Save and close settings
- [✅] **Expected:** Only cases from Basic group with Learning state are generated
- [✅] **Expected:** Console shows correct candidate count
- [✅] Switch to different group combinations and verify
- [✅] **Result:** ✅ PASS / ❌ FAIL - Notes: _______________

---

## 3. Case Selection - Individual Mode

### 3.1 Switch to Individual Mode
- [✅] Open session settings → "Case Selection" tab
- [✅] Click "Individual" button
- [✅] **Expected:** Group/State selection UI disappears
- [✅] **Expected:** Individual case selector with tabs appears
- [✅] **Result:** ✅ PASS / ❌ FAIL - Notes: _______________

### 3.2 Group Tab Counts
- [✅] Observe all 4 group tabs (Basic, Basic Back, Advanced, Expert)
- [✅] **Expected:** Each tab shows count in format "GroupName (X/Y)" where:
  - X = number of selected cases
  - Y = total cases in that group
- [✅] **Expected:** Initially all show (0/total)
- [✅] Select some cases in Basic group
- [✅] **Expected:** Basic tab count updates to (selected/total)
- [✅] Switch to other tabs
- [✅] **Expected:** Other tabs still show (0/total) if nothing selected
- [✅] **Result:** ✅ PASS / ❌ FAIL - Notes: _______________

### 3.3 Category Counts
- [✅] Select a group tab (e.g., Basic)
- [✅] **Expected:** Categories appear as accordion items
- [✅] **Expected:** Each category header shows "(X/Y selected)"
- [✅] **Expected:** Initially all show (0/total)
- [✅] Click a category to expand it
- [✅] Select some cases using checkboxes
- [✅] **Expected:** Category count updates immediately
- [✅] **Expected:** Group tab count also updates
- [✅] **Result:** ✅ PASS / ❌ FAIL - Notes: _______________

### 3.4 Individual Case Selection
- [✅] Expand a category
- [✅] **Expected:** Cases displayed with TwistyPlayer cubes
- [✅] Select individual cases via checkboxes
- [⚠️] Close and reopen settings modal
- [⚠️] **Expected:** Selected cases remain checked (persistence)
- [✅] Save settings and start training
- [✅] **Expected:** Only selected cases appear in training queue
- [✅] Navigate through several cases
- [✅] **Expected:** All cases match your individual selection
- [✅] **Result:** ✅ PASS / ❌ FAIL - Notes: When closing the settings modal, the selected cases are not persisted but that is expected behavior.

### 3.5 Individual Case Selector - Visual Colors
- [✅] In session settings → "Visuals" tab, change cross color to Yellow
- [✅] Change front color to Blue
- [✅] Go back to "Case Selection" tab (Individual mode)
- [✅] **Expected:** TwistyPlayer cubes in selector show Yellow cross and Blue front
- [✅] Change colors again
- [✅] **Expected:** Case selector cubes update to reflect new colors
- [✅] **Result:** ✅ PASS / ❌ FAIL - Notes: _______________

### 3.6 Select All / Deselect All (if implemented)
- [ ] Check if there's a "Select All" / "Deselect All" button per category
- [ ] If yes, test functionality
- [ ] **Expected:** Bulk selection works correctly
- [ ] **Expected:** Counts update accordingly
- [ ] **Result:** ✅ PASS / ❌ FAIL / ⏭️ N/A - Notes: N/A

---

## 4. Training Settings

### 4.1 Frequency Mode - Smart
- [✅] Open session settings → "Training" tab
- [✅] Set "Case Frequency" to "Smart Frequency"
- [✅] **Expected:** Options for "Prioritize Unsolved/Few Solves" and "Prioritize Slow Solves" appear
- [✅] Enable both smart frequency options
- [✅] Save and generate training queue
- [✅] **Expected:** Console shows "Smart Frequency Calculation" with weights table
- [not tested] **Expected:** Cases with fewer solves get higher weights (up to 3x)
- [not tested] **Expected:** Cases with slower times get higher weights
- [✅] **Result:** ✅ PASS / ❌ FAIL - Notes: _______________

### 4.2 Frequency Mode - Recap
- [✅] Set "Case Frequency" to "Recap Mode"
- [✅] **Expected:** Message appears: "Recap mode cycles through all selected cases once."
- [✅] Save and generate training queue
- [✅] **Expected:** Console does NOT show smart frequency calculation
- [✅] **Expected:** All selected cases appear exactly once (weight = 1)
- [✅] **Expected:** Cases are shuffled
- [✅] **Result:** ✅ PASS / ❌ FAIL - Notes: _______________

### 4.3 Cube Type Setting
- [✅] Set "Cube" to "Classic"
- [✅] Save and start training
- [✅] **Expected:** TrainClassic component renders
- [✅] Go back to settings, set "Cube" to "Smart Cube"
- [✅] **Expected:** TrainClassicSmart component renders (if smart cube connected)
- [✅] **Result:** ✅ PASS / ❌ FAIL - Notes: _______________

### 4.4 Training Mode Setting
- [✅] Set "Training Mode" to "Classic"
- [✅] **Expected:** Classic training interface appears
- [✅] Set "Training Mode" to "Drill"
- [✅] **Expected:** TrainDrill component renders
- [✅] **Result:** ✅ PASS / ❌ FAIL - Notes: _______________

### 4.5 Slots Selection
- [✅] Uncheck "Left Slots"
- [✅] Check only "Right Slots"
- [✅] Save and generate cases
- [✅] **Expected:** Only right-side cases appear in training
- [✅] Repeat with only "Left Slots" checked
- [✅] **Expected:** Only left-side cases appear
- [✅] **Result:** ✅ PASS / ❌ FAIL - Notes: _______________

### 4.6 Additional Options
- [✅] Enable "Add Random AUF"
- [✅] Start training and check scrambles
- [✅] **Expected:** Random U moves added to scrambles (for non-AUF-ignored cases)
- [✅] Disable "Show Timer"
- [✅] **Expected:** Timer is hidden during training
- [✅] Re-enable "Show Timer"
- [✅] **Expected:** Timer reappears
- [✅] **Result:** ✅ PASS / ❌ FAIL - Notes: _______________

---

## 5. Visual Settings

### 5.1 Hint Algorithm Settings
- [✅] Go to "Visuals" tab
- [✅] Set "Algorithm Hint" to "Reveal step-by-step"
- [✅] During training, click hint button
- [✅] **Expected:** Algorithm reveals one move at a time
- [✅] Change to "Reveal all at once"
- [✅] **Expected:** Full algorithm shows immediately
- [✅] Change to "Show all time"
- [✅] **Expected:** Algorithm always visible
- [✅] **Result:** ✅ PASS / ❌ FAIL - Notes: _______________

### 5.2 Stickering Style
- [✅] Set "Stickering Style" to "F2L Stickering"
- [✅] **Expected:** Cubes show only F2L-relevant stickers
- [✅] Change to "Fully stickered"
- [✅] **Expected:** All cube faces are fully stickered
- [✅] **Result:** ✅ PASS / ❌ FAIL - Notes: _______________

### 5.3 Cross Color Selection
- [✅] Select multiple cross colors (e.g., White, Yellow, Green)
- [✅] **Expected:** Front color selection is disabled/cleared
- [✅] **Expected:** Message: "Randomized when multiple cross colors selected"
- [✅] Select only one cross color (e.g., White)
- [✅] **Expected:** Front color options become available
- [✅] **Expected:** Opposite color (Yellow) and same color (White) are disabled
- [✅] **Result:** ✅ PASS / ❌ FAIL - Notes: _______________

### 5.4 Front Color Selection
- [✅] With cross = White selected, try to select Yellow (opposite)
- [✅] **Expected:** Yellow is disabled
- [✅] Select a valid front color (e.g., Red)
- [✅] Start training
- [✅] **Expected:** Cases display with White cross and Red front
- [✅] **Result:** ✅ PASS / ❌ FAIL - Notes: _______________

### 5.5 Back View Option
- [✅] Enable "Show Back Slots (Floating View)"
- [✅] **Expected:** Checkbox is checked
- [✅] During training
- [not implemented] **Expected:** Back slots are visible (if implemented)
- [✅] Disable the option
- [✅] **Expected:** Back slots hidden
- [✅] **Result:** ✅ PASS / ❌ FAIL / ⏭️ N/A - Notes: not implemented

---

## 6. Session Settings Persistence

### 6.1 Save and Reload
- [✅] Configure a session with specific settings:
  - Individual mode with 5 specific cases selected
  - Cross color: Blue
  - Front color: Orange
  - Smart frequency enabled
  - Drill mode
- [✅] Save and close modal
- [✅] Refresh the browser page
- [✅] Reopen session settings
- [✅] **Expected:** All settings are preserved exactly as configured
- [✅] **Expected:** selectedCases still shows correct selections
- [✅] **Result:** ✅ PASS / ❌ FAIL - Notes: _______________

### 6.2 Multiple Sessions Persistence
- [✅] Create 3 different sessions with very different settings
Test Session 2: Group: basic, Expert; State: Unlearned & Finished; Cube: Classic; Training Mode: Classic; Slots: Right; Add Random AUF: Yes; Show Timer: No, Cross color: white & red
Test Session 3: Individual: basic, Expert Cases 17, 27; Cube: Smart Cube; Training Mode: Drill; Slots: Left; Add Random AUF: No; Show Timer: Yes, Cross color: Blue; Front Color: Orange, Red
- [✅] Refresh browser
- [✅] Switch between all 3 sessions
- [✅] **Expected:** Each session maintains its own unique settings
- [✅] **Expected:** Training queue regenerates correctly for each
- [✅] **Result:** ✅ PASS / ❌ FAIL - Notes: _______________

---

## 7. Edge Cases & Error Handling

### 7.1 No Cases Selected
- [✅] Create a session with NO cases selected (Individual mode, nothing checked)
- [✅] Save and try to train
- [✅] **Expected:** Message: "No training cases available. Please select some cases first."
- [✅] **Expected:** No errors in console
- [✅] **Result:** ✅ PASS / ❌ FAIL - Notes: _______________

### 7.2 All Groups Unchecked (Group Mode)
- [✅] In Group mode, uncheck all F2L groups
- [✅] Save and try to train
- [✅] **Expected:** "No training cases available" message
- [✅] **Expected:** No crashes or errors
- [✅] **Result:** ✅ PASS / ❌ FAIL - Notes: _______________

### 7.3 Session Name Edge Cases
- [✅] Try creating a session with an empty name
- [⚠️] **Expected:** Should allow (or show validation) - Notes: Add a safeguard to prevent empty names
- [✅] Try a very long session name (100+ characters)
- [⚠️] **Expected:** Name truncates properly in dropdown - Notes: Name only truncates when selected. In the dropdown list, the name is shown in full. Either truncate it or add a line break so it fits into the dropdown list. 
- [✅] Try special characters in name (#, @, emoji, etc.)
- [✅] **Expected:** Name saves and displays correctly
- [⚠️] **Result:** ✅ PASS / ❌ FAIL - Notes: Add validation and truncation or line break

### 7.4 Rapid Session Switching
- [✅] Create 5+ sessions
- [✅] Rapidly switch between them (every 1-2 seconds)
- [✅] **Expected:** No crashes or race conditions
- [✅] **Expected:** Queue regenerates correctly each time
- [✅] **Expected:** UI remains responsive
- [✅] **Result:** ✅ PASS / ❌ FAIL - Notes: _______________

---

## 8. Console Output Verification

### 8.1 Case Generation Logs
- [✅] Open browser console
- [✅] Switch sessions or modify settings
- [✅] **Expected:** Log: "Generated X cases from Y unique candidates."
- [✅] In smart frequency mode
- [✅] **Expected:** "Smart Frequency Calculation" group with table showing:
  - Case IDs
  - Solve counts
  - Average times
  - Solve weights, time weights, final weights
- [ ] **Result:** ✅ PASS / ❌ FAIL - Notes: _______________

### 8.2 No Errors or Warnings
- [✅] Perform all above tests
- [✅] Monitor console throughout
- [✅] **Expected:** No red errors related to session/case selection
- [✅] **Expected:** No warnings about missing props or invalid states
- [✅] List any unexpected warnings here: _______________
- [✅] **Result:** ✅ PASS / ❌ FAIL - Notes: _______________

---

## 9. UI/UX Polish

### 9.1 Visual Consistency
- [✅] Check all modals, tabs, buttons for consistent styling
- [✅] **Expected:** Dark mode works correctly throughout
- [✅] **Expected:** Colors, fonts, spacing are consistent
- [✅] **Result:** ✅ PASS / ❌ FAIL - Notes: _______________

### 9.2 Responsive Behavior
- [✅] Test on mobile viewport (or resize browser to ~400px wide)
- [✅] **Expected:** Session dropdown adapts responsively
- [✅] **Expected:** Settings modal remains usable
- [✅] **Expected:** Individual case selector scrolls/wraps properly
- [✅] **Result:** ✅ PASS / ❌ FAIL - Notes: _______________

### 9.3 Loading States
- [✅] When switching sessions, observe any loading indicators
- [✅] **Expected:** Smooth transitions, no flash of unstyled content
- [✅] **Expected:** TwistyPlayers load without errors
- [✅] **Result:** ✅ PASS / ❌ FAIL - Notes: _______________

---

## 10. Integration with Training Flow

### 10.1 Training with Session Cases
- [✅] Select specific cases in Individual mode
- [✅] Start training
- [✅] Solve several cases and record statistics
- [✅] Check "Jump to solve" history feature
- [✅] **Expected:** Only cases from session appear in history
- [✅] **Expected:** Case navigation works correctly
- [✅] **Result:** ✅ PASS / ❌ FAIL - Notes: _______________

### 10.2 Smart Frequency in Action
- [✅] Configure Smart Frequency with both options enabled
- [✅] Train and solve ~20+ cases
- [✅] **Expected:** Cases with fewer solves appear more frequently
- [✅] **Expected:** Cases with slower times appear more often
- [✅] After many solves, check if distribution evens out
- [✅] **Result:** ✅ PASS / ❌ FAIL - Notes: _______________

---

## Summary

**Total Tests:** _____ / _____  
**Pass Rate:** _____ %  
**Critical Failures:** _____  
**Minor Issues:** _____  

### Overall Assessment:
- [ ] ✅ Ready for production
- [ ] ⚠️ Needs minor fixes
- [ ] ❌ Major issues found

### Notes & Recommendations:

When solving I get a warning. please fix:
Invalid keyframe value for property transform: translate(0.05332023884679014px, NaNpx) scale(1.048024298174697, NaN)
animation2.onfinish @ transitions.js:439
Show 1 more frame
Show less
