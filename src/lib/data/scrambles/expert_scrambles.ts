// Source https://github.com/Dave2ooo/F2LTrainer

import type { AlgorithmCollection } from '..';

export const expertScrambles: AlgorithmCollection = {
	1: ["R2 U' R2' U R2", "L2' U' L2 U L2'", "F' R' F2 R F"],
	2: ["f' R' U R f", "R' u' R u R", "L' u' L u L", "f' D' L D f"],
	3: ["L2' U L2 U' L2'", "R2 U R2' U' R2", "F L F2' L' F'"],
	4: ["f L U' L' f'", "L u L' u' L'", "R u R' u' R'", "f D R' D' f'"],
	5: ["L2' u' L2 u L2'", "R2 u R2' u' R2", "L2' u L2 u' L2'", "R2 u' R2' u R2"],
	6: [
		"(L' u' L) U (L' u L)",
		"(R u R') U' (R u' R')",
		"(L u L') U' (L u' L')",
		"(R' u' R) U (R' u R)"
	],
	7: [
		"R' F R2 U' R2' F' R",
		"L F' L2' U' L2 F L'",
		"(f' L' f) U' (L' U L)",
		"(R U R') U' (f R' f')",
		"(f R f') (L U2 L')"
	],
	8: [
		"L F' L2' U L2 F L'",
		"R' F R2 U R2' F' R",
		"(f R f') U (R U' R')",
		"(L' U' L) U (f' L f)",
		"(f' L' f) (R' U2' R)"
	],
	9: ["R (L U2 L') R'", "L' (R' U2 R) L"],
	10: ["L F2' L' F U' F", "(L F' L' U' F) U' (R U R')", "(L U' F' L' F) (L' U L)"],
	11: ["R' F2 R F' U F'", "(R' F R U F') U (L' U' L)", "(R' U F R F') (R U' R')"],
	12: ["(R' F R U' F') (R U' R')", "(L' U' L) U (S' L' S)"],
	13: ["(L F' L' U F) (L' U L)", "(R U R') U' (S R S')"],
	14: [
		"(L' U L) (M' U R U' r') (R U' R')",
		"(L U F' L' F) U2 (L' U' L)",
		"(L U L') (F U F') U' (L' U L)"
	],
	15: [
		"(R U' R') (M' U' L' U l) (L' U L)",
		"(R' U' F R F') U2 (R U R')",
		"(R' U' R) (F' U' F) U (R U' R')"
	],
	16: ["(R' F R U' F') U (R U' R')", "R U' R2' u' R' u R", "L U' L2' u' L' u L"],
	17: ["(L F' L' U F) U' (L' U L)", "L' U L2 u L u' L'", "R' U R2 u R u' R'"]
};
