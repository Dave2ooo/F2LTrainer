/// <reference types="svelte-clerk/env" />

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	// Wake Lock API types
	interface WakeLockSentinel extends EventTarget {
		readonly released: boolean;
		readonly type: 'screen';
		release(): Promise<void>;
	}

	interface Navigator {
		wakeLock?: {
			request(type: 'screen'): Promise<WakeLockSentinel>;
		};
	}

	namespace svelteHTML {
		interface IntrinsicElements {
			'twisty-player': any;
		}
	}
}

export {};
