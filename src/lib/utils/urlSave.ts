import type { TrainState } from '$lib/types/caseState';
import type { GroupId } from '$lib/types/group';
import { casesState, CASES_STATE_STORAGE_KEY } from '$lib/casesState.svelte';
import { casesStatic } from '$lib/casesStatic';
import { GROUP_IDS } from '$lib/types/group';
import { saveToLocalStorage } from './localStorage';

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
		});

		// Save to localStorage
		saveToLocalStorage(CASES_STATE_STORAGE_KEY, casesState);
	}

	// Reset URL in addressbar
	window.history.pushState({}, document.title, window.location.pathname);
}
