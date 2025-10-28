<script lang="ts">
	import { Alert, Button, Popover, Toast } from 'flowbite-svelte';
	import { slide } from 'svelte/transition';

	let toastStatus = $state(true);
	let duration = 2;

	setInterval(() => {
		toastStatus = toastStatus = false;
	}, duration * 1000);
</script>

<div class="flex gap-10">
	<Toast position="bottom-left" dismissable={false} transition={slide} bind:toastStatus>
		Set State to Unlearned
	</Toast>
</div>
