<script lang="ts">
	import { Button, Heading, Dropdown, DropdownItem } from 'flowbite-svelte';
	import { ChevronDownOutline } from 'flowbite-svelte-icons';
	import Toast from '$lib/components/Toast.svelte';
	import { createGroupState, GROUP_DEFINITIONS } from '$lib/types/group';
	import { GROUP_SCRAMBLES, GROUP_ALGORITHMS } from '$lib/data';
	import { globalState } from '$lib/globalState.svelte';
	import SelectView from '$lib/components/SelectView.svelte';

	// let group = createGroupState('basic', GROUP_DEFINITIONS.basic);
	// console.log('group', group);

	console.log('GROUP_DEFINITIONS', GROUP_DEFINITIONS);
	// console.log('GROUP_SCRAMBLES', GROUP_SCRAMBLES);
	console.log('GROUP_ALGORITHMS', GROUP_ALGORITHMS);
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
