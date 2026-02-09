# Clerk + Svelte Integration in F2LTrainer

This document explains how **Clerk** (Authentication) and **Svelte 5** (Frontend Framework) are integrated with **Convex** (Backend/Database) in the F2LTrainer application.

## Overview

The application uses an **Offline-First** architecture. Local storage is the primary data source for the UI, ensuring the app works instantly and offline. When a user logs in via Clerk, data is synchronized with Convex.

- **Frontend**: Svelte 5 (Runes) for reactivity.
- **Auth**: Clerk for user management (handling JWTs).
- **Backend/DB**: Convex for data persistence and synchronization.
- **State**: Persistent local state (localStorage) synced to Cloud (Convex).

## Authentication Flow

### 1. Clerk Setup

Clerk is initialized in `src/routes/+layout.svelte` using `<ClerkProvider>`. This provides authentication context to the entire application.

```svelte
<ClerkProvider publishableKey={PUBLIC_CLERK_PUBLISHABLE_KEY}>
	<ConvexClerkSync />
	{@render children()}
</ClerkProvider>
```

### 2. Convex + Clerk Connection (`ConvexClerkSync.svelte`)

The `src/routes/ConvexClerkSync.svelte` component is the bridge between Clerk and Convex. It does not render UI but manages the authentication state of the Convex Client.

- It uses `useClerkContext()` to get the current Clerk session.
- It uses `useConvexClient()` to get the Convex client instance.
- It sets the Convex client's auth function to fetch the Clerk JWT token.

```typescript
$effect(() => {
	if (ctx.session) {
		// Configure Convex to use Clerk's JWT
		client.setAuth(async () => (await ctx.session?.getToken({ template: 'convex' })) ?? null);
	} else {
		client.setAuth(() => Promise.resolve(null));
	}
});
```

**Key Configuration**: You must configure a JWT Template named `convex` in your Clerk Dashboard for this to work.

## Synchronization Logic

The sync logic is triggered within `ConvexClerkSync.svelte` when the user authenticates.

### 1. Offline-First Strategy

The app assumes the user might have been using it offline. Therefore, when a user logs in:

1.  **Push**: Local data is sent to Convex (`bulkUpsert`).
2.  **Conflict Resolution**: Handled by Convex mutations using "Last Write Wins" based on `timestamp` or `lastModified`.
3.  **Pull**: The latest merged data is fetched from Convex and updates the local store.

### 2. Sync Triggers

We use a `$effect` in `ConvexClerkSync.svelte` to watch authentication state:

```typescript
let hasSynced = false;

$effect(() => {
	const isAuthenticated = !!ctx.session;

	// 1. Update Services
	solvesSyncService.setAuthenticated(isAuthenticated);
	// ... other services ...

	// 2. Trigger Sync (Once per session)
	if (isAuthenticated && !hasSynced) {
		hasSynced = true;
		// Execute sync: Upload Local -> Fetch Remote -> Update Local
		await sessionState.handleLoginSync();
		await statisticsState.handleLoginSync();
		// ...
	}

	// 3. Handle Logout
	if (!isAuthenticated && hasSynced) {
		hasSynced = false;
		// Cleanup / Flush pending updates
	}
});
```

### 3. Data Cleanup (GDPR)

When a user is deleted in Clerk, a Webhook triggers `src/convex/http.ts`.

- **Webhook**: Receives `user.deleted` event.
- **Verification**: Uses Svix to verify the webhook signature.
- **Action**: Calls `internal.users.deleteUserDataByClerkId` to remove all database records associated with that user.

## Sync Services (`src/lib/services/*.ts`)

We use separated "Sync Services" to decouple Svelte state from Convex logic.

- `solvesSyncService.ts`
- `sessionsSyncService.ts`
- `caseStatesSyncService.ts`

These services:

- Hold a reference to the `ConvexClient`.
- Check `isAuthenticated` before attempting network calls.
- Queue updates (e.g., batching case state updates) to reduce network traffic.
- Handle the logic of `syncOnLogin` (Push+Pull) vs `pullFromConvex` (Pull only).

## Best Practices Implemented

1.  **Soft Deletes**: We use `deletedAt` fields to sync deletions across devices.
2.  **Batching**: `caseStatesSyncService` batches updates to prevent flooding the backend when dragging sliders/clicking rapidly.
3.  **Token Identifiers**: Convex uses `tokenIdentifier` (`issuer|subject`) to uniquely identify users, ensuring distinct data silos.
