import { ROTATION_ALG } from "$lib/types/rotation";
import type { StickerColor } from "$lib/types/stickering";

function getRotationAlg(crossColor: StickerColor, frontColor: StickerColor) {
    return ROTATION_ALG[crossColor][frontColor];
}

export default getRotationAlg;