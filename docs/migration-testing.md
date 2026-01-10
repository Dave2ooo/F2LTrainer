# LocalStorage Migration - Manual Testing Guide

This guide provides console scripts to manually test the localStorage migration from the old F2L Trainer format to the new Svelte app format.

## Prerequisites

- Open the app in a browser (e.g., `npm run dev` then navigate to `http://localhost:5173`)
- Open browser DevTools (F12) → Console tab

---

## Step 1: Clear localStorage and set old format data

Paste this script in the console:

```javascript
// Clear all localStorage
localStorage.clear();

// === BASIC GROUP ===
localStorage.setItem(
	'basic_caseSelection',
	'[1,1,2,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]'
);
localStorage.setItem(
	'basic_algorithmSelection',
	'[2,0,0,0,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]' // case 5 has index 5 (out of bounds = custom)
);
localStorage.setItem(
	'basic_algorithmSelectionLeft',
	'[1,0,0,0,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]' // case 5 has index 6 (out of bounds = custom)
);
localStorage.setItem(
	'basic_identicalAlgorithm',
	'[false,true,true,false,false,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true]'
);
localStorage.setItem(
	'basic_customAlgorithms',
	JSON.stringify([
		'',
		"d' L' U L",
		'',
		'',
		"F2 (L' U' L U) F2", // case 5 custom algorithm right
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		''
	])
);
localStorage.setItem(
	'basic_customAlgorithmsLeft',
	JSON.stringify([
		'',
		'',
		"F U F'",
		'',
		"R' U L' U' R L U2' L' U L", // case 5 custom algorithm left
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		''
	])
);

// === BASIC BACK GROUP ===
localStorage.setItem(
	'basicBack_caseSelection',
	'[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]'
);
localStorage.setItem(
	'basicBack_algorithmSelection',
	'[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]'
);
localStorage.setItem(
	'basicBack_algorithmSelectionLeft',
	'[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]'
);
localStorage.setItem(
	'basicBack_identicalAlgorithm',
	'[true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true]'
);
localStorage.setItem(
	'basicBack_customAlgorithms',
	JSON.stringify([
		'',
		'',
		'',
		"y (R U R')",
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		''
	])
);
localStorage.setItem(
	'basicBack_customAlgorithmsLeft',
	JSON.stringify([
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		''
	])
);

// === ADVANCED GROUP ===
localStorage.setItem(
	'advanced_caseSelection',
	'[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]'
);
localStorage.setItem(
	'advanced_algorithmSelection',
	'[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]'
);
localStorage.setItem(
	'advanced_algorithmSelectionLeft',
	'[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]'
);
localStorage.setItem(
	'advanced_identicalAlgorithm',
	'[true,true,true,true,false,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true]'
);
localStorage.setItem(
	'advanced_customAlgorithms',
	JSON.stringify([
		'',
		'',
		'',
		"L F' L2' U L U2' F",
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		''
	])
);
localStorage.setItem(
	'advanced_customAlgorithmsLeft',
	JSON.stringify([
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		"D R U' R' U R U' R' D'"
	])
);

// === EXPERT GROUP ===
localStorage.setItem('expert_caseSelection', '[1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0]');
localStorage.setItem('expert_algorithmSelection', '[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]');
localStorage.setItem('expert_algorithmSelectionLeft', '[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]');
localStorage.setItem(
	'expert_identicalAlgorithm',
	'[true,true,true,true,true,true,true,true,true,true,true,true,true,true,false,true,true]'
);
localStorage.setItem(
	'expert_customAlgorithms',
	JSON.stringify(['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''])
);
localStorage.setItem(
	'expert_customAlgorithmsLeft',
	JSON.stringify(['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''])
);

console.log('✅ Old localStorage set! Total keys:', localStorage.length);
```

---

## Step 2: Reload the page

```javascript
location.reload();
```

The migration will run automatically on page load.

---

## Step 3: Verify migration results

Paste this script to check if migration worked correctly:

```javascript
const data = JSON.parse(localStorage.getItem('casesState'));
console.log('=== MIGRATION RESULTS ===');

// Basic group
console.log('\n📦 BASIC:');
console.log('Case 1 trainState:', data?.basic?.[1]?.trainState, '(expected: learning)');
console.log(
	'Case 1 algSelection:',
	data?.basic?.[1]?.algorithmSelection,
	'(expected: {left:1, right:2})'
);
console.log('Case 1 identicalAlg:', data?.basic?.[1]?.identicalAlgorithm, '(expected: false)');
console.log(
	'Case 2 customAlg.right:',
	data?.basic?.[2]?.customAlgorithm?.right,
	"(expected: d' L' U L)"
);
console.log('Case 3 trainState:', data?.basic?.[3]?.trainState, '(expected: finished)');
console.log(
	'Case 3 customAlg.left:',
	data?.basic?.[3]?.customAlgorithm?.left,
	"(expected: F U F')"
);
console.log('Case 7 trainState:', data?.basic?.[7]?.trainState, '(expected: finished)');

// Case 5: custom algorithm selected (algorithmSelection should be null)
console.log(
	'Case 5 algSelection.right:',
	data?.basic?.[5]?.algorithmSelection?.right,
	'(expected: null)'
);
console.log(
	'Case 5 algSelection.left:',
	data?.basic?.[5]?.algorithmSelection?.left,
	'(expected: null)'
);
console.log(
	'Case 5 customAlg.right:',
	data?.basic?.[5]?.customAlgorithm?.right,
	"(expected: F2 (L' U' L U) F2)"
);
console.log(
	'Case 5 customAlg.left:',
	data?.basic?.[5]?.customAlgorithm?.left,
	"(expected: R' U L' U' R L U2' L' U L)"
);

// BasicBack group
console.log('\n📦 BASIC BACK:');
console.log(
	'Case 4 customAlg.right:',
	data?.basicBack?.[4]?.customAlgorithm?.right,
	"(expected: y (R U R'))"
);

// Expert group
console.log('\n📦 EXPERT:');
console.log('Case 1 trainState:', data?.expert?.[1]?.trainState, '(expected: learning)');
console.log('Case 15 identicalAlg:', data?.expert?.[15]?.identicalAlgorithm, '(expected: false)');
console.log('Case 16 trainState:', data?.expert?.[16]?.trainState, '(expected: finished)');

// Advanced group
console.log('\n📦 ADVANCED:');
console.log(
	'Case 4 customAlg.right:',
	data?.advanced?.[4]?.customAlgorithm?.right,
	"(expected: L F' L2' U L U2' F)"
);
console.log('Case 5 identicalAlg:', data?.advanced?.[5]?.identicalAlgorithm, '(expected: false)');
console.log(
	'Case 60 customAlg.left:',
	data?.advanced?.[60]?.customAlgorithm?.left,
	"(expected: D R U' R' U R U' R' D')"
);

// Check old keys are deleted
console.log(
	'\n🗑️ OLD KEYS REMAINING:',
	Object.keys(localStorage).filter(
		(k) => k.includes('_caseSelection') || k.includes('_algorithmSelection')
	)
);
console.log('✅ Migration marker:', localStorage.getItem('V2MigrationComplete'));
```

---

## Expected Results

| Check                                | Expected Value                |
| ------------------------------------ | ----------------------------- |
| `basic[1].trainState`                | `"learning"`                  |
| `basic[1].algorithmSelection`        | `{left: 1, right: 2}`         |
| `basic[1].identicalAlgorithm`        | `false`                       |
| `basic[2].customAlgorithm.right`     | `"d' L' U L"`                 |
| `basic[3].trainState`                | `"finished"`                  |
| `basic[3].customAlgorithm.left`      | `"F U F'"`                    |
| `basic[7].trainState`                | `"finished"`                  |
| `basic[5].algorithmSelection.right`  | `null`                        |
| `basic[5].algorithmSelection.left`   | `null`                        |
| `basic[5].customAlgorithm.right`     | `"F2 (L' U' L U) F2"`         |
| `basic[5].customAlgorithm.left`      | `"R' U L' U' R L U2' L' U L"` |
| `basicBack[4].customAlgorithm.right` | `"y (R U R')"`                |
| `expert[1].trainState`               | `"learning"`                  |
| `expert[15].identicalAlgorithm`      | `false`                       |
| `expert[16].trainState`              | `"finished"`                  |
| `advanced[4].customAlgorithm.right`  | `"L F' L2' U L U2' F"`        |
| `advanced[5].identicalAlgorithm`     | `false`                       |
| `advanced[60].customAlgorithm.left`  | `"D R U' R' U R U' R' D'"`    |
| Old keys remaining                   | `[]` (empty)                  |
| Migration marker                     | `"true"`                      |

---

## Reset and Re-test

To reset and test again:

```javascript
localStorage.clear();
location.reload();
```

Then repeat from Step 1.
