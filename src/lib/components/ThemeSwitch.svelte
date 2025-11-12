<script lang="ts">
	import { Toggle } from 'flowbite-svelte';
	import { getTheme, toggleTheme } from '$lib/theme.svelte';
</script>

<Toggle checked={getTheme() === 'dark'} onchange={toggleTheme}>Dark Mode</Toggle>
