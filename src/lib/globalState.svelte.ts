import type { GlobalState } from "$lib/types/globalState"
import { GROUP_ALGORITHMS, GROUP_SCRAMBLES } from "./data"
import { GROUP_DEFINITIONS, GROUP_IDS, type GroupId } from "./types/group"


export const globalState: GlobalState = $state({
    crossColor: "white",
    frontColor: "red",
})

export interface CaseStatic {
    groupId: GroupId
    caseId: number
    algPool: string[]
    scramblePool: string[]
}

const collectCaseIds = (groupId: GroupId): number[] => {
    const definition = GROUP_DEFINITIONS[groupId];
    const fromCategories = definition.categories.flatMap(({ cases }) => cases);
    const fromAlgorithms = Object.keys(GROUP_ALGORITHMS[groupId] ?? {}).map(Number);
    const fromScrambles = Object.keys(GROUP_SCRAMBLES[groupId] ?? {}).map(Number);
    const sequential = Array.from({ length: definition.numberCases }, (_, index) => index + 1);

    return Array.from(new Set([...fromCategories, ...fromAlgorithms, ...fromScrambles, ...sequential])).sort(
        (a, b) => a - b,
    );
};

export const casesStatic = (() => {
    const entries = GROUP_IDS.map((groupId) => {
        const algorithms = GROUP_ALGORITHMS[groupId];
        const scrambles = GROUP_SCRAMBLES[groupId];

        const cases: CaseStatic[] = collectCaseIds(groupId).map((caseId) => ({
            groupId,
            caseId,
            algPool: algorithms[caseId] ?? [],
            scramblePool: scrambles[caseId] ?? [],
        }));

        return [groupId, cases] as const;
    });

    return Object.fromEntries(entries) as Record<GroupId, CaseStatic[]>;
})();
