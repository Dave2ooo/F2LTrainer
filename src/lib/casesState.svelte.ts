import { casesStatic } from "./casesStatic";
import { GROUP_IDS, type CaseId, type CaseState, type GroupId, createCaseState } from "./types/group";

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
