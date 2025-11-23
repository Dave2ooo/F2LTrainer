export const DEFAULT_TOAST_DURATION = 3000;

export interface ToastNotification {
	id: number;
	message: string;
	type: 'success' | 'error';
	duration?: number;
	borderColor?: string;
}

let nextId = 0;

export const toastState = $state<{ notifications: ToastNotification[] }>({
	notifications: []
});

export function addToast(
	message: string,
	type: 'success' | 'error' = 'success',
	duration: number = DEFAULT_TOAST_DURATION,
	borderColor?: string
) {
	const id = nextId++;
	const toast: ToastNotification = { id, message, type, duration, borderColor };

	toastState.notifications = [...toastState.notifications, toast];

	return id;
}

export function removeToast(id: number) {
	toastState.notifications = toastState.notifications.filter((t) => t.id !== id);
}
