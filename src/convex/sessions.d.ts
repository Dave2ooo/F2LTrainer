export declare const getSessionsForCurrentUser: import("convex/server").RegisteredQuery<"public", {}, Promise<{
    _id: import("convex/values").GenericId<"sessions">;
    _creationTime: number;
    deletedAt?: number | undefined;
    favorite?: boolean | undefined;
    id: string;
    tokenIdentifier: string;
    name: string;
    settings: any;
    createdAt: number;
    lastPlayedAt: number;
    lastModified: number;
    archived: boolean;
}[]>>;
export declare const addSession: import("convex/server").RegisteredMutation<"public", {
    session: {
        deletedAt?: number | undefined;
        favorite?: boolean | undefined;
        id: string;
        name: string;
        settings: any;
        createdAt: number;
        lastPlayedAt: number;
        lastModified: number;
        archived: boolean;
    };
}, Promise<import("convex/values").GenericId<"sessions">>>;
export declare const updateSession: import("convex/server").RegisteredMutation<"public", {
    id: string;
    updates: {
        deletedAt?: number | undefined;
        name?: string | undefined;
        settings?: any;
        lastPlayedAt?: number | undefined;
        lastModified?: number | undefined;
        archived?: boolean | undefined;
        favorite?: boolean | undefined;
    };
}, Promise<void>>;
export declare const deleteSession: import("convex/server").RegisteredMutation<"public", {
    id: string;
}, Promise<void>>;
export declare const restoreSession: import("convex/server").RegisteredMutation<"public", {
    id: string;
}, Promise<void>>;
export declare const hardDeleteSession: import("convex/server").RegisteredMutation<"public", {
    id: string;
}, Promise<void>>;
export declare const bulkUpsertSessions: import("convex/server").RegisteredMutation<"public", {
    sessions: {
        deletedAt?: number | undefined;
        favorite?: boolean | undefined;
        id: string;
        name: string;
        settings: any;
        createdAt: number;
        lastPlayedAt: number;
        lastModified: number;
        archived: boolean;
    }[];
}, Promise<{
    inserted: number;
    updated: number;
    skipped: number;
}>>;
