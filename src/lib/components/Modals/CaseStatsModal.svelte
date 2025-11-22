<script lang="ts">
	import { Modal, Badge, Card } from 'flowbite-svelte';
	import TwistyPlayer from '../TwistyPlayer.svelte';
	import { statistics } from '$lib/statisticsState.svelte';
	import { calculateBestTime, calculateAo5, formatTime } from '$lib/utils/statistics';
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
		statistics[groupId][caseId].times.splice(index, 1);
		// Also decrement solves count if it tracks total solves separately
		if (statistics[groupId][caseId].solves > 0) {
			statistics[groupId][caseId].solves--;
		}
	}

	const caseStats = $derived(statistics[groupId][caseId]);
	const times = $derived(caseStats.times);
	const bestTime = $derived(calculateBestTime(times));
	const ao5 = $derived(calculateAo5(times));
	// const solves = $derived(caseStats.solves);
	const solves = $derived(caseStats.times.length);

	const [crossColor, frontColor] = $derived(
		resolveStickerColors(globalState.crossColor, globalState.frontColor)
	);

	const caseState = casesState[groupId][caseId];
	const title = GROUP_DEFINITIONS[groupId].editName + ' Case ' + caseId;

	let hoveredIndex: number | null = $state(null);
	let innerWidth = $state(0);

	const axisLabelColor = 'var(--color-chart-axis)';
	const axisFontSize = $derived(innerWidth < 768 ? '1rem' : '1.2rem');
	const tooltipFontSize = $derived(innerWidth < 768 ? '1rem' : '1rem'); // Does not work

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
				data: times.map((t) => parseFloat(t.toFixed(2)))
			}
		],
		xaxis: {
			categories: times.map((_, i) => i + 1),
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
			labels: {
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
			}
		},
		markers: {
			size: 0,
			discrete: hoveredIndex !== null ? [{
				seriesIndex: 0,
				dataPointIndex: hoveredIndex,
				fillColor: '#1A56DB',
				strokeColor: '#fff',
				size: 6,
				shape: "circle"
			}] : []
		}
	});
</script>

<svelte:window bind:innerWidth />

<Modal bind:open {title} size="sm" outsideclose={true} autoclose={false}>
	<div class="flex flex-col items-center gap-4">
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

		<div class="grid grid-cols-3 gap-4 text-center w-full">
			<div class="flex flex-col">
				<span class="text-sm md:text-base text-gray-500 dark:text-gray-400">Solves</span>
				<span class="text-xl md:text-2xl font-bold">{solves}</span>
			</div>
			<div class="flex flex-col">
				<span class="text-sm md:text-base text-gray-500 dark:text-gray-400">Best</span>
				<span class="text-xl md:text-2xl font-bold">{formatTime(bestTime)}</span>
			</div>
			<div class="flex flex-col">
				<span class="text-sm md:text-base text-gray-500 dark:text-gray-400">Ao5</span>
				<span class="text-xl md:text-2xl font-bold">{formatTime(ao5)}</span>
			</div>
		</div>

		{#if times.length > 0}
			<Card class="w-full shadow-none border-0 sm:p-0">
				<div class="flex justify-between mb-4">
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
						{#each times.slice().reverse() as time, index}
							<Badge
								class="text-sm md:text-base cursor-pointer {hoveredIndex === times.length - 1 - index
									? 'ring-2 ring-primary-500'
									: ''}"
								border
								dismissable
								onmouseenter={() => (hoveredIndex = times.length - 1 - index)}
								onmouseleave={() => (hoveredIndex = null)}
								onclose={(e: any) => {
									e?.preventDefault?.();
									removeTime(times.length - 1 - index);
								}}>{formatTime(time)}</Badge
							>
						{/each}
					</div>
				</div>
			</Card>
		{/if}

		<Close {onClose} />
	</div>
</Modal>
