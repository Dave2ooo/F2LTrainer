<script lang="ts">
	import { Badge, Button, Dropdown, Checkbox, Select } from 'flowbite-svelte';
	import type { Solve, TrainMode } from '$lib/types/statisticsState';
	import { Funnel, Archive } from '@lucide/svelte';
	import Modal from '../Modal.svelte';
	import TwistyPlayer from '../TwistyPlayer.svelte';
	import { statisticsState } from '$lib/statisticsState.svelte';
	import {
		calculateBestTime,
		calculateAo5,
		calculateAo12,
		formatTime,
		getSolvesForCase,
		calculateRollingAo5,
		calculateRollingAo12
	} from '$lib/utils/statistics';
	import { sessionState, DEFAULT_SETTINGS } from '$lib/sessionState.svelte';
	import resolveStickerColors from '$lib/utils/resolveStickerColors';
	import { type CaseId, type GroupId, GROUP_DEFINITIONS } from '$lib/types/group';
	import { casesState } from '$lib/casesState.svelte';

	import { Chart } from '@flowbite-svelte-plugins/chart';

	let {
		groupId,
		caseId,
		open = $bindable(false)
	}: { groupId: GroupId; caseId: CaseId; open?: boolean } = $props();

	export function openModal() {
		open = true;
	}

	function removeTime(index: number) {
		const solve = caseSolves[index];
		if (solve) {
			statisticsState.removeSolve(solve.id);
		}
	}

	let selectedSessionIds = $state<string[]>([]);

	function toggleSessionFilter(id: string) {
		if (selectedSessionIds.includes(id)) {
			selectedSessionIds = selectedSessionIds.filter((sid) => sid !== id);
		} else {
			selectedSessionIds = [...selectedSessionIds, id];
		}
	}

	// Train type filter
	// Train type filter
	let trainTypeFilter = $state<TrainMode>('classic');

	// Detect solve type based on recorded fields
	function getSolveType(solve: Solve): TrainMode {
		return solve.trainMode;
	}

	const solvesInSession = $derived.by(() => {
		let solves = getSolvesForCase(statisticsState.allSolves, groupId, caseId);
		// Filter by session
		if (selectedSessionIds.length > 0) {
			solves = solves.filter(
				(s) => s.sessionId !== undefined && selectedSessionIds.includes(s.sessionId)
			);
		}
		return solves;
	});

	const trainTypeOptions = $derived.by(() => {
		const types = new Set<TrainMode>();
		for (const solve of solvesInSession) {
			types.add(getSolveType(solve));
		}
		const options = [];
		if (types.has('classic')) options.push({ value: 'classic', name: 'Standard Practice' });
		if (types.has('smart')) options.push({ value: 'smart', name: 'Smart Practice' });
		if (types.has('drill')) options.push({ value: 'drill', name: 'Drill' });
		return options;
	});

	$effect(() => {
		const validValues = trainTypeOptions.map((o) => o.value);
		if (validValues.length > 0 && !validValues.includes(trainTypeFilter)) {
			trainTypeFilter = validValues[0] as TrainMode;
		}
	});

	const caseSolves = $derived.by(() => {
		// Filter by train type and map time
		return solvesInSession
			.filter((s) => getSolveType(s) === trainTypeFilter)
			.map((s) => {
				let time = s.time;
				if (trainTypeFilter === 'smart') time = s.executionTime;
				if (trainTypeFilter === 'drill')
					time =
						s.recognitionTime !== undefined && s.executionTime !== undefined
							? s.recognitionTime + s.executionTime
							: undefined;
				return { ...s, time };
			});
	});
	const bestTime = $derived(calculateBestTime(caseSolves));
	const ao5 = $derived(calculateAo5(caseSolves));
	const ao12 = $derived(calculateAo12(caseSolves));
	const solvesCount = $derived(caseSolves.length);

	const timedCount = $derived(caseSolves.filter((s) => s.time !== undefined).length);
	const untimedCount = $derived(caseSolves.filter((s) => s.time === undefined).length);
	const hasMixedSolves = $derived(timedCount > 0 && untimedCount > 0);

	const sessionsWithSolves = $derived.by(() => {
		const solves = getSolvesForCase(statisticsState.allSolves, groupId, caseId);
		const sessionIds = new Set(solves.map((s) => s.sessionId));
		return sessionState.sessions.filter((s) => sessionIds.has(s.id));
	});

	// Find the index of the best time
	const bestTimeIndex = $derived(
		bestTime !== undefined && caseSolves.length > 0
			? caseSolves.findIndex((s) => s.time === bestTime)
			: null
	);

	const safeCrossColor = $derived(
		Array.isArray(sessionState.activeSession?.settings.crossColor)
			? sessionState.activeSession.settings.crossColor
			: DEFAULT_SETTINGS.crossColor || ['white']
	);
	const safeFrontColor = $derived(
		Array.isArray(sessionState.activeSession?.settings.frontColor)
			? sessionState.activeSession.settings.frontColor
			: DEFAULT_SETTINGS.frontColor || ['red']
	);

	const [crossColor, frontColor] = $derived(
		resolveStickerColors(safeCrossColor as any, safeFrontColor as any)
	);

	const caseState = $derived(casesState[groupId][caseId]);
	const title = $derived(GROUP_DEFINITIONS[groupId].editName + ' Case ' + caseId);

	let hoveredIndex: number | null = $state(null);
	let selectedIndex: number | null = $state(null);
	let bestTimeHovered: boolean = $state(false);
	let innerWidth = $state(0);

	const axisLabelColor = 'var(--color-chart-axis)';
	const axisFontSize = $derived(innerWidth < 768 ? '1rem' : '1.2rem');
	const tooltipFontSize = $derived(innerWidth < 768 ? '1rem' : '1rem'); // Does not work

	const chartSolves = $derived(caseSolves.filter((s) => s.time !== undefined));

	// Calculate rolling Ao5 and Ao12 for the chart
	const rollingAo5 = $derived(calculateRollingAo5(caseSolves));
	const rollingAo12 = $derived(calculateRollingAo12(caseSolves));

	// Create a map of solve ID to original index for efficient lookup
	const solveIdToIndex = $derived(new Map(caseSolves.map((solve, index) => [solve.id, index])));

	// Map rolling averages to chart data by finding corresponding indices
	// Since chartSolves filters out null times, we need to map back to original caseSolves indices
	const chartRollingAo5 = $derived(
		chartSolves.map((solve) => {
			// Find the index of this solve in the original caseSolves array
			const originalIndex = solveIdToIndex.get(solve.id);
			if (originalIndex === undefined) return null;
			const ao5 = rollingAo5[originalIndex];
			return ao5 !== undefined ? parseFloat((ao5 / 100).toFixed(2)) : null;
		})
	);

	const chartRollingAo12 = $derived(
		chartSolves.map((solve) => {
			// Find the index of this solve in the original caseSolves array
			const originalIndex = solveIdToIndex.get(solve.id);
			if (originalIndex === undefined) return null;
			const ao12 = rollingAo12[originalIndex];
			return ao12 !== undefined ? parseFloat((ao12 / 100).toFixed(2)) : null;
		})
	);

	// Index mapping functions between caseSolves (includes nulls) and chartSolves (filtered)
	function caseSolvesIndexToChartIndex(caseSolvesIdx: number): number | null {
		if (caseSolvesIdx < 0 || caseSolvesIdx >= caseSolves.length) return null;
		if (caseSolves[caseSolvesIdx].time === undefined) return null;

		// Count non-null times before this index
		let chartIdx = 0;
		for (let i = 0; i < caseSolvesIdx; i++) {
			if (caseSolves[i].time !== undefined) chartIdx++;
		}
		return chartIdx;
	}

	function chartIndexToCaseSolvesIndex(chartIdx: number): number {
		if (chartIdx < 0 || chartIdx >= chartSolves.length) return -1;

		// Find the nth non-null time in caseSolves
		let count = 0;
		for (let i = 0; i < caseSolves.length; i++) {
			if (caseSolves[i].time !== undefined) {
				if (count === chartIdx) return i;
				count++;
			}
		}
		return -1;
	}

	const chartOptions = $derived({
		chart: {
			type: 'line',
			height: 200,
			width: '100%',
			animations: {
				enabled: false
			},
			toolbar: {
				show: false
			},
			parentHeightOffset: 0,
			zoom: {
				enabled: false
			},
			events: {
				dataPointMouseEnter: function (event: any, chartContext: any, config: any) {
					// Convert chart index to caseSolves index
					hoveredIndex = chartIndexToCaseSolvesIndex(config.dataPointIndex);
				},
				dataPointMouseLeave: function (event: any, chartContext: any, config: any) {
					hoveredIndex = null;
				}
			}
		},
		series: [
			{
				name: 'Solve Time',
				data: chartSolves.map((s) => parseFloat((s.time! / 100).toFixed(2)))
			},
			{
				name: 'Ao5',
				data: chartRollingAo5
			},
			{
				name: 'Ao12',
				data: chartRollingAo12
			}
		],
		xaxis: {
			categories: chartSolves.map((_, i) => i + 1),
			labels: {
				show: false,
				style: {
					colors: axisLabelColor,
					fontSize: axisFontSize,
					fontFamily: 'Inter, sans-serif'
				}
			},
			axisBorder: {
				show: false
			},
			axisTicks: {
				show: false
			}
		},
		yaxis: {
			show: true,
			min: 0,
			labels: {
				formatter: function (val: number) {
					return Math.round(val).toString();
				},
				style: {
					colors: axisLabelColor,
					fontSize: axisFontSize,
					fontFamily: 'Inter, sans-serif'
				}
			}
		},
		grid: {
			show: false
		},
		dataLabels: {
			enabled: false
		},
		stroke: {
			curve: 'smooth',
			width: 2,
			colors: ['#1A56DB', '#10B981', '#F59E0B']
		},
		tooltip: {
			enabled: true,
			style: {
				fontSize: tooltipFontSize,
				fontFamily: 'Inter, sans-serif'
			},
			x: {
				show: false,
				formatter: function (val: any) {
					return 'Solve ' + val;
				}
			},
			y: {
				formatter: function (val: number | null) {
					if (val === null || val === undefined) return '-';
					return val.toFixed(2);
				}
			}
		},
		markers: {
			size: 0,
			discrete: (() => {
				const markers = [];

				// Add marker for hovered point
				if (hoveredIndex !== null) {
					const chartIdx = caseSolvesIndexToChartIndex(hoveredIndex);
					if (chartIdx !== null) {
						markers.push({
							seriesIndex: 0,
							dataPointIndex: chartIdx,
							fillColor: '#1A56DB',
							strokeColor: '#fff',
							size: 6,
							shape: 'circle'
						});
					}
				}

				// Add marker for best time when hovering over the "Best" stat
				if (bestTimeHovered && bestTimeIndex !== null && bestTimeIndex !== hoveredIndex) {
					const chartIdx = caseSolvesIndexToChartIndex(bestTimeIndex);
					if (chartIdx !== null) {
						markers.push({
							seriesIndex: 0,
							dataPointIndex: chartIdx,
							fillColor: '#10B981', // Green color for best time
							strokeColor: '#fff',
							size: 6,
							shape: 'circle'
						});
					}
				}

				return markers;
			})()
		}
	});
</script>

<svelte:window bind:innerWidth />

<Modal
	bind:open
	{title}
	size="md"
	outsideclose={true}
	autoclose={false}
	placement="top-center"
	class="mt-8"
>
	<div class="flex w-full flex-col items-center gap-4">
		<!-- Session Filters -->
		{#if sessionsWithSolves.length > 1}
			<div class="absolute top-2.5 right-12 z-20 md:right-14">
				<Button
					color="alternative"
					class="relative rounded-lg border-none !bg-transparent !p-1.5 text-gray-500 shadow-none transition-colors hover:bg-gray-100 hover:text-gray-900 focus:ring-0 focus:outline-none dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
				>
					<Funnel
						class="size-5 transition-colors {selectedSessionIds.length > 0
							? 'fill-primary-600 text-primary-600'
							: 'fill-none'}"
					/>
					{#if selectedSessionIds.length > 0}
						<span
							class="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary-600 px-1 text-[10px] font-bold text-white ring-2 ring-white dark:ring-gray-800"
						>
							{selectedSessionIds.length}
						</span>
					{/if}
				</Button>
				<Dropdown class="w-60 overflow-hidden rounded-xl shadow-xl" placement="bottom-end">
					<div
						class="bg-gray-50 px-4 py-2.5 text-sm font-semibold tracking-wide text-gray-500 uppercase dark:bg-gray-700 dark:text-gray-400"
					>
						Filter Sessions
					</div>
					<div class="flex max-h-[300px] flex-col overflow-y-auto p-2">
						<label
							class="flex cursor-pointer items-center rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-600"
						>
							<Checkbox
								checked={selectedSessionIds.length === 0}
								onchange={() => (selectedSessionIds = [])}
								class="me-2 cursor-pointer focus:ring-primary-500 dark:focus:ring-primary-600"
							/>
							<span class="text-base font-medium text-gray-900 dark:text-gray-100"
								>All Sessions</span
							>
						</label>
						<hr class="my-1 border-gray-200 dark:border-gray-600" />
						{#each sessionsWithSolves as session}
							<label
								class="flex cursor-pointer items-center rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-600"
							>
								<Checkbox
									checked={selectedSessionIds.includes(session.id)}
									onchange={() => toggleSessionFilter(session.id)}
									class="me-2 cursor-pointer focus:ring-primary-500 dark:focus:ring-primary-600"
								/>
								<span
									class="truncate text-base font-medium {session.archived
										? 'text-gray-500 dark:text-gray-400'
										: 'text-gray-900 dark:text-gray-100'}">{session.name}</span
								>
								{#if session.archived}
									<Archive class="ml-2 size-4 shrink-0 text-gray-400" />
								{/if}
							</label>
						{/each}
					</div>
				</Dropdown>
			</div>
		{/if}

		<!-- Train Type Filter -->
		{#if trainTypeOptions.length > 1}
			<div class="flex justify-center">
				<Select bind:value={trainTypeFilter} items={trainTypeOptions} placeholder="" class="w-80" />
			</div>
		{/if}

		<div class="flex w-full flex-row items-center justify-center gap-8">
			<TwistyPlayer
				{groupId}
				{caseId}
				algorithmSelection={caseState.algorithmSelection}
				customAlgorithm={caseState.customAlgorithm}
				side="right"
				{crossColor}
				{frontColor}
				experimentalDragInput="auto"
				class="size-40 md:size-50"
			/>

			<div class="flex min-w-[100px] flex-col gap-3 text-center">
				{#if hasMixedSolves}
					<div class="flex flex-col">
						<span class="text-secondary text-base">#Timed</span>
						<span class="text-xl font-bold md:text-2xl">{timedCount}</span>
					</div>
					<div class="flex flex-col">
						<span class="text-secondary text-base">#Untimed</span>
						<span class="text-xl font-bold md:text-2xl">{untimedCount}</span>
					</div>
				{:else}
					<div class="flex flex-col">
						<span class="text-secondary text-base">#Solves</span>
						<span class="text-xl font-bold md:text-2xl">{solvesCount}</span>
					</div>
				{/if}
				<div
					class="-m-2 flex cursor-pointer flex-col rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
					role="button"
					tabindex="0"
					onmouseenter={() => (bestTimeHovered = true)}
					onmouseleave={() => (bestTimeHovered = false)}
					onclick={() => {
						if (bestTimeIndex !== null) {
							hoveredIndex = hoveredIndex === bestTimeIndex ? null : bestTimeIndex;
						}
					}}
					onkeydown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							e.preventDefault();
							if (bestTimeIndex !== null) {
								hoveredIndex = hoveredIndex === bestTimeIndex ? null : bestTimeIndex;
							}
						}
					}}
				>
					<span class="text-secondary text-base">Best</span>
					<span class="text-xl font-bold md:text-2xl">{formatTime(bestTime)}</span>
				</div>
				<div class="flex flex-col">
					<span class="text-secondary text-base">Ao5</span>
					<span class="text-xl font-bold md:text-2xl">{formatTime(ao5)}</span>
				</div>
				<div class="flex flex-col">
					<span class="text-secondary text-base">Ao12</span>
					<span class="text-xl font-bold md:text-2xl">{formatTime(ao12)}</span>
				</div>
			</div>
		</div>

		{#if caseSolves.length > 0}
			<div class="w-full max-w-none">
				<div class="mb-0 flex w-full justify-between md:mb-2">
					<h5 class="text-xl leading-none font-bold text-gray-900 md:text-2xl dark:text-white">
						History
					</h5>
				</div>
				{#key tooltipFontSize}
					<Chart options={chartOptions as any} />
				{/key}
				<div
					class="mt-4 grid w-full grid-cols-1 items-center justify-between border-t border-gray-200 pt-4 dark:border-gray-700"
				>
					<div
						class="flex max-h-40 w-full flex-wrap gap-2 overflow-y-auto rounded-lg border border-gray-500 bg-gray-50 p-2 dark:border-gray-600 dark:bg-gray-700"
					>
						{#each caseSolves.slice().reverse() as solve, index}
							{@const realIndex = caseSolves.length - 1 - index}
							{#if solve.time !== undefined}
								<Badge
									class="cursor-pointer text-sm {hoveredIndex === realIndex ||
									selectedIndex === realIndex
										? 'ring-2 ring-primary-500'
										: ''}"
									border
									dismissable={selectedIndex === realIndex}
									onclick={() => (selectedIndex = selectedIndex === realIndex ? null : realIndex)}
									onmouseenter={() => (hoveredIndex = realIndex)}
									onmouseleave={() => (hoveredIndex = null)}
									onclose={(e: any) => {
										e?.preventDefault?.();
										removeTime(realIndex);
										selectedIndex = null;
									}}>{formatTime(solve.time)}</Badge
								>
							{/if}
						{/each}
					</div>
				</div>
			</div>
		{/if}
	</div>
</Modal>
