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

		deleted: v.optional(v.boolean()), // Soft delete flag
		deletedAt: v.optional(v.number()), // Timestamp of deletion

		// To filter solves by user
		tokenIdentifier: v.string()
	}).index('by_tokenIdentifier', ['tokenIdentifier']),

	sessions: defineTable({
		id: v.string(), // Session UUID
		name: v.string(),
		settings: v.any(), // SessionSettings object - using v.any() for complex nested structure
		createdAt: v.number(),
		lastPlayedAt: v.number(),
		lastModified: v.number(),
		archived: v.boolean(),
		deleted: v.optional(v.boolean()), // Soft delete flag
		deletedAt: v.optional(v.number()), // Timestamp of deletion
		favorite: v.optional(v.boolean()),

		// To filter sessions by user
		tokenIdentifier: v.string()
	}).index('by_tokenIdentifier', ['tokenIdentifier']),

	caseStates: defineTable({
		groupId: v.string(),
		caseId: v.number(),
		trainState: v.union(v.literal('unlearned'), v.literal('learning'), v.literal('finished')), // Validate train state values

		// Algorithm selection (null = use custom algorithm)
		algorithmSelectionLeft: v.union(v.number(), v.null()),
		algorithmSelectionRight: v.union(v.number(), v.null()),

		// Custom algorithms
		customAlgorithmLeft: v.string(),
		customAlgorithmRight: v.string(),

		identicalAlgorithm: v.boolean(),
		lastModified: v.number(),

		// To filter case states by user
		tokenIdentifier: v.string()
	})
		.index('by_user', ['tokenIdentifier'])
		.index('by_user_group', ['tokenIdentifier', 'groupId'])
		.index('by_user_case', ['tokenIdentifier', 'groupId', 'caseId'])
});
