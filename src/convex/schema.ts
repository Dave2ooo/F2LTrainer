import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
	solves: defineTable({
		id: v.string(), // your own ID, separate from Convex _id
		groupId: v.string(), // or v.id("groups") if this references another table
		caseId: v.number(),
		time: v.optional(v.number()),

		timestamp: v.number(), // ms since epoch (or whatever you use)
		auf: v.string(),
		side: v.optional(v.string()),
		scrambleSelection: v.number(),
		sessionId: v.optional(v.string()),

		recognitionTime: v.optional(v.number()),
		executionTime: v.optional(v.number()),
		trainMode: v.string(),

		// To filter solves by user
		tokenIdentifier: v.string()
	}).index('by_tokenIdentifier', ['tokenIdentifier'])
});
