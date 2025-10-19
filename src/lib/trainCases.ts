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

class TrainCase {
    private groupId: GroupId
    private caseId: number
    private side: Side
    private crossColor: StickerColor | "random"
    private frontColor: StickerColor | "random"
    private stickerHidden: StickerHidden
    private scramble: string
    private alg: string
    private auf: Auf

    constructor(groupId: GroupId, caseId: number, side: Side, crossColor: StickerColor | "random", frontColor: StickerColor | "random", stickerHidden: StickerHidden) {
        this.groupId = groupId;
        this.caseId = caseId;
        this.side = side;
        this.crossColor = crossColor;
        this.frontColor = frontColor;
        this.stickerHidden = stickerHidden;
        this.scramble = "";
        this.alg = "";
        this.auf = "";

        this.setRandomScramble();
        this.setAlg();
        this.addAuf();
    }

    private setRandomScramble() {
        const staticData = casesStatic[this.groupId][this.caseId];

        const scramblePool = getCaseScramblePool(staticData);
        this.scramble = scramblePool[Math.floor(Math.random() * scramblePool.length)];

        if (this.side === "left") {
            this.scramble = mirrorAlg(this.scramble);
        }
    }

    private setAlg() {
        const staticData = casesStatic[this.groupId][this.caseId];
        const caseState = casesState[this.groupId][this.caseId];

        this.alg = getCaseAlg(staticData, caseState, this.side);
    }

    private addAuf() {
        if (globalState.trainAddAuf === false)
            return; // Do nothing if user selected no AUF

        const staticData = casesStatic[this.groupId][this.caseId];
        if (staticData.ignoreAUF)
            return; // Do nothing if case doesn't need AUF

        [this.scramble, this.alg, this.auf] = addAuf(this.scramble, this.alg);



    }
}