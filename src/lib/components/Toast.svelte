<script lang="ts">
	import { CheckCircle, XCircle, X } from '@lucide/svelte';
	import { fly, fade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';

	let {
		message,
		type = 'success',
		duration = 3000,
		showIcon = true,
		onClose,
		borderColor
	}: {
		message: string;
		type?: 'success' | 'error';
		duration?: number;
		showIcon?: boolean;
		onClose?: () => void;
		borderColor?: string;
	} = $props();

	let toastStatus = $state(true);

	// Auto-close after duration
	$effect(() => {
		if (toastStatus) {
			const timer = setTimeout(() => {
				toastStatus = false;
				if (onClose) onClose();
			}, duration);

			return () => clearTimeout(timer);
		}
	});

	function handleDismiss() {
		toastStatus = false;
		if (onClose) onClose();
	}

	// Compute colors based on type or custom border color
	const iconBgClass = $derived(
		type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
	);

	const progressBarColor = $derived(borderColor || (type === 'success' ? '#10b981' : '#ef4444'));
</script>

{#if toastStatus}
	<div
		class="toast-wrapper"
		in:fly={{ x: -100, duration: 400, easing: cubicOut }}
		out:fade={{ duration: 200 }}
	>
		<!-- Main toast container with glassmorphism -->
		<div
			class="toast-container"
			style="--progress-color: {progressBarColor}; --duration: {duration}ms;"
		>
			<!-- Accent border on left -->
			<div
				class="accent-bar"
				style="background: {borderColor || (type === 'success' ? '#10b981' : '#ef4444')};"
			></div>

			<!-- Content area -->
			<div class="toast-content">
				{#if showIcon}
					<div class="icon-wrapper {iconBgClass}">
						{#if type === 'success'}
							<CheckCircle class="h-5 w-5" strokeWidth={2.5} />
						{:else}
							<XCircle class="h-5 w-5" strokeWidth={2.5} />
						{/if}
					</div>
				{/if}

				<span class="toast-message">{message}</span>

				<button
					type="button"
					class="dismiss-btn"
					onclick={handleDismiss}
					aria-label="Dismiss notification"
				>
					<X class="h-4 w-4" />
				</button>
			</div>

			<!-- Progress bar -->
			<div class="progress-bar"></div>
		</div>
	</div>
{/if}

<style>
	.toast-wrapper {
		pointer-events: auto;
	}

	.toast-container {
		position: relative;
		display: flex;
		flex-direction: column;
		min-width: 280px;
		max-width: 400px;
		overflow: hidden;
		border-radius: 12px;
		background: #1f2937;
		box-shadow:
			0 20px 25px -5px rgba(0, 0, 0, 0.3),
			0 8px 10px -6px rgba(0, 0, 0, 0.2),
			0 0 0 1px rgba(255, 255, 255, 0.05) inset;
	}

	:global(.dark) .toast-container {
		background: #1f2937;
	}

	:global(:not(.dark)) .toast-container {
		background: #ffffff;
		box-shadow:
			0 20px 25px -5px rgba(0, 0, 0, 0.1),
			0 8px 10px -6px rgba(0, 0, 0, 0.1),
			0 0 0 1px rgba(0, 0, 0, 0.05);
	}

	.accent-bar {
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		width: 4px;
		border-radius: 12px 0 0 12px;
	}

	.toast-content {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 14px 16px 14px 20px;
	}

	.icon-wrapper {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border-radius: 8px;
		flex-shrink: 0;
	}

	.toast-message {
		flex: 1;
		font-size: 0.9rem;
		font-weight: 500;
		color: #f9fafb;
		line-height: 1.4;
	}

	:global(:not(.dark)) .toast-message {
		color: #1f2937;
	}

	.dismiss-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border-radius: 6px;
		background: transparent;
		border: none;
		color: #9ca3af;
		cursor: pointer;
		transition: all 0.15s ease;
		flex-shrink: 0;
	}

	.dismiss-btn:hover {
		background: rgba(255, 255, 255, 0.1);
		color: #f9fafb;
	}

	:global(:not(.dark)) .dismiss-btn:hover {
		background: rgba(0, 0, 0, 0.05);
		color: #1f2937;
	}

	.progress-bar {
		height: 5px;
		background: var(--progress-color);
		animation: progress var(--duration) linear forwards;
		opacity: 0.8;
	}

	@keyframes progress {
		from {
			width: 100%;
		}
		to {
			width: 0%;
		}
	}
</style>
