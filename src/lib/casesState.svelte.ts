import { casesStatic } from "./casesStatic";
import { loadFromLocalStorage } from "./utils/localStorage";
import type { CaseState } from "./types/caseState";
import { GROUP_IDS, type CaseId, type GroupId } from "./types/group";

export const createCaseState = (): CaseState => ({
    status: "unlearned",
    algorithmSelection: { left: 0, right: 0 },
    customAlgorithm: { left: "", right: "" },
    identicalAlgorithm: true,
    // mirrored: false,
    solveCount: 0,
});

const createGroupCasesState = (groupId: GroupId): Record<CaseId, CaseState> => {
    const caseEntries = Object.keys(casesStatic[groupId]).map((caseId) => [
        Number(caseId) as CaseId,
        createCaseState(),
    ]);

    return Object.fromEntries(caseEntries) as Record<CaseId, CaseState>;
};

const createDefaultCasesState = (): Record<GroupId, Record<CaseId, CaseState>> =>
    Object.fromEntries(GROUP_IDS.map((groupId) => [groupId, createGroupCasesState(groupId)])) as Record<
        GroupId,
        Record<CaseId, CaseState>
    >;

export const CASES_STATE_STORAGE_KEY = "casesState";

type PersistedCasesState = Partial<
    Record<GroupId, Partial<Record<CaseId, Partial<CaseState>>>>
>;

export const casesState: Record<GroupId, Record<CaseId, CaseState>> = $state(
    createDefaultCasesState(),
);

const persistedCasesState = loadFromLocalStorage<PersistedCasesState>(CASES_STATE_STORAGE_KEY);

if (persistedCasesState) {
    for (const groupId of GROUP_IDS) {
        const persistedGroup = persistedCasesState[groupId];
        if (!persistedGroup) continue;

        for (const [caseIdString, caseState] of Object.entries(casesState[groupId])) {
            const caseId = Number(caseIdString) as CaseId;
            const persistedCase = persistedGroup[caseId];

            if (!persistedCase) continue;

            Object.assign(caseState, persistedCase);
        }
    }
}

