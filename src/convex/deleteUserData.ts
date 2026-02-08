import { mutation } from './_generated/server';
import type { MutationCtx } from './_generated/server';
import { v } from 'convex/values';

// Shared helper function to delete all user data
export async function deleteAllUserData(ctx: MutationCtx, tokenIdentifier: string) {
	// Delete solves
	for await (const solve of ctx.db
		.query('solves')
		.withIndex('by_tokenIdentifier', (q) => q.eq('tokenIdentifier', tokenIdentifier))) {
		await ctx.db.delete(solve._id);
	}

	// Delete sessions
	for await (const session of ctx.db
		.query('sessions')
		.withIndex('by_tokenIdentifier', (q) => q.eq('tokenIdentifier', tokenIdentifier))) {
		await ctx.db.delete(session._id);
	}

	// Delete caseStates
	for await (const caseState of ctx.db
		.query('caseStates')
		.withIndex('by_user', (q) => q.eq('tokenIdentifier', tokenIdentifier))) {
		await ctx.db.delete(caseState._id);
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
