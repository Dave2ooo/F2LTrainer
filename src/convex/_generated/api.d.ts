/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as caseStates from "../caseStates.js";
import type * as cronDeleteSoftDeleted from "../cronDeleteSoftDeleted.js";
import type * as deleteUserData from "../deleteUserData.js";
import type * as http from "../http.js";
import type * as sessions from "../sessions.js";
import type * as solves from "../solves.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  caseStates: typeof caseStates;
  cronDeleteSoftDeleted: typeof cronDeleteSoftDeleted;
  deleteUserData: typeof deleteUserData;
  http: typeof http;
  sessions: typeof sessions;
  solves: typeof solves;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
