import { httpRouter } from 'convex/server';
import { httpAction } from './_generated/server';
import { internal } from './_generated/api';
import type { WebhookEvent } from '@clerk/backend';
import { Webhook } from 'svix';

const http = httpRouter();

// Validate the webhook request using Svix
async function validateRequest(request: Request): Promise<WebhookEvent | null> {
	try {
		const payloadString = await request.text();
		const svixHeaders = {
			'svix-id': request.headers.get('svix-id')!,
			'svix-timestamp': request.headers.get('svix-timestamp')!,
			'svix-signature': request.headers.get('svix-signature')!
		};

		// Check if headers are present
		if (
			!svixHeaders['svix-id'] ||
			!svixHeaders['svix-timestamp'] ||
			!svixHeaders['svix-signature']
		) {
			console.error('[Clerk Webhook] Missing Svix headers', {
				hasId: !!svixHeaders['svix-id'],
				hasTimestamp: !!svixHeaders['svix-timestamp'],
				hasSignature: !!svixHeaders['svix-signature']
			});
			return null;
		}

		const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
		if (!webhookSecret) {
			console.error('[Clerk Webhook] CLERK_WEBHOOK_SECRET environment variable not set');
			return null;
		}

		const wh = new Webhook(webhookSecret);
		const event = wh.verify(payloadString, svixHeaders) as unknown as WebhookEvent;
		console.log('[Clerk Webhook] Webhook validated successfully');
		return event;
	} catch (error) {
		console.error('[Clerk Webhook] Error validating webhook:', error);
		return null;
	}
}

http.route({
	path: '/clerk-users-webhook',
	method: 'POST',
	handler: httpAction(async (ctx, request) => {
		console.log('=== WEBHOOK REQUEST STARTED ===');
		console.log('[Clerk Webhook] Request URL:', request.url);
		console.log('[Clerk Webhook] Request method:', request.method);

		// Log all headers for debugging
		const headers: Record<string, string> = {};
		request.headers.forEach((value, key) => {
			headers[key] = value;
		});
		console.log('[Clerk Webhook] Request headers:', JSON.stringify(headers, null, 2));

		try {
			console.log('[Clerk Webhook] Starting validation...');

			// Validate the webhook request
			const event = await validateRequest(request);
			if (!event) {
				console.error('[Clerk Webhook] Webhook validation failed');
				return new Response('Error occurred - invalid webhook', { status: 400 });
			}

			console.log('[Clerk Webhook] Validation successful!');
			console.log('[Clerk Webhook] Event type:', event.type);
			console.log('[Clerk Webhook] Event data:', JSON.stringify(event.data, null, 2));

			switch (event.type) {
				case 'user.deleted': {
					const clerkUserId = event.data.id;

					if (!clerkUserId) {
						console.error('[Clerk Webhook] Missing user ID in event data');
						return new Response('Missing user ID', { status: 400 });
					}

					console.log('[Clerk Webhook] Deleting user data for:', clerkUserId);

					try {
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

			console.log('[Clerk Webhook] Returning 200 OK');
			return new Response(null, { status: 200 });
		} catch (error) {
			console.error('[Clerk Webhook] Fatal error:', error);
			return new Response('Internal error: ' + String(error), { status: 500 });
		}
	})
});

export default http;
