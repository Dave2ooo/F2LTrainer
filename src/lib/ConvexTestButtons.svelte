<script lang="ts">
	import { useQuery, useConvexClient } from 'convex-svelte';
	import { api } from '../convex/_generated/api.js';
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

	async function getSolves_test() {
		const solves = await client.query(
			api.solves.getSolvesForCurrentUser,
			{} // required, even if empty
		);
		console.log(solves);
	}
</script>

<Button onclick={addSolve_test}>Add Solve</Button>

<Button onclick={getSolves_test}>Get Solves</Button>
