# Legacy Data Migration System

This directory contains the migration system for converting localStorage data from the old version of F2LTrainer to the new version.

## Overview

The migration system automatically detects and converts legacy data format to the new format on app initialization.

## Files

### `migrateLegacyData.ts`

The main migration utility that handles:

- Detection of legacy data format
- Conversion of all global settings and case data
- Validation and cleanup of legacy keys

### `migrateLegacyData.test.ts`

Comprehensive unit tests (19 tests) covering:

- Individual conversion functions
- Global state conversion
- Case state conversion for all groups
- Real-world data migration

### `migrateLegacyData.integration.test.ts`

Integration tests (4 tests) verifying:

- Legacy data detection
- Complete migration workflow
- Legacy data cleanup

## Migration Mappings

### Global Settings

| Legacy Key            | New Key                    | Conversion                                      |
| --------------------- | -------------------------- | ----------------------------------------------- |
| `viewSelection`       | `view`                     | "0" → "select", "1" → "train"                   |
| `hintAlgSelection`    | `trainHintAlgorithm`       | "0" → "step", "1" → "allAtOnce", "2" → "always" |
| `hintImageSelection`  | `trainHintShowCube`        | "0" → false, "1"/"2" → true                     |
| `stickeringSelection` | `trainHintStickering`      | "0" → "f2l", "1" → "fully"                      |
| `leftSelection`       | `trainSideSelection.left`  | "true"/"false" → boolean                        |
| `rightSelection`      | `trainSideSelection.right` | "true"/"false" → boolean                        |
| `aufSelection`        | `trainAddAuf`              | "true"/"false" → boolean                        |
| `crossColorSelection` | `crossColor`               | string → validated StickerColor                 |
| `frontColorSelection` | `frontColor`               | string → validated StickerColor                 |
| `trainStateSelection` | `trainStateSelection`      | Array → object with keys                        |
| `trainGroupSelection` | `trainGroupSelection`      | Array → object with keys                        |

### Case Data

For each group (basic, basicBack, advanced, expert):

| Legacy Pattern                   | New Structure                                      |
| -------------------------------- | -------------------------------------------------- |
| `{group}_caseSelection`          | `trainState` (0→unlearned, 1→learning, 2→finished) |
| `{group}_algorithmSelection`     | `algorithmSelection.right`                         |
| `{group}_algorithmSelectionLeft` | `algorithmSelection.left`                          |
| `{group}_customAlgorithms`       | `customAlgorithm.right`                            |
| `{group}_customAlgorithmsLeft`   | `customAlgorithm.left`                             |
| `{group}_identicalAlgorithm`     | `identicalAlgorithm`                               |
| `{group}_solveCounter`           | `solveCount`                                       |
| `{group}_collapse`               | `categoriesOpenedObj[group]` (inverted!)           |

### Ignored Legacy Keys

These keys from the old version are not migrated:

- `considerAUFinAlg`
- `firstVisit`
- `timerEnabled`
- `recapEnabled`

## How It Works

1. **Detection**: On app startup, `globalState.svelte.ts` checks for legacy keys in localStorage
2. **Migration**: If found, converts all data to new format using `migrateLegacyData()`
3. **Storage**: Saves converted data to new format keys (`globalState`, `casesState`)
4. **Cleanup**: Removes all legacy keys from localStorage
5. **Loading**: App continues with migrated data

## Testing

Run the migration tests:

```bash
# Unit tests
npm run test:unit -- --run src/lib/utils/migrateLegacyData.test.ts

# Integration tests
npm run test:unit -- --run src/lib/utils/migrateLegacyData.integration.test.ts

# All migration tests
npm run test:unit -- --run src/lib/utils/migrateLegacyData
```

## Example Usage

The migration runs automatically on app startup, but you can also use it manually:

```typescript
import {
	hasLegacyData,
	getLegacyDataFromLocalStorage,
	migrateLegacyData,
	clearLegacyData
} from '$lib/utils/migrateLegacyData';

// Check if legacy data exists
if (hasLegacyData()) {
	// Get all legacy data
	const legacyData = getLegacyDataFromLocalStorage();

	// Migrate it
	const { globalState, casesState } = migrateLegacyData(legacyData);

	// Use the migrated data...

	// Clear legacy keys
	clearLegacyData();
}
```

## Data Validation

The migration system includes validation:

- Algorithm indices are validated against algorithm pool size
- Colors are validated against known sticker colors
- All data structures are properly typed
- Missing or malformed data uses sensible defaults

## Notes

- Migration only runs once (when legacy data is detected)
- After successful migration, legacy keys are removed
- Migration errors are logged but don't crash the app
- Defaults are used for any missing or invalid data
