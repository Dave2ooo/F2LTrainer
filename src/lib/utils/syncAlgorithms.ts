import type { Side } from '$lib/types/Side';
import type { AlgorithmSelection } from '$lib/types/caseState';

export function syncAlgorithms(
	algorithmSelection: AlgorithmSelection,
	side: Side
): AlgorithmSelection {
	if (side === 'left') {
		algorithmSelection.right = algorithmSelection.left;
	} else {
		algorithmSelection.left = algorithmSelection.right;
	}
	return algorithmSelection;
}
