import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import type { Doc } from './_generated/dataModel';

// Type for case state data that comes from the client
export interface CaseStateData {
	groupId: string;
	caseId: number;
	trainState: 'unlearned' | 'learning' | 'finished';
	algorithmSelectionLeft: number | null;
	algorithmSelectionRight: number | null;
	customAlgorithmLeft: string;
	customAlgorithmRight: string;
	identicalAlgorithm: boolean;
	lastModified: number;
}

/**
 * Get all case states for the current authenticated user
 */
export const getCaseStatesForCurrentUser = query({
	handler: async (ctx): Promise<CaseStateData[]> => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return [];

		const caseStates = await ctx.db
			.query('caseStates')
			.withIndex('by_user', (q) => q.eq('tokenIdentifier', identity.tokenIdentifier))
			.collect();

		return caseStates.map((cs) => ({
			groupId: cs.groupId,
			caseId: cs.caseId,
			trainState: cs.trainState,
			algorithmSelectionLeft: cs.algorithmSelectionLeft,
			algorithmSelectionRight: cs.algorithmSelectionRight,
			customAlgorithmLeft: cs.customAlgorithmLeft,
			customAlgorithmRight: cs.customAlgorithmRight,
			identicalAlgorithm: cs.identicalAlgorithm,
			lastModified: cs.lastModified
		}));
	}
});

/**
 * Add or update a single case state
 */
export const upsertCaseState = mutation({
	args: {
		caseState: v.object({
			groupId: v.string(),
			caseId: v.number(),
			trainState: v.union(v.literal('unlearned'), v.literal('learning'), v.literal('finished')),
			algorithmSelectionLeft: v.union(v.number(), v.null()),
			algorithmSelectionRight: v.union(v.number(), v.null()),
			customAlgorithmLeft: v.string(),
			customAlgorithmRight: v.string(),
			identicalAlgorithm: v.boolean(),
			lastModified: v.number()
		})
	},
	handler: async (ctx, { caseState }) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error('Not authenticated');

		// Validate algorithm selection indices are reasonable (0-99 should cover all cases)
		if (
			caseState.algorithmSelectionLeft !== null &&
			(caseState.algorithmSelectionLeft < 0 || caseState.algorithmSelectionLeft > 99)
		) {
			throw new Error('Invalid algorithm selection index for left');
		}
		if (
			caseState.algorithmSelectionRight !== null &&
			(caseState.algorithmSelectionRight < 0 || caseState.algorithmSelectionRight > 99)
		) {
			throw new Error('Invalid algorithm selection index for right');
		}

		// Check if case state already exists
		const existing = await ctx.db
			.query('caseStates')
			.withIndex('by_user_case', (q) =>
				q
					.eq('tokenIdentifier', identity.tokenIdentifier)
					.eq('groupId', caseState.groupId)
					.eq('caseId', caseState.caseId)
			)
			.unique();

		if (existing) {
			// Update existing case state if incoming is newer
			if (caseState.lastModified > existing.lastModified) {
				await ctx.db.patch(existing._id, {
					trainState: caseState.trainState,
					algorithmSelectionLeft: caseState.algorithmSelectionLeft,
					algorithmSelectionRight: caseState.algorithmSelectionRight,
					customAlgorithmLeft: caseState.customAlgorithmLeft,
					customAlgorithmRight: caseState.customAlgorithmRight,
					identicalAlgorithm: caseState.identicalAlgorithm,
					lastModified: caseState.lastModified
				});
				return { action: 'updated' };
			} else {
				return { action: 'skipped', reason: 'existing_newer' };
			}
		} else {
			// Create new case state
			await ctx.db.insert('caseStates', {
				...caseState,
				tokenIdentifier: identity.tokenIdentifier
			});
			return { action: 'inserted' };
		}
	}
});

/**
 * Bulk upsert case states (for sync on login)
 */
export const bulkUpsertCaseStates = mutation({
	args: {
		caseStates: v.array(
			v.object({
				groupId: v.string(),
				caseId: v.number(),
				trainState: v.union(v.literal('unlearned'), v.literal('learning'), v.literal('finished')),
				algorithmSelectionLeft: v.union(v.number(), v.null()),
				algorithmSelectionRight: v.union(v.number(), v.null()),
				customAlgorithmLeft: v.string(),
				customAlgorithmRight: v.string(),
				identicalAlgorithm: v.boolean(),
				lastModified: v.number()
			})
		)
	},
	handler: async (ctx, { caseStates }) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error('Not authenticated');

		let inserted = 0;
		let updated = 0;
		let skipped = 0;
		const errors: string[] = [];

		for (const caseState of caseStates) {
			try {
				// Validate algorithm selection indices
				if (
					caseState.algorithmSelectionLeft !== null &&
					(caseState.algorithmSelectionLeft < 0 || caseState.algorithmSelectionLeft > 99)
				) {
					errors.push(
						`Invalid algorithm selection index for left: ${caseState.groupId}/${caseState.caseId}`
					);
					continue;
				}
				if (
					caseState.algorithmSelectionRight !== null &&
					(caseState.algorithmSelectionRight < 0 || caseState.algorithmSelectionRight > 99)
				) {
					errors.push(
						`Invalid algorithm selection index for right: ${caseState.groupId}/${caseState.caseId}`
					);
					continue;
				}

				// Check if case state already exists
				const existing = await ctx.db
					.query('caseStates')
					.withIndex('by_user_case', (q) =>
						q
							.eq('tokenIdentifier', identity.tokenIdentifier)
							.eq('groupId', caseState.groupId)
							.eq('caseId', caseState.caseId)
					)
					.unique();

				if (existing) {
					// Update if incoming is newer
					if (caseState.lastModified > existing.lastModified) {
						await ctx.db.patch(existing._id, {
							trainState: caseState.trainState,
							algorithmSelectionLeft: caseState.algorithmSelectionLeft,
							algorithmSelectionRight: caseState.algorithmSelectionRight,
							customAlgorithmLeft: caseState.customAlgorithmLeft,
							customAlgorithmRight: caseState.customAlgorithmRight,
							identicalAlgorithm: caseState.identicalAlgorithm,
							lastModified: caseState.lastModified
						});
						updated++;
					} else {
						skipped++;
					}
				} else {
					// Insert new
					await ctx.db.insert('caseStates', {
						...caseState,
						tokenIdentifier: identity.tokenIdentifier
					});
					inserted++;
				}
			} catch (error) {
				errors.push(`Error processing ${caseState.groupId}/${caseState.caseId}: ${error}`);
			}
		}

		return { inserted, updated, skipped, errors };
	}
});
