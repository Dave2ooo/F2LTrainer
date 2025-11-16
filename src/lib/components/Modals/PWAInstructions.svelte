<script lang="ts">
	import { Modal } from 'flowbite-svelte';

	let open = $state(false);

	export function openModal() {
		open = true;
	}
</script>

<Modal bind:open title="Install App" size="lg" outsideclose={true} autoclose={false}>
	<!-- Make the iframe fill the modal width and set a responsive height -->
	<iframe
		title="PWA install instructions"
		src="https://www.cdc.gov/niosh/mining/tools/installpwa.html"
		frameborder="0"
		class="h-[60vh] min-h-[360px] w-full border-0"
	></iframe>
</Modal>
