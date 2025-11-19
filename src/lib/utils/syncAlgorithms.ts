import type { Side } from '$lib/types/Side';
import type { AlgorithmSelection } from '$lib/types/caseState';
import { mirrorAlg } from './mirrorAlg';
import type { CustomAlgorithm } from '$lib/types/caseState';

export function syncAlgorithms(
	algorithmSelection: AlgorithmSelection,
	customAlgorithm: CustomAlgorithm,
	side: Side
): [AlgorithmSelection, CustomAlgorithm] {
	if (side === 'left') {
		algorithmSelection.right = algorithmSelection.left;
		if (algorithmSelection.left === null) customAlgorithm.right = mirrorAlg(customAlgorithm.left);
	} else {
		algorithmSelection.left = algorithmSelection.right;
		if (algorithmSelection.right === null) customAlgorithm.left = mirrorAlg(customAlgorithm.right);
	}
	return [algorithmSelection, customAlgorithm];
}
