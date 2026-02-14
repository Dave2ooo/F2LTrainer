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
			.filter((q: any) => q.gt('deletedAt', 0).lt('deletedAt', cutoff))) {
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
			.filter((q: any) => q.gt('deletedAt', 0).lt('deletedAt', cutoff))) {
			await ctx.db.delete(solve._id);
		}
	}
});
