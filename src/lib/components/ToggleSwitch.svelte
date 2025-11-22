<script lang="ts">
	import type { Side } from '$lib/types/Side';

	let {
		selected = $bindable(),
		leftLabel = 'Left',
		rightLabel = 'Right'
	}: { selected: Side; leftLabel?: string; rightLabel?: string } = $props();

	function handleChange(side: Side) {
		selected = side;
	}
</script>

<div class="switch-container">
	<div class="switch" role="radiogroup" aria-label="Select side">
		<input
			type="radio"
			id="switch-left"
			name="switch"
			value="left"
			checked={selected === 'left'}
			onchange={() => handleChange('left')}
			aria-label="Left side"
		/>
		<label for="switch-left">{leftLabel}</label>
		<input
			type="radio"
			id="switch-right"
			name="switch"
			value="right"
			checked={selected === 'right'}
			onchange={() => handleChange('right')}
			aria-label="Right side"
		/>
		<label for="switch-right">{rightLabel}</label>
		<div class="indicator" class:right={selected === 'right'}></div>
	</div>
</div>

<style>
	.switch-container {
		display: inline-block;
		position: relative;
	}

	.switch {
		display: flex;
		position: relative;
		width: 200px;
		height: 50px;
		background: transparent;
		overflow: hidden;
		align-items: center;
		justify-content: space-around;
	}

	.switch input {
		display: none;
	}

	.switch label {
		flex: 1;
		text-align: center;
		line-height: 50px;
		font-weight: bold;
		cursor: pointer;
		position: relative;
		z-index: 1;
		color: rgb(119 119 119 / 1);
		transition: color 0.3s ease;
	}

	.switch input:checked + label {
		color: var(--color-primary-600);
	}

	:global(.dark) .switch input:checked + label {
		color: var(--color-primary-600);
	}

	:global(.dark) .switch label {
		color: rgb(170 170 170 / 1);
	}

	.indicator {
		position: absolute;
		bottom: 0;
		height: 4px;
		width: 50%;
		background-color: var(--color-primary-600);
		transition: transform 0.15s;
		left: 0;
	}

	:global(.dark) .indicator {
		background-color: var(--color-primary-600);
	}

	.indicator.right {
		transform: translateX(100%);
		background-color: var(--color-primary-600);
	}
</style>
