/**
 * CRON JOB: cronDeleteSoftDeleted
 *
 * What it does:
 * This mutation permanently deletes (hard deletes) data that was "soft-deleted"
 * more than 30 days ago. It cleans up:
 * 1. Soft-deleted sessions (and cascades the deletion to all solves in those sessions).
 * 2. Standalone soft-deleted solves.
 * 3. Soft-deleted saved cubes.
 *
 * How and when it is executed:
 * It is automatically executed by Convex's cron job scheduler.
 * The schedule is defined in the root `convex.json` file.
 * Currently, it runs daily at midnight UTC ("0 0 * * *").
 */
import { mutation } from './_generated/server';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export default mutation({
	args: {},
	handler: async (ctx) => {
		const now = Date.now();
		const cutoff = now - THIRTY_DAYS_MS;

		// Delete sessions and their associated solves
		for await (const session of ctx.db
			.query('sessions')
			.filter((q) => q.and(q.gt(q.field('deletedAt'), 0), q.lt(q.field('deletedAt'), cutoff)))) {
			// Delete all solves connected to this session
			const sessionSolves = await ctx.db
				.query('solves')
				.filter((q: any) => q.eq('sessionId', session.id))
				.collect();

			for (const solve of sessionSolves) {
				await ctx.db.delete(solve._id);
			}

			// Delete the session itself
			await ctx.db.delete(session._id);
		}

		// Delete standalone soft-deleted solves (not connected to sessions or already handled above)
		for await (const solve of ctx.db
			.query('solves')
			.filter((q) => q.and(q.gt(q.field('deletedAt'), 0), q.lt(q.field('deletedAt'), cutoff)))) {
			await ctx.db.delete(solve._id);
		}

		// Delete soft-deleted saved cubes
		for await (const cube of ctx.db
			.query('savedCubes')
			.filter((q) => q.and(q.gt(q.field('deletedAt'), 0), q.lt(q.field('deletedAt'), cutoff)))) {
			await ctx.db.delete(cube._id);
		}
	}
});
