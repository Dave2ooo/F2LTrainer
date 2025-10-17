import type { StickerColor } from "$lib/types/stickering";

type RotationMap = Record<StickerColor, Record<StickerColor, string>>;
export const ROTATION_ALG = {
    yellow: { red: "y", orange: "y'", blue: "y2", green: "", yellow: "", white: "" },
    white: { red: "z2 y'", orange: "z2 y", blue: "z2 y2", green: "z2", yellow: "", white: "" },
    red: { green: "z", blue: "z y2", white: "z y", yellow: "z y'", red: "", orange: "" },
    orange: { green: "z'", blue: "z' y2", white: "z' y'", yellow: "z' y", red: "", orange: "" },
    green: { red: "x' y", orange: "x' y'", white: "x'", yellow: "x' y2", green: "", blue: "" },
    blue: { red: "x y", orange: "x y'", white: "x y2", yellow: "x", green: "", blue: "" },
} as const satisfies RotationMap;

