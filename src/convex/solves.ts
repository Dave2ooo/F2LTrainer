import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import type { Solve } from '$lib/types/statisticsState';

// Validator for solve objects (used in addSolve and bulkUpsertSolves)
const solveObjectValidator = v.object({
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
	trainMode: v.string(),
	deleted: v.optional(v.boolean()),
	deletedAt: v.optional(v.number())
});

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

		// Filter out soft-deleted solves
		return solves.filter((s) => !s.deleted);
	}
});

export const addSolve = mutation({
	args: {
		solve: solveObjectValidator
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
			deleted: args.solve.deleted,
			deletedAt: args.solve.deletedAt,
			tokenIdentifier: identity.tokenIdentifier
		});
	}
});

export const updateSolve = mutation({
	args: {
		id: v.string(),
		time: v.number()
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error('Not authenticated');
		}

		// Find the solve by custom id and user
		const solve = await ctx.db
			.query('solves')
			.withIndex('by_tokenIdentifier', (q) => q.eq('tokenIdentifier', identity.tokenIdentifier))
			.filter((q) => q.eq(q.field('id'), args.id))
			.unique();

		if (!solve) {
			throw new Error(`Solve with id ${args.id} not found`);
		}

		await ctx.db.patch(solve._id, { time: args.time });
	}
});

export const deleteSolve = mutation({
	args: {
		id: v.string()
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error('Not authenticated');
		}

		const solve = await ctx.db
			.query('solves')
			.withIndex('by_tokenIdentifier', (q) => q.eq('tokenIdentifier', identity.tokenIdentifier))
			.filter((q) => q.eq(q.field('id'), args.id))
			.unique();

		if (solve) {
			// Soft delete: mark as deleted with timestamp
			await ctx.db.patch(solve._id, {
				deleted: true,
				deletedAt: Date.now()
			});
		}
	}
});

export const deleteSolvesBySession = mutation({
	args: {
		sessionId: v.string()
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error('Not authenticated');
		}

		const solves = await ctx.db
			.query('solves')
			.withIndex('by_tokenIdentifier', (q) => q.eq('tokenIdentifier', identity.tokenIdentifier))
			.filter((q) => q.eq(q.field('sessionId'), args.sessionId))
			.collect();

		for (const solve of solves) {
			// Soft delete all solves for this session
			await ctx.db.patch(solve._id, {
				deleted: true,
				deletedAt: Date.now()
			});
		}

		return solves.length;
	}
});

export const bulkUpsertSolves = mutation({
	args: {
		solves: v.array(solveObjectValidator)
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error('Not authenticated');
		}

		// Get all existing solves for this user
		const existingSolves = await ctx.db
			.query('solves')
			.withIndex('by_tokenIdentifier', (q) => q.eq('tokenIdentifier', identity.tokenIdentifier))
			.collect();

		// Create a map of existing solves by id for quick lookup
		const existingMap = new Map(existingSolves.map((s) => [s.id, s]));

		let inserted = 0;
		let updated = 0;
		let skipped = 0;

		for (const solve of args.solves) {
			const existing = existingMap.get(solve.id);

			if (existing) {
				// Solve exists - compare timestamps, keep newer
				if (solve.timestamp > existing.timestamp) {
					await ctx.db.patch(existing._id, {
						groupId: solve.groupId,
						caseId: solve.caseId,
						time: solve.time,
						timestamp: solve.timestamp,
						auf: solve.auf,
						side: solve.side,
						scrambleSelection: solve.scrambleSelection,
						sessionId: solve.sessionId,
						recognitionTime: solve.recognitionTime,
						executionTime: solve.executionTime,
						trainMode: solve.trainMode,
						deleted: solve.deleted,
						deletedAt: solve.deletedAt
					});
					updated++;
				} else {
					skipped++;
				}
			} else {
				// New solve - insert
				await ctx.db.insert('solves', {
					...solve,
					tokenIdentifier: identity.tokenIdentifier
				});
				inserted++;
			}
		}

		return { inserted, updated, skipped };
	}
});
