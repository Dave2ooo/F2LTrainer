export type Side = 'left' | 'right';

export const OPPOSITE_SIDE: Record<Side, Side> = {
	left: 'right',
	right: 'left'
};
