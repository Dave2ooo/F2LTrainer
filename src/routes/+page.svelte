<script lang="ts">
	import { Button, Heading, Dropdown, DropdownItem } from 'flowbite-svelte';
	import { ChevronDownOutline } from 'flowbite-svelte-icons';
	import Toast from '$lib/components/Toast.svelte';
	import { casesStatic, globalState } from '$lib/globalState.svelte';
	import SelectView from '$lib/components/SelectView.svelte';

	console.log('casesStatic', casesStatic);
</script>

<Heading>F2L Trainer</Heading>

<Button
	>Dropdown button<ChevronDownOutline class="ms-2 h-6 w-6 text-white dark:text-white" /></Button
>
<Dropdown simple>
	<DropdownItem
		onclick={() => {
			globalState.frontColor = 'red';
		}}>Red</DropdownItem
	>
	<DropdownItem
		onclick={() => {
			globalState.frontColor = 'green';
		}}>Green</DropdownItem
	>
	<DropdownItem
		onclick={() => {
			globalState.frontColor = 'orange';
		}}>Orange</DropdownItem
	>
	<DropdownItem
		onclick={() => {
			globalState.frontColor = 'blue';
		}}>Blue</DropdownItem
	>
</Dropdown>

<SelectView />

<Button class="fixed right-4 bottom-4 z-50">Start Training</Button>

<Toast />
)
