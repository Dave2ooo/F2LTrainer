import { GROUP_ALGORITHMS, GROUP_SCRAMBLES } from "./data";
import type { CaseStatic } from "./types/casesStatic";
import { GROUP_DEFINITIONS, GROUP_IDS, type GroupId } from "./types/group";
import type { StickerHidden } from "./types/stickering";

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
        const definition = GROUP_DEFINITIONS[groupId];
        const algorithms = GROUP_ALGORITHMS[groupId] ?? {};
        const scrambles = GROUP_SCRAMBLES[groupId] ?? {};
        const categoryLookup = new Map<number, { name: string; categoryIndex: number }>();
        definition.categories.forEach(({ name, cases }, categoryIndex) => {
            cases.forEach((caseId) => {
                if (!categoryLookup.has(caseId)) {
                    categoryLookup.set(caseId, { name, categoryIndex });
                }
            });
        });

        const cases = Object.fromEntries(
            collectCaseIds(groupId).map((caseId) => {
                const category = categoryLookup.get(caseId);
                const pieceToHide = definition.piecesToHide?.[caseId - 1] as StickerHidden | undefined;

                return [
                    caseId,
                    {
                        groupId,
                        caseId,
                        algPool: algorithms[caseId] ?? [],
                        scramblePool: scrambles[caseId] ?? [],
                        categoryName: category?.name,
                        categoryIndex: category?.categoryIndex,
                        groupName: definition.name,
                        ignoreAUF: definition.ignoreAUF?.includes(caseId) ?? false,
                        pieceToHide,
                        caseName: definition.caseNumberMapping?.[caseId],
                    } satisfies CaseStatic,
                ];
            }),
        ) as Record<number, CaseStatic>;

        return [groupId, cases] as const;
    });

    return Object.fromEntries(entries) as Record<GroupId, Record<number, CaseStatic>>;
})();
