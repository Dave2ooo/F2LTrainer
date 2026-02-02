import { mutation } from './_generated/server';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export default mutation({
	args: {},
	handler: async (ctx) => {
		const now = Date.now();
		const cutoff = now - THIRTY_DAYS_MS;

		// Delete solves
		for await (const solve of ctx.db
			.query('solves')
			.filter((q: any) => q.eq('deleted', true).gt('deletedAt', 0).lt('deletedAt', cutoff))) {
			await ctx.db.delete(solve._id);
		}

		// Delete sessions
		for await (const session of ctx.db
			.query('sessions')
			.filter((q: any) => q.eq('deleted', true).gt('deletedAt', 0).lt('deletedAt', cutoff))) {
			await ctx.db.delete(session._id);
		}
	}
});
