// Small shared state for the 'beforeinstallprompt' flow
export type BeforeInstallPromptEventShape = Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export const pwaPrompt: { deferredPrompt: BeforeInstallPromptEventShape | null; installAvailable: boolean } = $state({
    deferredPrompt: null,
    installAvailable: false
});

if (typeof window !== 'undefined') {
    // Reflect the global value when it appears — useful for early-captured events
    if ((window as any).__pwaInstallAvailable) {
        pwaPrompt.installAvailable = true;
    }
}

export function clearPwaPrompt() {
    pwaPrompt.deferredPrompt = null;
    pwaPrompt.installAvailable = false;
    try {
        delete (window as any).__deferredPwaPrompt;
        delete (window as any).__pwaInstallAvailable;
    } catch (err) {
        /* ignore — defensive */
    }
}
