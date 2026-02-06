import { internalMutation } from './_generated/server';
import { v } from 'convex/values';
import { deleteAllUserData } from './deleteUserData';

export const deleteUserDataByToken = internalMutation({
	args: { tokenIdentifier: v.string() },
	handler: async (ctx, { tokenIdentifier }) => {
		await deleteAllUserData(ctx, tokenIdentifier);
	}
});

export const deleteUserDataByClerkId = internalMutation({
	args: { clerkUserId: v.string() },
	handler: async (ctx, { clerkUserId }) => {
		// Clerk's tokenIdentifier format: https://{domain}#${userId}
		// We need to construct the tokenIdentifier from the Clerk user ID

		// Get the issuer domain from environment
		const issuerDomain = process.env.CLERK_JWT_ISSUER_DOMAIN;

		if (!issuerDomain) {
			console.error('[deleteUserDataByClerkId] CLERK_JWT_ISSUER_DOMAIN not set in environment');
			throw new Error('CLERK_JWT_ISSUER_DOMAIN environment variable is required');
		}

		const tokenIdentifier = `${issuerDomain}#${clerkUserId}`;

		console.log(
			`[deleteUserDataByClerkId] Deleting user data for Clerk ID: ${clerkUserId}, tokenIdentifier: ${tokenIdentifier}`
		);

		// Delete all user data using the tokenIdentifier
		await deleteAllUserData(ctx, tokenIdentifier);
	}
});
