import { AUF, type Auf } from "$lib/types/trainCase";
import { mirrorAlg } from "./mirrorAlg";

export function addAuf(scramble: string, alg: string): [string, string, Auf] {
    const aufIndex = Math.floor(Math.random() * AUF.length);

    const aufScramble = AUF[aufIndex];
    const aufAlg = mirrorAlg(aufScramble);

    return [
        scramble + " " + aufScramble,
        aufAlg + " " + alg,
        aufScramble
    ];
}