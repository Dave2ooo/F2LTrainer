<script lang="ts">
	import { Modal, Badge, Card } from 'flowbite-svelte';
	import TwistyPlayer from '../TwistyPlayer.svelte';
	import { statistics, removeSolve } from '$lib/statisticsState.svelte';
	import { calculateBestTime, calculateAo5, calculateAo12, formatTime, getSolvesForCase } from '$lib/utils/statistics';
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

	const caseState = casesState[groupId][caseId];
	const title = GROUP_DEFINITIONS[groupId].editName + ' Case ' + caseId;

	let hoveredIndex: number | null = $state(null);
	let selectedIndex: number | null = $state(null);
	let bestTimeHovered: boolean = $state(false);
	let innerWidth = $state(0);

	const axisLabelColor = 'var(--color-chart-axis)';
	const axisFontSize = $derived(innerWidth < 768 ? '1rem' : '1.2rem');
	const tooltipFontSize = $derived(innerWidth < 768 ? '1rem' : '1rem'); // Does not work

	const chartSolves = $derived(caseSolves.filter((s) => s.time !== null));

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
					hoveredIndex = config.dataPointIndex;
				},
				dataPointMouseLeave: function (event: any, chartContext: any, config: any) {
					hoveredIndex = null;
				}
			}
		},
		series: [
			{
				name: 'Solve Time',
				data: chartSolves.map((s) => parseFloat((s.time as number).toFixed(2)))
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
					markers.push({
						seriesIndex: 0,
						dataPointIndex: hoveredIndex,
						fillColor: '#1A56DB',
						strokeColor: '#fff',
						size: 6,
						shape: "circle"
					});
				}
				
				// Add marker for best time when hovering over the "Best" stat
				if (bestTimeHovered && bestTimeIndex !== null && bestTimeIndex !== hoveredIndex) {
					markers.push({
						seriesIndex: 0,
						dataPointIndex: bestTimeIndex,
						fillColor: '#10B981', // Green color for best time
						strokeColor: '#fff',
						size: 6,
						shape: "circle"
					});
				}
				
				return markers;
			})()
		}
	});
</script>

<svelte:window bind:innerWidth />

<Modal bind:open {title} size="sm" outsideclose={true} autoclose={false}>
	<div class="flex flex-col items-center gap-0 md:gap-4">
		<div class="flex flex-row items-center gap-8">
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

			<div class="flex flex-col gap-3 text-center min-w-[100px]">
				<div class="flex flex-col">
					<span class="text-sm md:text-base text-gray-500 dark:text-gray-400">Solves</span>
					<span class="text-xl md:text-2xl font-bold">{solvesCount}</span>
				</div>
				<div 
					class="flex flex-col cursor-pointer transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg p-2 -m-2"
					role="button"
					tabindex="0"
					onmouseenter={() => bestTimeHovered = true}
					onmouseleave={() => bestTimeHovered = false}
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
					<span class="text-sm md:text-base text-gray-500 dark:text-gray-400">Best</span>
					<span class="text-xl md:text-2xl font-bold">{formatTime(bestTime)}</span>
				</div>
				<div class="flex flex-col">
					<span class="text-sm md:text-base text-gray-500 dark:text-gray-400">Ao5</span>
					<span class="text-xl md:text-2xl font-bold">{formatTime(ao5)}</span>
				</div>
				<div class="flex flex-col">
					<span class="text-sm md:text-base text-gray-500 dark:text-gray-400">Ao12</span>
					<span class="text-xl md:text-2xl font-bold">{formatTime(ao12)}</span>
				</div>
			</div>
		</div>

		{#if caseSolves.length > 0}
			<Card class="w-full shadow-none border-0 sm:p-0">
				<div class="flex justify-between mb-0 md:mb-2">
					<h5 class="text-xl md:text-2xl font-bold leading-none text-gray-900 dark:text-white">
						History
					</h5>
				</div>
				{#key tooltipFontSize}
					<Chart options={chartOptions as any} />
				{/key}
				<div
					class="grid grid-cols-1 items-center justify-between border-t border-gray-200 dark:border-gray-700 mt-4 pt-4"
				>
					<div class="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 border border-gray-500 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700">
						{#each caseSolves.slice().reverse() as solve, index}
							{@const realIndex = caseSolves.length - 1 - index}
							<Badge
								class="text-sm md:text-base cursor-pointer {hoveredIndex === realIndex ||
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
			</Card>
		{/if}

		<Close {onClose} />
	</div>
</Modal>
