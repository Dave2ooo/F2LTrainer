import { query, mutation } from './_generated/server';
import { v } from 'convex/values';

// Validator for saved cube objects
const savedCubeValidator = v.object({
	uuid: v.string(),
	name: v.string(),
	macAddress: v.optional(v.string()),
	dateAdded: v.number(),
	lastConnected: v.number(),
	lastModified: v.number(),
	deletedAt: v.optional(v.number())
});

export const getSavedCubesForCurrentUser = query({
	args: {
		includeDeleted: v.optional(v.boolean())
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (identity === null) {
			throw new Error('Not authenticated');
		}

		const cubes = await ctx.db
			.query('savedCubes')
			.withIndex('by_tokenIdentifier', (q) => q.eq('tokenIdentifier', identity.tokenIdentifier))
			.collect();

		if (args.includeDeleted) {
			return cubes;
		}
		return cubes.filter((c) => !c.deletedAt);
	}
});

export const addCube = mutation({
	args: {
		cube: savedCubeValidator
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error('Not authenticated');
		}
		return await ctx.db.insert('savedCubes', {
			uuid: args.cube.uuid,
			name: args.cube.name,
			macAddress: args.cube.macAddress,
			dateAdded: args.cube.dateAdded,
			lastConnected: args.cube.lastConnected,
			lastModified: args.cube.lastModified,
			deletedAt: args.cube.deletedAt,
			tokenIdentifier: identity.tokenIdentifier
		});
	}
});

export const updateCube = mutation({
	args: {
		uuid: v.string(),
		updates: v.object({
			name: v.optional(v.string()),
			macAddress: v.optional(v.string()),
			lastConnected: v.optional(v.number()),
			lastModified: v.number()
		})
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error('Not authenticated');
		}

		const cube = await ctx.db
			.query('savedCubes')
			.withIndex('by_tokenIdentifier', (q) => q.eq('tokenIdentifier', identity.tokenIdentifier))
			.filter((q) => q.eq(q.field('uuid'), args.uuid))
			.unique();

		if (!cube) {
			throw new Error(`Saved cube with uuid ${args.uuid} not found`);
		}

		await ctx.db.patch(cube._id, args.updates);
	}
});

export const deleteCube = mutation({
	args: {
		uuid: v.string()
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error('Not authenticated');
		}

		const cube = await ctx.db
			.query('savedCubes')
			.withIndex('by_tokenIdentifier', (q) => q.eq('tokenIdentifier', identity.tokenIdentifier))
			.filter((q) => q.eq(q.field('uuid'), args.uuid))
			.unique();

		if (cube) {
			await ctx.db.patch(cube._id, {
				deletedAt: Date.now(),
				lastModified: Date.now()
			});
		}
	}
});

export const bulkUpsertCubes = mutation({
	args: {
		cubes: v.array(savedCubeValidator)
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error('Not authenticated');
		}

		// Get all existing cubes for this user
		const existingCubes = await ctx.db
			.query('savedCubes')
			.withIndex('by_tokenIdentifier', (q) => q.eq('tokenIdentifier', identity.tokenIdentifier))
			.collect();

		const existingMap = new Map(existingCubes.map((c) => [c.uuid, c]));

		let inserted = 0;
		let updated = 0;
		let skipped = 0;

		for (const cube of args.cubes) {
			const existing = existingMap.get(cube.uuid);

			if (existing) {
				// Cube exists - compare timestamps, keep newer
				if (cube.lastModified > existing.lastModified) {
					await ctx.db.patch(existing._id, {
						name: cube.name,
						macAddress: cube.macAddress,
						dateAdded: cube.dateAdded,
						lastConnected: cube.lastConnected,
						lastModified: cube.lastModified,
						deletedAt: cube.deletedAt
					});
					updated++;
				} else {
					skipped++;
				}
			} else {
				// New cube - insert
				await ctx.db.insert('savedCubes', {
					uuid: cube.uuid,
					name: cube.name,
					macAddress: cube.macAddress,
					dateAdded: cube.dateAdded,
					lastConnected: cube.lastConnected,
					lastModified: cube.lastModified,
					deletedAt: cube.deletedAt,
					tokenIdentifier: identity.tokenIdentifier
				});
				inserted++;
			}
		}

		return { inserted, updated, skipped };
	}
});
