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
			lastModified: v.number(),
			deletedAt: v.optional(v.union(v.number(), v.null())) // Support undeletion
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

		// Build patch, converting deletedAt: null to undefined to remove the field (undelete)
		const { deletedAt, ...rest } = args.updates;
		const patch: any = { ...rest };
		if ('deletedAt' in args.updates) {
			patch.deletedAt = deletedAt === null ? undefined : deletedAt;
		}

		await ctx.db.patch(cube._id, patch);
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

		// 1. Load all existing cubes for this user
		const dbCubes = await ctx.db
			.query('savedCubes')
			.withIndex('by_tokenIdentifier', (q) => q.eq('tokenIdentifier', identity.tokenIdentifier))
			.collect();

		// Create maps for efficient access
		const dbMap = new Map(dbCubes.map((c) => [c.uuid, c]));
		const workingState = new Map<string, any>(); // uuid -> cube data

		// Initialize working state with DB data
		for (const c of dbCubes) {
			workingState.set(c.uuid, { ...c });
		}

		// 2. Apply inputs to working state
		const inputUuids = new Set<string>();
		for (const input of args.cubes) {
			inputUuids.add(input.uuid);
			const existing = workingState.get(input.uuid);

			// Standard sync logic: update if input is newer (or new)
			if (!existing || input.lastModified > existing.lastModified) {
				workingState.set(input.uuid, {
					...input,
					tokenIdentifier: identity.tokenIdentifier,
					// Ensure deletedAt is carried over from input
					deletedAt: input.deletedAt
				});
			}
		}

		// 3. Resolve MAC conflicts
		// Group by MAC address
		const byMac = new Map<string, string[]>(); // mac -> uuid[]
		for (const [uuid, cube] of workingState.entries()) {
			if (cube.macAddress) {
				const list = byMac.get(cube.macAddress) || [];
				list.push(uuid);
				byMac.set(cube.macAddress, list);
			}
		}

		const now = Date.now();

		for (const [_, uuids] of byMac.entries()) {
			if (uuids.length <= 1) continue;

			// Get cube objects
			const cubes = uuids.map((id) => workingState.get(id));

			// Sort by lastModified descending
			cubes.sort((a, b) => b.lastModified - a.lastModified);

			const winner = cubes[0];
			const losers = cubes.slice(1);

			let dominanceNeeded = false;

			for (const loser of losers) {
				// If loser is not already deleted, delete it
				if (!loser.deletedAt) {
					loser.deletedAt = now;
					loser.lastModified = now;
					workingState.set(loser.uuid, loser);
					dominanceNeeded = true;
				}
				// If already deleted, it stays eliminated
			}

			if (dominanceNeeded) {
				// Ensure winner is strictly newer than the modification we just made to losers
				// This prevents a loop where a deleted cube becomes "newer" than the winner
				if (winner.lastModified <= now) {
					winner.lastModified = now + 1;
					workingState.set(winner.uuid, winner);
				}
			}
		}

		// 4. Commit changes and calculate stats
		let inserted = 0;
		let updated = 0;
		let skipped = 0;

		for (const [uuid, finalCube] of workingState.entries()) {
			const original = dbMap.get(uuid);
			const isInput = inputUuids.has(uuid);

			if (original) {
				// Update if changed (using lastModified as proxy for change)
				if (finalCube.lastModified > original.lastModified) {
					await ctx.db.patch(original._id, {
						name: finalCube.name,
						macAddress: finalCube.macAddress,
						dateAdded: finalCube.dateAdded,
						lastConnected: finalCube.lastConnected,
						lastModified: finalCube.lastModified,
						deletedAt: finalCube.deletedAt
					});
					if (isInput) updated++;
				} else {
					if (isInput) skipped++;
				}
			} else {
				// Insert new
				await ctx.db.insert('savedCubes', finalCube);
				if (isInput) inserted++;
			}
		}

		return { inserted, updated, skipped };
	}
});
