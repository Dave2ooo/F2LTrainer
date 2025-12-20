import { AUF, type Auf } from '$lib/types/trainCase';

const DUPLICATES: Record<Auf, Record<Auf, Auf>> = {
	U: { '': 'U', U: 'U2', U2: "U'", "U'": '' },
	U2: { '': 'U2', U: "U'", U2: '', "U'": 'U' },
	"U'": { '': "U'", U: '', U2: 'U', "U'": 'U2' },
	'': { '': '', U: 'U', U2: 'U2', "U'": "U'" }
} as const;

const MIRROR_AUF: Record<Auf, Auf> = {
	U: "U'",
	U2: 'U2',
	"U'": 'U',
	'': ''
} as const;

export function addAuf(scramble: string, alg: string): [string, string, Auf] {
	const aufIndex = Math.floor(Math.random() * AUF.length);
	const aufScramble = AUF[aufIndex];

	if (aufScramble === '') return [scramble, alg, aufScramble];

	const [finalScramble, finalAlg] = concatinateAuf(scramble, alg, aufScramble);

	// console.log("Scramble before: ", scramble);
	// console.log("Alg before: ", alg);
	// console.log("aufScramble", aufScramble);
	// console.log("Scramble after: ", finalScramble);
	// console.log("Alg after: ", finalAlg);

	return [finalScramble, finalAlg, aufScramble];
}

export function concatinateAuf(scramble: string, alg: string, auf: Auf): [string, string] {
	if (auf === '') return [scramble, alg];

	// Scramble
	const scrambleList = scramble.trim().length ? scramble.trim().split(/\s+/) : [];
	const lastMoveScramble = scrambleList.at(-1);

	if (lastMoveScramble && isAuf(lastMoveScramble)) {
		scrambleList.pop();
		const mergedAufScramble = DUPLICATES[lastMoveScramble][auf];
		if (mergedAufScramble !== '') scrambleList.push(mergedAufScramble);
	} else {
		const mergedAufScramble = DUPLICATES[''][auf];
		if (mergedAufScramble !== '') scrambleList.push(mergedAufScramble);
	}

	// Alg
	const algList = alg.trim().length ? alg.trim().split(/\s+/) : [];
	const firstMoveAlg = algList.at(0);

	// Check if the algorithm starts with a y-rotation (y or y')
	if (firstMoveAlg && (firstMoveAlg === 'y' || firstMoveAlg === "y'")) {
		// Get the y-rotation and remove it temporarily
		const yRotation = algList.shift()!;
		const secondMoveAlg = algList.at(0);

		// Check if the second move is a U move (without brackets)
		if (secondMoveAlg && isAuf(secondMoveAlg)) {
			// Remove the U move
			algList.shift();
			// Merge the U move with the mirrored AUF (to cancel the AUF added to scramble)
			const mergedAufAlg = DUPLICATES[secondMoveAlg][MIRROR_AUF[auf]];
			// Put y-rotation first, then the merged U move (if non-empty)
			if (mergedAufAlg !== '') {
				algList.unshift(mergedAufAlg);
			}
			algList.unshift(yRotation);
		} else {
			// No U move after y-rotation, or it's in a bracket
			// Just add the mirrored AUF after the y-rotation (to cancel the AUF added to scramble)
			const mergedAufAlg = DUPLICATES[''][MIRROR_AUF[auf]];
			if (mergedAufAlg !== '') algList.unshift(mergedAufAlg);
			algList.unshift(yRotation);
		}
	} else if (firstMoveAlg && isAuf(firstMoveAlg)) {
		// First move is a plain AUF (no bracket)
		algList.shift();
		const mergedAufAlg = DUPLICATES[firstMoveAlg][MIRROR_AUF[auf]];
		if (mergedAufAlg !== '') algList.unshift(mergedAufAlg);
	} else if (firstMoveAlg && firstMoveAlg.startsWith('(')) {
		// First move starts with a bracket - extract the move inside
		// Handle cases like '(U', '(U)', '(U2', "(U'", etc.
		let moveInsideBracket = firstMoveAlg.slice(1); // Remove opening bracket
		const hasClosingBracket = moveInsideBracket.endsWith(')');
		if (hasClosingBracket) {
			moveInsideBracket = moveInsideBracket.slice(0, -1); // Remove closing bracket
		}

		if (isAuf(moveInsideBracket)) {
			// Check if this is a repetition notation case (e.g., "(U R U' R')3")
			// Find the matching closing bracket and check if there's a number after it
			let closingBracketIdx = -1;
			let repetitionNumber = 0;

			if (hasClosingBracket) {
				// Closing bracket is in the first token - no repetition in this case
				algList.shift();
				const mergedAufAlg = DUPLICATES[moveInsideBracket][MIRROR_AUF[auf]];
				if (mergedAufAlg !== '') {
					algList.unshift('(' + mergedAufAlg + ')');
				}
				// Both brackets removed if moves cancel
			} else {
				// Find the closing bracket in later tokens
				for (let i = 0; i < algList.length; i++) {
					const idx = algList[i].indexOf(')');
					if (idx !== -1) {
						closingBracketIdx = i;
						// Check if there's a number after the closing bracket
						const afterBracket = algList[i].slice(idx + 1);
						const numMatch = afterBracket.match(/^(\d+)/);
						if (numMatch) {
							repetitionNumber = parseInt(numMatch[1], 10);
						}
						break;
					}
				}

				if (repetitionNumber > 1) {
					// This is a repetition notation - expand it
					// Extract the content inside brackets (excluding the first move we're processing)
					const bracketContent: string[] = [];
					let currentIdx = 1; // Start after the first token (which is '(U')

					while (currentIdx < algList.length && currentIdx <= closingBracketIdx) {
						const token = algList[currentIdx];
						if (currentIdx === closingBracketIdx) {
							// This is the token with the closing bracket - remove the bracket and number
							const idx = token.indexOf(')');
							if (idx > 0) {
								bracketContent.push(token.slice(0, idx));
							}
							// If idx === 0, token was just ')2' or similar, no content to add
						} else {
							bracketContent.push(token);
						}
						currentIdx++;
					}

					// Now reconstruct the algorithm
					// 1. Remove the original bracketed group from algList
					algList.splice(0, closingBracketIdx + 1);

					// 2. Merge the first AUF move
					const mergedAufAlg = DUPLICATES[moveInsideBracket][MIRROR_AUF[auf]];

					if (mergedAufAlg !== '') {
						// Moves don't cancel - add merged first instance with brackets FIRST
						const newRepNumber = repetitionNumber - 1;
						const firstInstanceTokens = ['(' + mergedAufAlg, ...bracketContent];

						// Reconstruct closing bracket (combine last token with closing bracket)
						if (firstInstanceTokens.length > 1) {
							const lastIdx = firstInstanceTokens.length - 1;
							firstInstanceTokens[lastIdx] = firstInstanceTokens[lastIdx] + ')';
						} else {
							// Only one token, add closing bracket
							firstInstanceTokens[0] = firstInstanceTokens[0] + ')';
						}

						// Add remaining repetitions if > 1, AFTER the first instance
						if (newRepNumber > 1) {
							const remainingTokens = ['(' + moveInsideBracket, ...bracketContent];
							const lastIdx = remainingTokens.length - 1;
							remainingTokens[lastIdx] = remainingTokens[lastIdx] + ')' + newRepNumber;
							algList.unshift(...firstInstanceTokens, ...remainingTokens);
						} else {
							// newRepNumber === 1, add without number
							const remainingTokens = ['(' + moveInsideBracket, ...bracketContent];
							const lastIdx = remainingTokens.length - 1;
							remainingTokens[lastIdx] = remainingTokens[lastIdx] + ')';
							algList.unshift(...firstInstanceTokens, ...remainingTokens);
						}
					} else {
						// Moves cancelled - add content without the first AUF, no brackets
						const newRepNumber = repetitionNumber - 1;

						// Add remaining repetitions first
						if (newRepNumber > 1) {
							const remainingTokens = ['(' + moveInsideBracket, ...bracketContent];
							const lastIdx = remainingTokens.length - 1;
							remainingTokens[lastIdx] = remainingTokens[lastIdx] + ')' + newRepNumber;
							algList.unshift(...remainingTokens);
						} else {
							// newRepNumber === 1, add without number
							const remainingTokens = ['(' + moveInsideBracket, ...bracketContent];
							const lastIdx = remainingTokens.length - 1;
							remainingTokens[lastIdx] = remainingTokens[lastIdx] + ')';
							algList.unshift(...remainingTokens);
						}

						// Then add content without brackets (first AUF cancelled)
						algList.unshift(...bracketContent);
					}
				} else {
					// No repetition notation - handle normally
					algList.shift();
					const mergedAufAlg = DUPLICATES[moveInsideBracket][MIRROR_AUF[auf]];
					if (mergedAufAlg !== '') {
						// Keep the bracket with the merged move
						algList.unshift('(' + mergedAufAlg);
					} else {
						// The moves cancelled - remove the opening bracket and the matching closing bracket
						// Find the first token containing ')' and remove one ')' from it
						for (let i = 0; i < algList.length; i++) {
							const idx = algList[i].indexOf(')');
							if (idx !== -1) {
								algList[i] = algList[i].slice(0, idx) + algList[i].slice(idx + 1);
								// If the token becomes empty after removing ')', remove it
								if (algList[i] === '') {
									algList.splice(i, 1);
								}
								break;
							}
						}
					}
				}
			}
		} else {
			// First move in bracket is not an AUF, just prepend the mirror AUF
			const mergedAufAlg = DUPLICATES[''][MIRROR_AUF[auf]];
			if (mergedAufAlg !== '') algList.unshift(mergedAufAlg);
		}
	} else {
		// First move is not an AUF and doesn't start with bracket
		const mergedAufAlg = DUPLICATES[''][MIRROR_AUF[auf]];
		if (mergedAufAlg !== '') algList.unshift(mergedAufAlg);
	}

	return [scrambleList.join(' '), algList.join(' ')];
}

function isAuf(x: string): x is Auf {
	return x === 'U' || x === 'U2' || x === "U'";
}
