import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import type { Solve } from '$lib/types/statisticsState';

export const getSolvesForCurrentUser = query({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (identity === null) {
			throw new Error('Not authenticated');
		}

		const solves = await ctx.db
			.query('solves')
			.withIndex('by_tokenIdentifier', (q) => q.eq('tokenIdentifier', identity.tokenIdentifier))
			.collect();

		return solves;
	}
});

export const addSolve = mutation({
	args: {
		solve: v.object({
			id: v.string(),
			groupId: v.string(),
			caseId: v.number(),
			time: v.optional(v.number()),
			timestamp: v.number(),
			auf: v.string(),
			side: v.optional(v.string()),
			scrambleSelection: v.number(),
			sessionId: v.optional(v.string()),
			recognitionTime: v.optional(v.number()),
			executionTime: v.optional(v.number()),
			trainMode: v.string()
		})
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error('Not authenticated');
		}
		return await ctx.db.insert('solves', {
			id: args.solve.id,
			groupId: args.solve.groupId,
			caseId: args.solve.caseId,
			time: args.solve.time,
			timestamp: args.solve.timestamp,
			auf: args.solve.auf,
			side: args.solve.side,
			scrambleSelection: args.solve.scrambleSelection,
			sessionId: args.solve.sessionId,
			recognitionTime: args.solve.recognitionTime,
			executionTime: args.solve.executionTime,
			trainMode: args.solve.trainMode,
			tokenIdentifier: identity.tokenIdentifier
		});
	}
});
