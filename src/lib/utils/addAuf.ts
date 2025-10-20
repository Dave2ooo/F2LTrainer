import { AUF, type Auf } from "$lib/types/trainCase";
import { mirrorAlg } from "./mirrorAlg";

const DUPLICATES: Record<Auf, Record<Auf, Auf>> = {
    "U": { "": "U", "U": "U2", "U2": "U'", "U'": "" },
    "U2": { "": "U2", "U": "U'", "U2": "", "U'": "U" },
    "U'": { "": "U'", "U": "", "U2": "U", "U'": "U2" },
    "": { "": "", "U": "U", "U2": "U2", "U'": "U'" }
} as const;

const MIRROR_AUF: Record<Auf, Auf> = {
    "U": "U'",
    "U2": "U2",
    "U'": "U",
    "": ""
} as const;

export function addAuf(scramble: string, alg: string): [string, string, Auf] {
    const aufIndex = Math.floor(Math.random() * AUF.length);
    const aufScramble = AUF[aufIndex];

    if (aufScramble === "")
        return [scramble, alg, aufScramble];

    const [finalScramble, finalAlg] = concatinateAuf(scramble, alg, aufScramble);


    console.log("Scramble before: ", scramble);
    console.log("Alg before: ", alg);
    console.log("aufScramble", aufScramble);
    console.log("Scramble after: ", finalScramble);
    console.log("Alg after: ", finalAlg);

    return [
        finalScramble,
        finalAlg,
        aufScramble
    ];
}


function concatinateAuf(scramble: string, alg: string, auf: Auf): [string, string] {
    if (auf === "")
        return [scramble, alg];

    // Scramble
    const scrambleList = scramble.trim().length ? scramble.trim().split(/\s+/) : [];
    const lastMoveScramble = scrambleList.at(-1);

    if (lastMoveScramble && isAuf(lastMoveScramble)) {
        scrambleList.pop();
        const mergedAufScramble = DUPLICATES[lastMoveScramble][auf];
        if (mergedAufScramble !== "")
            scrambleList.push(mergedAufScramble);
    } else {
        const mergedAufScramble = DUPLICATES[""][auf];
        if (mergedAufScramble !== "")
            scrambleList.push(mergedAufScramble);
    }

    // Alg
    const algList = alg.trim().length ? alg.trim().split(/\s+/) : [];
    const firstMoveAlg = algList.at(0);

    if (firstMoveAlg && isAuf(firstMoveAlg)) {
        console.log("First move is Auf:", firstMoveAlg);
        algList.shift();
        const mergedAufAlg = DUPLICATES[firstMoveAlg][MIRROR_AUF[auf]];
        if (mergedAufAlg !== "")
            algList.unshift(mergedAufAlg);
    } else {
        console.log("First move is not Auf:", firstMoveAlg);
        const mergedAufAlg = DUPLICATES[""][MIRROR_AUF[auf]];
        if (mergedAufAlg !== "")
            algList.unshift(mergedAufAlg);
    }

    return [scrambleList.join(" "), algList.join(" ")]
}

function isAuf(x: string): x is Auf {
    return x === "U" || x === "U2" || x === "U'";
}