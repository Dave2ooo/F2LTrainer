<script lang="ts">
	import { useQuery, useConvexClient } from 'convex-svelte';
	import { api } from '../convex/_generated/api.js';
	import { addSolve } from '../convex/solves.js';
	import { statisticsState } from './statisticsState.svelte.js';
	import { Button } from 'flowbite-svelte';

	const client = useConvexClient();

	async function addSolve_test() {
		const solveArray = statisticsState.allSolves;
		const solve = solveArray.at(-1);
		console.log(solve);

		if (solve) {
			await client.mutation(api.solves.addSolve, { solve });
		}
	}
</script>

<Button onclick={addSolve_test}>Add Solve</Button>
