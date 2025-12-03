import type { Side } from '$lib/types/Side';
import type { AlgorithmSelection } from '$lib/types/caseState';
import { mirrorAlg } from './mirrorAlg';
import type { CustomAlgorithm } from '$lib/types/caseState';

export function syncAlgorithms(
	algorithmSelection: AlgorithmSelection,
	customAlgorithm: CustomAlgorithm,
	side: Side
): [AlgorithmSelection, CustomAlgorithm] {
	// Ensure objects have required properties initialized
	if (!algorithmSelection || typeof algorithmSelection !== 'object') {
		algorithmSelection = { left: 0, right: 0 };
	}
	if (!customAlgorithm || typeof customAlgorithm !== 'object') {
		customAlgorithm = { left: '', right: '' };
	}
	
	// Initialize missing properties with defaults
	if (algorithmSelection.left === undefined) algorithmSelection.left = 0;
	if (algorithmSelection.right === undefined) algorithmSelection.right = 0;
	if (customAlgorithm.left === undefined) customAlgorithm.left = '';
	if (customAlgorithm.right === undefined) customAlgorithm.right = '';
	
	if (side === 'left') {
		algorithmSelection.right = algorithmSelection.left;
		if (algorithmSelection.left === null) customAlgorithm.right = mirrorAlg(customAlgorithm.left);
	} else {
		algorithmSelection.left = algorithmSelection.right;
		if (algorithmSelection.right === null) customAlgorithm.left = mirrorAlg(customAlgorithm.right);
	}
	return [algorithmSelection, customAlgorithm];
}
