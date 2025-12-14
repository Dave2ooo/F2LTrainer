import { Alg } from 'cubing/alg';

/**
 * Logs the normalized KPattern (with rotation removed) and checks if the cube is solved.
 * @param pattern - The current KPattern from TwistyPlayer
 * @param setupRotation - The rotation algorithm applied to the cube
 */
export async function logNormalizedKPattern(pattern: any, setupRotation: string) {
	try {
		const setupAlg = new Alg(setupRotation);
		const inverseRotation = setupAlg.invert();

		// Apply the inverse rotation to the current pattern
		const inverseTransformation = pattern.kpuzzle.algToTransformation(inverseRotation);
		const normalizedPattern = pattern.applyTransformation(inverseTransformation);

		console.log(
			'Normalized State (rotation removed) - Corners:',
			normalizedPattern.patternData.CORNERS
		);
		console.log(
			'Normalized State (rotation removed) - Edges:',
			normalizedPattern.patternData.EDGES
		);

		// Check if cube is fully solved
		const isSolved =
			normalizedPattern.patternData.CORNERS.pieces.every((v: number, i: number) => v === i) &&
			normalizedPattern.patternData.CORNERS.orientation.every((v: number) => v === 0) &&
			normalizedPattern.patternData.EDGES.pieces.every((v: number, i: number) => v === i) &&
			normalizedPattern.patternData.EDGES.orientation.every((v: number) => v === 0);
		if (isSolved) {
			console.log(
				'%cCUBE IS FULLY SOLVED!',
				'color: #fff; background: #1e90ff; font-size:1rem; font-weight: bold; padding: 8px 0; text-align: center;'
			);
		}
	} catch (e) {
		console.warn('Could not normalize KPattern:', e);
	}
}
