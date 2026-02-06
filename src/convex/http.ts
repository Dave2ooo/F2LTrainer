import { httpRouter } from 'convex/server';
import { httpAction } from './_generated/server';
import { internal } from './_generated/api';
const http = httpRouter();

http.route({
	path: '/clerk-users-webhook',
	method: 'POST',
	handler: httpAction(async (ctx, request) => {
		try {
			console.log('[Clerk Webhook] Received request');

			// Convex provides request.json() for webhook payload
			const event = await request.json();
			console.log('[Clerk Webhook] Event received:', JSON.stringify(event));

			if (!event || !event.type) {
				console.error('[Clerk Webhook] Invalid event', event);
				return new Response('Error occurred', { status: 400 });
			}

			switch (event.type) {
				case 'user.deleted': {
					const clerkUserId = event.data.id;
					console.log('[Clerk Webhook] Deleting user data for:', clerkUserId);

					try {
						// @ts-ignore
						await ctx.runMutation(internal.users.deleteUserDataByClerkId, {
							clerkUserId
						});
						console.log('[Clerk Webhook] User data deleted successfully for:', clerkUserId);
					} catch (mutationError) {
						console.error('[Clerk Webhook] Error in deleteUserDataByClerkId:', mutationError);
						throw mutationError;
					}
					break;
				}
				default:
					console.log('[Clerk Webhook] Ignored event type:', event.type);
			}

			return new Response(null, { status: 200 });
		} catch (error) {
			console.error('[Clerk Webhook] Fatal error:', error);
			return new Response('Internal error: ' + String(error), { status: 500 });
		}
	})
});

export default http;
