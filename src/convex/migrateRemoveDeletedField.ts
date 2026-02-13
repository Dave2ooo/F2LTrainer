import { mutation } from './_generated/server';

/**
 * One-time migration: removes the deprecated `deleted` boolean field
 * from all solves and sessions documents.
 *
 * Run this once after deploying, then remove `deleted` from schema.ts
 * and deploy again.
 *
 * Usage: Run from the Convex dashboard Functions tab or via CLI.
 */
export default mutation({
	args: {},
	handler: async (ctx) => {
		let solvesUpdated = 0;
		let sessionsUpdated = 0;

		// Clean up solves
		for await (const solve of ctx.db.query('solves')) {
			if ('deleted' in solve) {
				// Use unset to remove the field entirely
				await ctx.db.patch(solve._id, { deleted: undefined });
				solvesUpdated++;
			}
		}

		// Clean up sessions
		for await (const session of ctx.db.query('sessions')) {
			if ('deleted' in session) {
				await ctx.db.patch(session._id, { deleted: undefined });
				sessionsUpdated++;
			}
		}

		console.log(
			`[Migration] Removed 'deleted' field from ${solvesUpdated} solve(s) and ${sessionsUpdated} session(s)`
		);

		return { solvesUpdated, sessionsUpdated };
	}
});
