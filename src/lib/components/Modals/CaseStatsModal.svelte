<script lang="ts">
	import { Badge } from 'flowbite-svelte';
	import Modal from '../Modal.svelte';
	import TwistyPlayer from '../TwistyPlayer.svelte';
	import { statistics, removeSolve } from '$lib/statisticsState.svelte';
	import {
		calculateBestTime,
		calculateAo5,
		calculateAo12,
		formatTime,
		getSolvesForCase
	} from '$lib/utils/statistics';
	import { globalState } from '$lib/globalState.svelte';
	import resolveStickerColors from '$lib/utils/resolveStickerColors';
	import { type CaseId, type GroupId, GROUP_DEFINITIONS } from '$lib/types/group';
	import { casesState } from '$lib/casesState.svelte';
	import Close from './Buttons/Close.svelte';

	import { Chart } from '@flowbite-svelte-plugins/chart';

	let { groupId, caseId }: { groupId: GroupId; caseId: CaseId } = $props();

	let open = $state(false);

	export function openModal() {
		open = true;
	}

	function onClose() {
		open = false;
	}

	function removeTime(index: number) {
		const solve = caseSolves[index];
		if (solve) {
			removeSolve(solve.id);
		}
	}

	const caseSolves = $derived(getSolvesForCase(statistics, groupId, caseId));
	const bestTime = $derived(calculateBestTime(caseSolves));
	const ao5 = $derived(calculateAo5(caseSolves));
	const ao12 = $derived(calculateAo12(caseSolves));
	const solvesCount = $derived(caseSolves.length);

	// Find the index of the best time
	const bestTimeIndex = $derived(
		bestTime !== null && caseSolves.length > 0
			? caseSolves.findIndex((s) => s.time === bestTime)
			: null
	);

	const [crossColor, frontColor] = $derived(
		resolveStickerColors(globalState.crossColor, globalState.frontColor)
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

	const chartSolves = $derived(caseSolves.filter((s) => s.time !== null));

	// Index mapping functions between caseSolves (includes nulls) and chartSolves (filtered)
	function caseSolvesIndexToChartIndex(caseSolvesIdx: number): number | null {
		if (caseSolvesIdx < 0 || caseSolvesIdx >= caseSolves.length) return null;
		if (caseSolves[caseSolvesIdx].time === null) return null;

		// Count non-null times before this index
		let chartIdx = 0;
		for (let i = 0; i < caseSolvesIdx; i++) {
			if (caseSolves[i].time !== null) chartIdx++;
		}
		return chartIdx;
	}

	function chartIndexToCaseSolvesIndex(chartIdx: number): number {
		if (chartIdx < 0 || chartIdx >= chartSolves.length) return -1;

		// Find the nth non-null time in caseSolves
		let count = 0;
		for (let i = 0; i < caseSolves.length; i++) {
			if (caseSolves[i].time !== null) {
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
				data: chartSolves.map((s) => parseFloat(((s.time as number) / 100).toFixed(2)))
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
			curve: 'smooth'
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
				formatter: function (val: number) {
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

<Modal bind:open {title} size="md" outsideclose={true} autoclose={false}>
	<div class="flex w-full flex-col items-center gap-0 md:gap-4">
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
				<div class="flex flex-col">
					<span class="text-sm text-gray-500 md:text-base dark:text-gray-400">Solves</span>
					<span class="text-xl font-bold md:text-2xl">{solvesCount}</span>
				</div>
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
					<span class="text-sm text-gray-500 md:text-base dark:text-gray-400">Best</span>
					<span class="text-xl font-bold md:text-2xl">{formatTime(bestTime)}</span>
				</div>
				<div class="flex flex-col">
					<span class="text-sm text-gray-500 md:text-base dark:text-gray-400">Ao5</span>
					<span class="text-xl font-bold md:text-2xl">{formatTime(ao5)}</span>
				</div>
				<div class="flex flex-col">
					<span class="text-sm text-gray-500 md:text-base dark:text-gray-400">Ao12</span>
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
							<Badge
								class="cursor-pointer text-sm md:text-base {hoveredIndex === realIndex ||
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
						{/each}
					</div>
				</div>
			</div>
		{/if}

		<Close {onClose} />
	</div>
</Modal>
