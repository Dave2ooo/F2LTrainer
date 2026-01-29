import { query, mutation } from './_generated/server';
import { v } from 'convex/values';

export const getSessionsForCurrentUser = query({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (identity === null) {
			throw new Error('Not authenticated');
		}

		const sessions = await ctx.db
			.query('sessions')
			.withIndex('by_tokenIdentifier', (q) => q.eq('tokenIdentifier', identity.tokenIdentifier))
			.collect();

		return sessions;
	}
});

export const addSession = mutation({
	args: {
		session: v.object({
			id: v.string(),
			name: v.string(),
			settings: v.any(),
			createdAt: v.number(),
			lastPlayedAt: v.number(),
			lastModified: v.number(),
			archived: v.boolean(),
			favorite: v.optional(v.boolean())
		})
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error('Not authenticated');
		}
		return await ctx.db.insert('sessions', {
			id: args.session.id,
			name: args.session.name,
			settings: args.session.settings,
			createdAt: args.session.createdAt,
			lastPlayedAt: args.session.lastPlayedAt,
			lastModified: args.session.lastModified,
			archived: args.session.archived,
			favorite: args.session.favorite,
			tokenIdentifier: identity.tokenIdentifier
		});
	}
});

export const updateSession = mutation({
	args: {
		id: v.string(),
		updates: v.object({
			name: v.optional(v.string()),
			settings: v.optional(v.any()),
			lastPlayedAt: v.optional(v.number()),
			lastModified: v.optional(v.number()),
			archived: v.optional(v.boolean()),
			favorite: v.optional(v.boolean())
		})
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error('Not authenticated');
		}

		const session = await ctx.db
			.query('sessions')
			.withIndex('by_tokenIdentifier', (q) => q.eq('tokenIdentifier', identity.tokenIdentifier))
			.filter((q) => q.eq(q.field('id'), args.id))
			.unique();

		if (!session) {
			throw new Error(`Session with id ${args.id} not found`);
		}

		await ctx.db.patch(session._id, args.updates);
	}
});

export const deleteSession = mutation({
	args: {
		id: v.string()
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error('Not authenticated');
		}

		const session = await ctx.db
			.query('sessions')
			.withIndex('by_tokenIdentifier', (q) => q.eq('tokenIdentifier', identity.tokenIdentifier))
			.filter((q) => q.eq(q.field('id'), args.id))
			.unique();

		if (session) {
			await ctx.db.patch(session._id, { archived: true });
		}
	}
});

export const restoreSession = mutation({
	args: {
		id: v.string()
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error('Not authenticated');
		}

		const session = await ctx.db
			.query('sessions')
			.withIndex('by_tokenIdentifier', (q) => q.eq('tokenIdentifier', identity.tokenIdentifier))
			.filter((q) => q.eq(q.field('id'), args.id))
			.unique();

		if (session) {
			await ctx.db.patch(session._id, { archived: false });
		}
	}
});

export const hardDeleteSession = mutation({
	args: {
		id: v.string()
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error('Not authenticated');
		}

		const session = await ctx.db
			.query('sessions')
			.withIndex('by_tokenIdentifier', (q) => q.eq('tokenIdentifier', identity.tokenIdentifier))
			.filter((q) => q.eq(q.field('id'), args.id))
			.unique();

		if (session) {
			await ctx.db.delete(session._id);
		}
	}
});

const sessionObjectValidator = v.object({
	id: v.string(),
	name: v.string(),
	settings: v.any(),
	createdAt: v.number(),
	lastPlayedAt: v.number(),
	lastModified: v.number(),
	archived: v.boolean(),
	favorite: v.optional(v.boolean())
});

export const bulkUpsertSessions = mutation({
	args: {
		sessions: v.array(sessionObjectValidator)
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error('Not authenticated');
		}

		const existingSessions = await ctx.db
			.query('sessions')
			.withIndex('by_tokenIdentifier', (q) => q.eq('tokenIdentifier', identity.tokenIdentifier))
			.collect();

		const existingMap = new Map(existingSessions.map((s) => [s.id, s]));

		let inserted = 0;
		let updated = 0;
		let skipped = 0;

		for (const session of args.sessions) {
			const existing = existingMap.get(session.id);

			if (existing) {
				// Session exists - compare lastModified timestamps, keep newer
				if (session.lastModified > existing.lastModified) {
					await ctx.db.patch(existing._id, {
						name: session.name,
						settings: session.settings,
						createdAt: session.createdAt,
						lastPlayedAt: session.lastPlayedAt,
						lastModified: session.lastModified,
						archived: session.archived,
						favorite: session.favorite
					});
					updated++;
				} else {
					skipped++;
				}
			} else {
				// New session - insert
				await ctx.db.insert('sessions', {
					...session,
					tokenIdentifier: identity.tokenIdentifier
				});
				inserted++;
			}
		}

		return { inserted, updated, skipped };
	}
});
