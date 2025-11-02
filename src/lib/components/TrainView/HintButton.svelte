<script lang="ts">
	interface Props {
		alg: string;
		visible: boolean;
	}

	let { alg, visible }: Props = $props();
</script>

{#if visible}
	<span>{alg}</span>
{/if}
