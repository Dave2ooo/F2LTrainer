import { mutation } from './_generated/server';
import type { MutationCtx } from './_generated/server';
import { v } from 'convex/values';

// Shared helper function to delete all user data
export async function deleteAllUserData(ctx: MutationCtx, tokenIdentifier: string) {
	// Delete solves
	const solves = await ctx.db
		.query('solves')
		.withIndex('by_tokenIdentifier', (q) => q.eq('tokenIdentifier', tokenIdentifier))
		.collect();

	for (const solve of solves) {
		await ctx.db.delete(solve._id);
	}

	// Delete sessions
	const sessions = await ctx.db
		.query('sessions')
		.withIndex('by_tokenIdentifier', (q) => q.eq('tokenIdentifier', tokenIdentifier))
		.collect();

	for (const session of sessions) {
		await ctx.db.delete(session._id);
	}

	// Delete caseStates
	const caseStates = await ctx.db
		.query('caseStates')
		.withIndex('by_user', (q) => q.eq('tokenIdentifier', tokenIdentifier))
		.collect();

	for (const caseState of caseStates) {
		await ctx.db.delete(caseState._id);
	}

	// Delete savedCubes
	const savedCubes = await ctx.db
		.query('savedCubes')
		.withIndex('by_tokenIdentifier', (q) => q.eq('tokenIdentifier', tokenIdentifier))
		.collect();

	for (const savedCube of savedCubes) {
		await ctx.db.delete(savedCube._id);
	}

	// Add more tables here if needed
}

export default mutation({
	args: {
		tokenIdentifier: v.string()
	},
	handler: async (ctx, args) => {
		const { tokenIdentifier } = args;
		await deleteAllUserData(ctx, tokenIdentifier);
	}
});

/**
 * Public mutation for users to delete their own data
 * Gets tokenIdentifier from authenticated session
 */
export const deleteMyData = mutation({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error('Not authenticated');
		}
		await deleteAllUserData(ctx, identity.tokenIdentifier);
	}
});
