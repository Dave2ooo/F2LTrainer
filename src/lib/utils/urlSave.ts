import type { TrainState } from '$lib/types/caseState';
import type { GroupId } from '$lib/types/group';
import { casesState, CASES_STATE_STORAGE_KEY } from '$lib/casesState.svelte';
import { casesStatic } from '$lib/casesStatic';
import { GROUP_IDS } from '$lib/types/group';
import { saveToLocalStorage } from './localStorage';
import { MOVE_CHARS } from '$lib/types/moves';

const TRAIN_STATES_TRANSLATION: Readonly<Record<TrainState, number>> = {
	unlearned: 0,
	learning: 1,
	finished: 2
} as const;

const TRAIN_STATE_IDENTIFIER: Readonly<Record<GroupId, string>> = {
	basic: 'sb',
	basicBack: 'sbb',
	advanced: 'sa',
	expert: 'se'
};

const ALGORITHM_SELECTION_IDENTIFIER: Readonly<Record<GroupId, string>> = {
	basic: 'ab',
	basicBack: 'abb',
	advanced: 'aa',
	expert: 'ae'
};

const CUSTOM_ALGORITHM_IDENTIFIER: Readonly<Record<GroupId, string>> = {
	basic: 'cb',
	basicBack: 'cbb',
	advanced: 'ca',
	expert: 'ce'
};

// Create index mappings for encoding/decoding
const MOVE_TO_INDEX: Readonly<Record<string, number>> = Object.fromEntries(
	MOVE_CHARS.map((move, index) => [move, index])
);

const BASE = 62;
const BASE62_CHARSET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

/**
 * Encodes a base-3 number as a Base62 string.
 *
 * This function takes a base-3 number (represented as a string of digits),
 * converts it to a decimal integer, and then encodes that integer as a
 * Base62 string using a predefined character set.
 *
 * @param {string} base3Number - The base-3 number to encode.
 * @returns {string} - The encoded Base62 string.
 */
function encodeBase3ToBase62(base3Number: string): string {
	// Step 1: Convert base-3 string to decimal integer
	let decimalValue = BigInt(0);
	for (let i = 0; i < base3Number.length; i++) {
		decimalValue = decimalValue * BigInt(3) + BigInt(base3Number[i]);
	}

	// Step 2: Convert decimal to Base62 string
	let base62String = '';
	do {
		const remainder = decimalValue % BigInt(BASE);
		base62String = BASE62_CHARSET[Number(remainder)] + base62String;
		decimalValue = decimalValue / BigInt(BASE);
	} while (decimalValue > 0);

	return base62String;
}

/**
 * Decodes a Base62 string back into a base-3 number.
 * @param {string} base62String The encoded Base62 string.
 * @returns {string} The original base-3 number as a string.
 */
function decodeBase62ToBase3(base62String: string): string {
	// Step 1: Convert Base62 string to decimal integer
	let decimalValue = BigInt(0);
	for (let i = 0; i < base62String.length; i++) {
		const char = base62String[i];
		const digit = BigInt(BASE62_CHARSET.indexOf(char));
		decimalValue = decimalValue * BigInt(BASE) + digit;
	}

	// Step 2: Convert decimal integer back to base-3 string
	let base3Number = '';
	do {
		const remainder = decimalValue % BigInt(3);
		base3Number = remainder.toString() + base3Number;
		decimalValue = decimalValue / BigInt(3);
	} while (decimalValue > 0);

	return base3Number;
}

/**
 * Encodes a custom algorithm string to a compact Base62 representation.
 * Tokenizes the algorithm and maps each token to an index, then encodes as Base62.
 */
function encodeCustomAlgorithm(algorithm: string): string {
	if (!algorithm || algorithm.trim() === '') return '';

	// Split into tokens while preserving whitespace and parentheses
	const tokens = algorithm.split(/(\s+|\(|\))/);
	const indices: number[] = [];

	for (const token of tokens) {
		if (token === '') continue;
		const index = MOVE_TO_INDEX[token];
		if (index !== undefined) {
			indices.push(index);
		}
	}

	if (indices.length === 0) return '';

	// Convert indices to a base-N number string, then encode to Base62
	// Using base 57 (number of possible tokens)
	const baseN = MOVE_CHARS.length;
	let value = BigInt(0);
	for (const index of indices) {
		value = value * BigInt(baseN) + BigInt(index);
	}

	// Encode to Base62
	let encoded = '';
	do {
		const remainder = value % BigInt(BASE);
		encoded = BASE62_CHARSET[Number(remainder)] + encoded;
		value = value / BigInt(BASE);
	} while (value > 0);

	return encoded;
}

/**
 * Decodes a Base62 string back to a custom algorithm string.
 */
function decodeCustomAlgorithm(encoded: string, expectedLength: number): string {
	if (!encoded) return '';

	// Decode Base62 to value
	let value = BigInt(0);
	for (let i = 0; i < encoded.length; i++) {
		const char = encoded[i];
		const digit = BigInt(BASE62_CHARSET.indexOf(char));
		value = value * BigInt(BASE) + digit;
	}

	// Convert back to indices
	const baseN = MOVE_CHARS.length;
	const indices: number[] = [];
	let tempValue = value;

	while (tempValue > 0) {
		const remainder = Number(tempValue % BigInt(baseN));
		indices.unshift(remainder);
		tempValue = tempValue / BigInt(baseN);
	}

	// Convert indices back to tokens
	return indices.map((index) => MOVE_CHARS[index]).join('');
}

/**
 * Exports the current train states to a URL string.
 * Converts train states to base-3 numbers, then encodes them as Base62 strings.
 *
 * @returns {string} The full URL with encoded train state parameters
 */
export function exportToURL(): string {
	// Base URL of your site
	let baseURL = window.location.origin + window.location.pathname;

	const urlParams = new URLSearchParams();

	GROUP_IDS.forEach((groupId) => {
		// Get all case IDs for this group from casesStatic
		const caseIds = Object.keys(casesStatic[groupId])
			.map(Number)
			.sort((a, b) => a - b);

		// Convert train states to base-3 string
		const trainStateString = caseIds
			.map((caseId) => {
				const state = casesState[groupId][caseId];
				return TRAIN_STATES_TRANSLATION[state.trainState];
			})
			.join('');

		// Encode to Base62
		const base62String = encodeBase3ToBase62(trainStateString);

		// Add to URL parameters
		const identifier = TRAIN_STATE_IDENTIFIER[groupId];
		urlParams.set(identifier, base62String);

		// Export algorithm selections (only non-default values)
		const algorithmSelections: string[] = [];
		caseIds.forEach((caseId) => {
			const state = casesState[groupId][caseId];
			const algSelection = state.algorithmSelection;

			// Only save if not default (left: 0, right: 0)
			// Note: null is intentional and should be saved
			const isDefault = algSelection.left === 0 && algSelection.right === 0;

			if (!isDefault) {
				// Format: caseId.left.right (using . to separate values, - to separate cases)
				// If left and right are the same, only save one value: caseId.value
				// Use 'n' to represent null values
				const left = algSelection.left === null ? 'n' : algSelection.left.toString();
				const right = algSelection.right === null ? 'n' : algSelection.right.toString();

				if (left === right) {
					algorithmSelections.push(`${caseId}.${left}`);
				} else {
					algorithmSelections.push(`${caseId}.${left}.${right}`);
				}
			}
		});

		// Only add algorithm selection parameter if there are non-default values
		console.log('algorithmSelections', algorithmSelections.join('-'));
		if (algorithmSelections.length > 0) {
			const algIdentifier = ALGORITHM_SELECTION_IDENTIFIER[groupId];
			urlParams.set(algIdentifier, algorithmSelections.join('-'));
		}

		// Export custom algorithms (only when algorithmSelection is null)
		const customAlgorithms: string[] = [];
		caseIds.forEach((caseId) => {
			const state = casesState[groupId][caseId];
			const algSelection = state.algorithmSelection;
			const customAlg = state.customAlgorithm;

			// Check if either left or right uses custom algorithm (null selection)
			const hasCustomLeft = algSelection.left === null && customAlg.left !== '';
			const hasCustomRight = algSelection.right === null && customAlg.right !== '';

			if (hasCustomLeft || hasCustomRight) {
				const leftEncoded = hasCustomLeft ? encodeCustomAlgorithm(customAlg.left) : '';
				const rightEncoded = hasCustomRight ? encodeCustomAlgorithm(customAlg.right) : '';

				// Format: caseId.leftEncoded.rightEncoded
				// If both are the same, only save once
				if (hasCustomLeft && hasCustomRight && customAlg.left === customAlg.right) {
					customAlgorithms.push(`${caseId}.${leftEncoded}`);
				} else if (hasCustomLeft && hasCustomRight) {
					customAlgorithms.push(`${caseId}.${leftEncoded}.${rightEncoded}`);
				} else if (hasCustomLeft) {
					customAlgorithms.push(`${caseId}.${leftEncoded}.`);
				} else {
					customAlgorithms.push(`${caseId}..${rightEncoded}`);
				}
			}
		});

		// Only add custom algorithm parameter if there are custom algorithms
		if (customAlgorithms.length > 0) {
			const customIdentifier = CUSTOM_ALGORITHM_IDENTIFIER[groupId];
			urlParams.set(customIdentifier, customAlgorithms.join('-'));
		}
	});

	return baseURL + '?' + urlParams.toString();
}

/**
 * Imports the case selection from the URL parameters.
 * The case selection is extracted from the URL parameters and applied to casesState.
 * If no URL parameters are found, the function does nothing.
 * If the user confirms the import, the case selection is imported and the URL is reset.
 */
export function importFromURL(): void {
	const urlParams = new URLSearchParams(window.location.search);

	// Check if any of our identifiers are present in the URL
	const hasImportData = GROUP_IDS.some((groupId) => {
		const identifier = TRAIN_STATE_IDENTIFIER[groupId];
		return urlParams.has(identifier);
	});

	// If no URL parameters found, return
	if (!hasImportData) return;

	if (confirm('Import data from URL?')) {
		GROUP_IDS.forEach((groupId) => {
			const identifier = TRAIN_STATE_IDENTIFIER[groupId];
			const base62String = urlParams.get(identifier);
			if (base62String === null) return;

			let base3Number = decodeBase62ToBase3(base62String);

			// Get all case IDs for this group
			const caseIds = Object.keys(casesStatic[groupId])
				.map(Number)
				.sort((a, b) => a - b);

			// Fill list with 0s until it has the correct length
			// Reason: Leading zeroes were discarded when converted to number
			while (base3Number.length < caseIds.length) {
				base3Number = '0' + base3Number;
			}

			const trainStateValues = base3Number.split('');

			// Apply the train states to casesState
			caseIds.forEach((caseId, index) => {
				if (index < trainStateValues.length) {
					const stateValue = parseInt(trainStateValues[index]);
					// Find the corresponding TrainState
					const trainState = Object.entries(TRAIN_STATES_TRANSLATION).find(
						([, value]) => value === stateValue
					)?.[0] as TrainState | undefined;

					if (trainState) {
						casesState[groupId][caseId].trainState = trainState;
					}
				}
			});

			// Import algorithm selections
			const algIdentifier = ALGORITHM_SELECTION_IDENTIFIER[groupId];
			const algSelectionString = urlParams.get(algIdentifier);

			if (algSelectionString) {
				const algSelections = algSelectionString.split('-');

				algSelections.forEach((selection) => {
					const parts = selection.split('.');
					if (parts.length === 2) {
						// Format: caseId.value (both left and right are the same)
						const caseId = parseInt(parts[0]);
						const value = parts[1] === 'n' ? null : parseInt(parts[1]);

						if (casesState[groupId][caseId]) {
							casesState[groupId][caseId].algorithmSelection = {
								left: value,
								right: value
							};
							casesState[groupId][caseId].identicalAlgorithm = true;
						}
					} else if (parts.length === 3) {
						// Format: caseId.left.right (different values)
						const caseId = parseInt(parts[0]);
						// Parse 'n' as null, otherwise parse as number
						const left = parts[1] === 'n' ? null : parseInt(parts[1]);
						const right = parts[2] === 'n' ? null : parseInt(parts[2]);

						if (casesState[groupId][caseId]) {
							casesState[groupId][caseId].algorithmSelection = {
								left: left,
								right: right
							};
							casesState[groupId][caseId].identicalAlgorithm = left === right;
						}
					}
				});
			}

			// Import custom algorithms
			const customIdentifier = CUSTOM_ALGORITHM_IDENTIFIER[groupId];
			const customAlgString = urlParams.get(customIdentifier);

			if (customAlgString) {
				const customAlgorithms = customAlgString.split('-');

				customAlgorithms.forEach((customAlg) => {
					const parts = customAlg.split('.');
					if (parts.length >= 2) {
						const caseId = parseInt(parts[0]);

						if (casesState[groupId][caseId]) {
							if (parts.length === 2) {
								// Format: caseId.encoded (both left and right are the same)
								const decoded = decodeCustomAlgorithm(parts[1], 0);
								casesState[groupId][caseId].customAlgorithm = {
									left: decoded,
									right: decoded
								};
							} else if (parts.length === 3) {
								// Format: caseId.leftEncoded.rightEncoded
								const leftDecoded = parts[1] ? decodeCustomAlgorithm(parts[1], 0) : '';
								const rightDecoded = parts[2] ? decodeCustomAlgorithm(parts[2], 0) : '';
								casesState[groupId][caseId].customAlgorithm = {
									left: leftDecoded,
									right: rightDecoded
								};
							}
						}
					}
				});
			}
		});

		// Save to localStorage
		saveToLocalStorage(CASES_STATE_STORAGE_KEY, casesState);
	}

	// Reset URL in addressbar
	window.history.pushState({}, document.title, window.location.pathname);
}
