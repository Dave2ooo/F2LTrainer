import { casesStatic } from "./casesStatic";
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

export const casesState: Record<GroupId, Record<CaseId, CaseState>> = $state(
    Object.fromEntries(GROUP_IDS.map((groupId) => [groupId, createGroupCasesState(groupId)])) as Record<
        GroupId,
        Record<CaseId, CaseState>
    >,
);
