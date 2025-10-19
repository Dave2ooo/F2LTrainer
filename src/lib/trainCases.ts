import { GROUP_SCRAMBLES } from "./data"
import { mirrorAlg } from "./utils/mirrorAlg"
import type { GroupId } from "./types/group"
import type { StickerColor, StickerHidden } from "./types/stickering"
import { casesStatic } from "./casesStatic"
import { casesState, getCaseAlg, getCaseScramblePool } from "./casesState.svelte"
import type { Side } from "./types/casesStatic"
import { globalState } from "./globalState.svelte"
import type { Auf } from "./types/trainCase"
import { addAuf } from "./utils/addAuf"

export default class TrainCase {
    #groupId: GroupId
     #caseId: number
     #side: Side
     #crossColor: StickerColor | "random"
     #frontColor: StickerColor | "random"
     #stickerHidden: StickerHidden
     #scramble: string
     #alg: string
     #auf: Auf

    constructor(groupId: GroupId, caseId: number, side: Side, crossColor: StickerColor | "random", frontColor: StickerColor | "random", stickerHidden: StickerHidden) {
        this.#groupId = groupId;
        this.#caseId = caseId;
        this.#side = side;
        this.#crossColor = crossColor;
        this.#frontColor = frontColor;
        this.#stickerHidden = stickerHidden;
        this.#scramble = "";
        this.#alg = "";
        this.#auf = "";

        this.setRandomScramble();
        this.setAlg();
        this.addAuf();
    }

    private setRandomScramble() {
        const staticData = casesStatic[this.#groupId][this.#caseId];

        const scramblePool = getCaseScramblePool(staticData);
        this.#scramble = scramblePool[Math.floor(Math.random() * scramblePool.length)];

        if (this.#side === "left") {
            this.#scramble = mirrorAlg(this.scramble);
        }
    }

    private setAlg() {
        const staticData = casesStatic[this.#groupId][this.#caseId];
        const caseState = casesState[this.#groupId][this.#caseId];

        this.#alg = getCaseAlg(staticData, caseState, this.#side);
    }

    private addAuf() {
        if (globalState.trainAddAuf === false)
            return; // Do nothing if user selected no AUF

        const staticData = casesStatic[this.#groupId][this.#caseId];
        if (staticData.ignoreAUF)
            return; // Do nothing if case doesn't need AUF

        [this.#scramble, this.#alg, this.#auf] = addAuf(this.scramble, this.alg);
    }

    get groupId() { return this.#groupId; }
    get caseId() { return this.#caseId; }
    get side() { return this.#side; }
    get crossColor() { return this.#crossColor; }
    get frontColor() { return this.#frontColor; }
    get stickerHidden() { return this.#stickerHidden; }
    get scramble() { return this.#scramble; }
    get alg() { return this.#alg; }
    get auf() { return this.#auf; }
}