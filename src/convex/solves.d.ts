export declare const getSolvesForCurrentUser: import("convex/server").RegisteredQuery<"public", {}, Promise<{
    _id: import("convex/values").GenericId<"solves">;
    _creationTime: number;
    time?: number | undefined;
    side?: string | undefined;
    sessionId?: string | undefined;
    recognitionTime?: number | undefined;
    executionTime?: number | undefined;
    deleted?: boolean | undefined;
    deletedAt?: number | undefined;
    id: string;
    groupId: string;
    caseId: number;
    timestamp: number;
    auf: string;
    scrambleSelection: number;
    trainMode: string;
    tokenIdentifier: string;
}[]>>;
export declare const addSolve: import("convex/server").RegisteredMutation<"public", {
    solve: {
        time?: number | undefined;
        side?: string | undefined;
        sessionId?: string | undefined;
        recognitionTime?: number | undefined;
        executionTime?: number | undefined;
        deleted?: boolean | undefined;
        deletedAt?: number | undefined;
        id: string;
        groupId: string;
        caseId: number;
        timestamp: number;
        auf: string;
        scrambleSelection: number;
        trainMode: string;
    };
}, Promise<import("convex/values").GenericId<"solves">>>;
export declare const updateSolve: import("convex/server").RegisteredMutation<"public", {
    id: string;
    time: number;
}, Promise<void>>;
export declare const deleteSolve: import("convex/server").RegisteredMutation<"public", {
    id: string;
}, Promise<void>>;
export declare const deleteSolvesBySession: import("convex/server").RegisteredMutation<"public", {
    sessionId: string;
}, Promise<number>>;
export declare const bulkUpsertSolves: import("convex/server").RegisteredMutation<"public", {
    solves: {
        time?: number | undefined;
        side?: string | undefined;
        sessionId?: string | undefined;
        recognitionTime?: number | undefined;
        executionTime?: number | undefined;
        deleted?: boolean | undefined;
        deletedAt?: number | undefined;
        id: string;
        groupId: string;
        caseId: number;
        timestamp: number;
        auf: string;
        scrambleSelection: number;
        trainMode: string;
    }[];
}, Promise<{
    inserted: number;
    updated: number;
    skipped: number;
}>>;
