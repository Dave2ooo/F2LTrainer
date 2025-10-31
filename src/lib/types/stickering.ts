export const STICKER_COLORS = ['white', 'yellow', 'red', 'orange', 'blue', 'green'] as const;
export type StickerColor = (typeof STICKER_COLORS)[number];
export const STICKER_COLORS_WITH_RANDOM = [...STICKER_COLORS, 'random'] as const;

export type StickerHidden = 'fr' | 'fl' | 'br' | 'bl' | undefined;

export const OPPOSITE_COLOR = {
	yellow: 'white',
	white: 'yellow',
	red: 'orange',
	orange: 'red',
	green: 'blue',
	blue: 'green'
} as const satisfies Record<StickerColor, StickerColor>;

type EdgeIndexMap = Record<StickerColor, Partial<Record<StickerColor, number>>>;

type CornerIndexMap = Record<
	StickerColor,
	Partial<Record<StickerColor, Partial<Record<StickerColor, number>>>>
>;
const EDGE_STICKERING: EdgeIndexMap = {
	yellow: { green: 4, red: 5, blue: 6, orange: 7 },
	white: { green: 0, red: 1, blue: 2, orange: 3 },
	red: { white: 1, yellow: 5, green: 8, blue: 10 },
	orange: { white: 3, yellow: 7, green: 9, blue: 11 },
	green: { white: 0, yellow: 4, red: 8, orange: 9 },
	blue: { white: 2, yellow: 6, red: 10, orange: 11 }
};

const CORNER_STICKERING: CornerIndexMap = {
	yellow: {
		red: { blue: 7, green: 4 },
		orange: { blue: 6, green: 5 },
		green: { red: 4, orange: 5 },
		blue: { red: 7, orange: 6 }
	},
	white: {
		red: { green: 0, blue: 1 },
		orange: { green: 3, blue: 2 },
		green: { red: 0, orange: 3 },
		blue: { red: 1, orange: 2 }
	},
	red: {
		yellow: { green: 4, blue: 7 },
		white: { green: 0, blue: 1 },
		green: { yellow: 4, white: 0 },
		blue: { yellow: 7, white: 1 }
	},
	orange: {
		yellow: { green: 5, blue: 6 },
		white: { green: 3, blue: 2 },
		green: { yellow: 5, white: 3 },
		blue: { yellow: 6, white: 2 }
	},
	green: {
		yellow: { red: 4, orange: 5 },
		white: { red: 0, orange: 3 },
		red: { yellow: 4, white: 0 },
		orange: { yellow: 5, white: 3 }
	},
	blue: {
		yellow: { red: 7, orange: 6 },
		white: { red: 1, orange: 2 },
		red: { yellow: 7, white: 1 },
		orange: { yellow: 6, white: 2 }
	}
};

export const STICKERING: { readonly edges: EdgeIndexMap; readonly corners: CornerIndexMap } = {
	edges: EDGE_STICKERING,
	corners: CORNER_STICKERING
};

type SideColorMap = Record<
	StickerColor,
	Partial<Record<StickerColor, { right: StickerColor; left: StickerColor }>>
>;
// bottom color: front color: side: side color
export const SIDE_COLOR = {
	yellow: {
		yellow: undefined,
		white: undefined,
		red: { right: 'blue', left: 'green' },
		orange: { right: 'green', left: 'blue' },
		green: { right: 'red', left: 'orange' },
		blue: { right: 'orange', left: 'red' }
	},
	white: {
		yellow: undefined,
		white: undefined,
		red: { right: 'green', left: 'blue' },
		orange: { right: 'blue', left: 'green' },
		green: { right: 'orange', left: 'red' },
		blue: { right: 'red', left: 'orange' }
	},
	red: {
		yellow: { right: 'green', left: 'blue' },
		white: { right: 'blue', left: 'green' },
		red: undefined,
		orange: undefined,
		green: { right: 'white', left: 'yellow' },
		blue: { right: 'yellow', left: 'white' }
	},
	orange: {
		yellow: { right: 'blue', left: 'green' },
		white: { right: 'green', left: 'blue' },
		red: undefined,
		orange: undefined,
		green: { right: 'yellow', left: 'white' },
		blue: { right: 'white', left: 'yellow' }
	},
	green: {
		yellow: { right: 'orange', left: 'red' },
		white: { right: 'red', left: 'orange' },
		red: { right: 'yellow', left: 'white' },
		orange: { right: 'white', left: 'yellow' },
		green: undefined,
		blue: undefined
	},
	blue: {
		yellow: { right: 'red', left: 'orange' },
		white: { right: 'orange', left: 'red' },
		red: { right: 'white', left: 'yellow' },
		orange: { right: 'yellow', left: 'white' },
		green: undefined,
		blue: undefined
	}
} as const satisfies SideColorMap;
