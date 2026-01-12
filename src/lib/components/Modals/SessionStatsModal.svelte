<script lang="ts">
	import Modal from '../Modal.svelte';
	import { P, Select } from 'flowbite-svelte';
	import type { Solve, TrainMode } from '$lib/types/statisticsState';
	import { Chart } from '@flowbite-svelte-plugins/chart';
	import { ArrowUp, ArrowDown, ChartNoAxesColumn } from '@lucide/svelte';
	import { statisticsState } from '$lib/statisticsState.svelte';
	import { sessionState } from '$lib/sessionState.svelte';
	import CaseStatsModal from './CaseStatsModal.svelte';
	import {
		formatTime,
		calculateBestTime,
		calculateMean,
		calculateAo5,
		calculateAo12,
		calculateRollingAo5,
		calculateRollingAo12
	} from '$lib/utils/statistics';
	import { GROUP_DEFINITIONS, type GroupId, type CaseId } from '$lib/types/group';
	import { getCaseName } from '$lib/casesState.svelte';
	import { casesStatic } from '$lib/casesStatic';
	import { createSolveChartOptions } from '$lib/utils/chartConfig';

	// Props - sessionId is optional (shows active session if not provided), open is bindable
	let { sessionId = undefined, open = $bindable(false) }: { sessionId?: string; open?: boolean } =
		$props();

	let innerWidth = $state(0);

	// Case Stats Modal state
	let caseStatsOpen = $state(false);
	let currentStatsCase = $state<{ groupId: GroupId; caseId: CaseId } | null>(null);

	function openCaseStats(groupId: GroupId, caseId: CaseId) {
		currentStatsCase = { groupId, caseId };
		caseStatsOpen = true;
	}

	// Sorting state
	type SortColumn = 'case' | 'count' | 'timedCount' | 'untimedCount' | 'best' | 'avg';
	type SortDirection = 'asc' | 'desc';
	let sortColumn = $state<SortColumn>('count');
	let sortDirection = $state<SortDirection>('desc');

	// Group order for case sorting
	const GROUP_ORDER: Record<GroupId, number> = {
		basic: 0,
		basicBack: 1,
		advanced: 2,
		expert: 3
	};

	function toggleSort(column: SortColumn) {
		if (sortColumn === column) {
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			sortColumn = column;
			// Default direction based on column
			sortDirection = column === 'case' ? 'asc' : 'desc';
		}
	}

	// Selected case for filtering chart
	let selectedCase = $state<{ groupId: GroupId; caseId: CaseId } | null>(null);

	function toggleCaseSelection(groupId: GroupId, caseId: CaseId) {
		if (selectedCase?.groupId === groupId && selectedCase?.caseId === caseId) {
			selectedCase = null; // Deselect
		} else {
			selectedCase = { groupId, caseId }; // Select
		}
	}

	export function openModal() {
		open = true;
	}

	// Get session solves - use provided sessionId or fall back to active session
	const sessionSolves = $derived(
		sessionId
			? statisticsState.allSolves.filter((s) => s.sessionId === sessionId)
			: statisticsState.statistics
	);
	const sessionName = $derived(
		sessionId
			? (sessionState.sessions.find((s) => s.id === sessionId)?.name ?? 'Session')
			: (sessionState.activeSession?.name ?? 'Session')
	);

	// Train type filter
	let trainTypeFilter = $state<TrainMode>('classic');

	// Detect solve type based on recorded fields
	function getSolveType(solve: Solve): TrainMode {
		return solve.trainMode;
	}

	const trainTypeOptions = $derived.by(() => {
		const types = new Set<TrainMode>();
		for (const solve of sessionSolves) {
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

	// Solves filtered by train type and with time mapped
	const trainModeSolves = $derived.by(() => {
		return sessionSolves
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

	// Filtered solves based on case selection (subset of trainModeSolves)
	const displaySolves = $derived.by(() => {
		const selected = selectedCase;
		if (selected) {
			return trainModeSolves.filter(
				(s) => s.groupId === selected.groupId && s.caseId === selected.caseId
			);
		}
		return trainModeSolves;
	});

	// Summary statistics (based on selection)
	const solvesCount = $derived(displaySolves.length);
	const timedCount = $derived(displaySolves.filter((s) => s.time !== undefined).length);
	const untimedCount = $derived(displaySolves.filter((s) => s.time === undefined).length);
	const hasMixedSolves = $derived(timedCount > 0 && untimedCount > 0);
	const bestTime = $derived(calculateBestTime(displaySolves));
	const meanTime = $derived(calculateMean(displaySolves));
	// Drill specific means
	const meanRec = $derived(
		trainTypeFilter === 'drill'
			? calculateMean(displaySolves.map((s) => ({ ...s, time: s.recognitionTime }) as Solve))
			: undefined
	);
	const meanExec = $derived(
		trainTypeFilter === 'drill'
			? calculateMean(displaySolves.map((s) => ({ ...s, time: s.executionTime }) as Solve))
			: undefined
	);
	const ao5 = $derived(calculateAo5(displaySolves));
	const ao12 = $derived(calculateAo12(displaySolves));

	// Date range
	const dateRange = $derived.by(() => {
		if (sessionSolves.length === 0) return null;
		const timestamps = sessionSolves.map((s) => s.timestamp);
		const firstDate = new Date(Math.min(...timestamps));
		const lastDate = new Date(Math.max(...timestamps));

		const formatDate = (d: Date) =>
			d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

		if (firstDate.toDateString() === lastDate.toDateString()) {
			return formatDate(firstDate);
		}
		return `${formatDate(firstDate)} — ${formatDate(lastDate)}`;
	});

	// Chart data (based on selection)
	const chartSolves = $derived(displaySolves.filter((s) => s.time !== undefined));
	const rollingAo5 = $derived(calculateRollingAo5(displaySolves));
	const rollingAo12 = $derived(calculateRollingAo12(displaySolves));

	const solveIdToIndex = $derived(new Map(displaySolves.map((solve, index) => [solve.id, index])));

	const chartRollingAo5 = $derived(
		chartSolves.map((solve) => {
			const originalIndex = solveIdToIndex.get(solve.id);
			if (originalIndex === undefined) return null;
			const ao5Val = rollingAo5[originalIndex];
			return ao5Val !== undefined ? parseFloat((ao5Val / 100).toFixed(2)) : null;
		})
	);

	const chartRollingAo12 = $derived(
		chartSolves.map((solve) => {
			const originalIndex = solveIdToIndex.get(solve.id);
			if (originalIndex === undefined) return null;
			const ao12Val = rollingAo12[originalIndex];
			return ao12Val !== undefined ? parseFloat((ao12Val / 100).toFixed(2)) : null;
		})
	);

	const axisFontSize = $derived(innerWidth < 768 ? '0.875rem' : '1rem');

	const chartOptions = $derived(
		createSolveChartOptions({
			height: 180,
			axisFontSize,
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
			categories: chartSolves.map((_, i) => i + 1),
			showLegend: true
		})
	);

	// Case breakdown - group solves by case
	type CaseBreakdown = {
		groupId: GroupId;
		caseId: CaseId;
		displayName: string;
		count: number;
		timedCount: number;
		untimedCount: number;
		best: number | undefined;
		mean: number | undefined;
	};

	const caseBreakdown = $derived.by(() => {
		const caseMap = new Map<
			string,
			{ groupId: GroupId; caseId: CaseId; times: number[]; untimedCount: number }
		>();

		for (const solve of trainModeSolves) {
			const key = `${solve.groupId}-${solve.caseId}`;
			if (!caseMap.has(key)) {
				caseMap.set(key, {
					groupId: solve.groupId,
					caseId: solve.caseId,
					times: [],
					untimedCount: 0
				});
			}
			const caseEntry = caseMap.get(key)!;
			if (solve.time !== undefined) {
				caseEntry.times.push(solve.time);
			} else {
				caseEntry.untimedCount++;
			}
		}

		const breakdown: CaseBreakdown[] = [];
		for (const [_, data] of caseMap) {
			const caseData = casesStatic[data.groupId]?.[data.caseId];
			const caseName = caseData ? getCaseName(caseData) : String(data.caseId);
			const groupName = GROUP_DEFINITIONS[data.groupId]?.editName ?? data.groupId;

			breakdown.push({
				groupId: data.groupId,
				caseId: data.caseId,
				displayName: `${groupName} #${caseName}`,
				count: data.times.length + data.untimedCount,
				timedCount: data.times.length,
				untimedCount: data.untimedCount,
				best: data.times.length > 0 ? Math.min(...data.times) : undefined,
				mean:
					data.times.length > 0
						? Math.round(data.times.reduce((a, b) => a + b, 0) / data.times.length)
						: undefined
			});
		}

		return breakdown;
	});

	// Sorted case breakdown
	const sortedCaseBreakdown = $derived.by(() => {
		return [...caseBreakdown].sort((a, b) => {
			let comparison = 0;

			switch (sortColumn) {
				case 'case':
					// Sort by group order first, then by caseId
					const groupDiff = GROUP_ORDER[a.groupId] - GROUP_ORDER[b.groupId];
					comparison = groupDiff !== 0 ? groupDiff : a.caseId - b.caseId;
					break;
				case 'count':
					comparison = a.count - b.count;
					break;
				case 'timedCount':
					comparison = a.timedCount - b.timedCount;
					break;
				case 'untimedCount':
					comparison = a.untimedCount - b.untimedCount;
					break;
				case 'best':
					// Null values go to the end
					if (a.best === undefined && b.best === undefined) comparison = 0;
					else if (a.best === undefined) comparison = 1;
					else if (b.best === undefined) comparison = -1;
					else comparison = a.best - b.best;
					break;
				case 'avg':
					// Null values go to the end
					if (a.mean === undefined && b.mean === undefined) comparison = 0;
					else if (a.mean === undefined) comparison = 1;
					else if (b.mean === undefined) comparison = -1;
					else comparison = a.mean - b.mean;
					break;
			}

			return sortDirection === 'asc' ? comparison : -comparison;
		});
	});
</script>

<svelte:window bind:innerWidth />

<Modal
	bind:open
	title={sessionName}
	size="lg"
	outsideclose={true}
	autoclose={false}
	placement="top-center"
	class="mt-8"
>
	<div class="flex w-full flex-col gap-4">
		<!-- Date Range -->
		{#if dateRange}
			<p class="-mt-2 text-center text-sm text-gray-500 dark:text-gray-400">{dateRange}</p>
		{/if}

		<!-- Train Type Filter -->
		{#if trainTypeOptions.length > 1}
			<div class="flex justify-center">
				<Select bind:value={trainTypeFilter} items={trainTypeOptions} placeholder="" class="w-64" />
			</div>
		{/if}

		<!-- Summary Stats Grid -->
		<div
			class="grid gap-3 text-center {trainTypeFilter === 'drill'
				? 'grid-cols-3 sm:grid-cols-7'
				: 'grid-cols-3 sm:grid-cols-5'}"
		>
			{#if hasMixedSolves}
				<!-- Mixed: Show split card -->
				<div class="stat-card row-span-2 sm:row-span-1">
					<span class="text-secondary sm:text-base">Solves</span>
					<div class="flex h-full flex-col justify-center gap-1 sm:gap-0">
						<div class="flex items-center justify-center gap-2">
							<span class="text-xs text-gray-500 dark:text-gray-400">Timed</span>
							<span class="font-mono text-lg leading-tight font-bold text-gray-900 dark:text-white"
								>{timedCount}</span
							>
						</div>
						<div class="flex items-center justify-center gap-2">
							<span class="text-xs text-gray-500 dark:text-gray-400">Untimed</span>
							<span class="font-mono text-lg leading-tight font-bold text-gray-900 dark:text-white"
								>{untimedCount}</span
							>
						</div>
					</div>
				</div>
			{:else}
				<!-- All same type: Show single card -->
				<div class="stat-card row-span-2 sm:row-span-1">
					<span class="text-secondary sm:text-base">Solves</span>
					<div class="flex h-full items-center justify-center">
						<span class="font-mono text-lg font-bold text-gray-900 dark:text-white"
							>{solvesCount}</span
						>
					</div>
				</div>
			{/if}
			<div class="stat-card">
				<span class="text-secondary sm:text-base">Best</span>
				<span class="font-mono text-lg font-bold text-green-600 dark:text-green-400"
					>{formatTime(bestTime)}</span
				>
			</div>
			<!-- Mean Time -->
			<div class="stat-card">
				<span class="text-secondary sm:text-base">Mean</span>
				<span class="font-mono text-lg leading-tight font-bold text-gray-900 dark:text-white"
					>{formatTime(meanTime)}</span
				>
			</div>

			<!-- Drill Split Stats -->
			{#if trainTypeFilter === 'drill'}
				<div class="stat-card">
					<span class="text-secondary sm:text-base">Mean Rec</span>
					<span class="font-mono text-lg leading-tight font-bold text-gray-900 dark:text-white"
						>{formatTime(meanRec)}</span
					>
				</div>
				<div class="stat-card">
					<span class="text-secondary sm:text-base">Mean Exec</span>
					<span class="font-mono text-lg leading-tight font-bold text-gray-900 dark:text-white"
						>{formatTime(meanExec)}</span
					>
				</div>
			{/if}

			<!-- Ao5 -->
			<div class="stat-card">
				<span class="text-secondary sm:text-base">Ao5</span>
				<span class="font-mono text-lg font-bold text-gray-900 dark:text-white"
					>{formatTime(ao5)}</span
				>
			</div>
			<div class="stat-card">
				<span class="text-secondary sm:text-base">Ao12</span>
				<span class="font-mono text-lg font-bold text-gray-900 dark:text-white"
					>{formatTime(ao12)}</span
				>
			</div>
		</div>

		<!-- Progress Chart -->
		{#if chartSolves.length > 0}
			<div class="w-full">
				<h4 class="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Progress</h4>
				<Chart options={chartOptions as any} />
			</div>
		{/if}

		<!-- Case Breakdown -->
		{#if caseBreakdown.length > 0}
			<div class="w-full">
				<h4 class="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Case Breakdown</h4>
				<div
					class="max-h-72 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-600"
				>
					<table class="w-full text-left text-sm">
						<thead
							class="sticky top-0 bg-gray-100 text-xs text-gray-600 uppercase dark:bg-gray-700 dark:text-gray-400"
						>
							<tr>
								<th
									class="cursor-pointer px-2 py-2 transition-colors select-none hover:bg-gray-200 dark:hover:bg-gray-600"
									onclick={() => toggleSort('case')}
								>
									<span class="flex items-center gap-1">
										Case
										<span class={sortColumn === 'case' ? 'opacity-100' : 'opacity-0'}>
											{#if sortDirection === 'asc' || sortColumn !== 'case'}
												<ArrowUp class="size-3" />
											{:else}
												<ArrowDown class="size-3" />
											{/if}
										</span>
									</span>
								</th>
								{#if hasMixedSolves}
									<!-- Mixed: Show two columns -->
									<th
										class="cursor-pointer px-2 py-2 text-center transition-colors select-none hover:bg-gray-200 dark:hover:bg-gray-600"
										onclick={() => toggleSort('timedCount')}
									>
										<span class="flex items-center justify-center gap-1">
											Timed
											<span class={sortColumn === 'timedCount' ? 'opacity-100' : 'opacity-0'}>
												{#if sortDirection === 'asc' && sortColumn === 'timedCount'}
													<ArrowUp class="size-3" />
												{:else}
													<ArrowDown class="size-3" />
												{/if}
											</span>
										</span>
									</th>
									<th
										class="cursor-pointer px-2 py-2 text-center transition-colors select-none hover:bg-gray-200 dark:hover:bg-gray-600"
										onclick={() => toggleSort('untimedCount')}
									>
										<span class="flex items-center justify-center gap-1">
											Untimed
											<span class={sortColumn === 'untimedCount' ? 'opacity-100' : 'opacity-0'}>
												{#if sortDirection === 'asc' && sortColumn === 'untimedCount'}
													<ArrowUp class="size-3" />
												{:else}
													<ArrowDown class="size-3" />
												{/if}
											</span>
										</span>
									</th>
								{:else}
									<!-- All same type: Show single column -->
									<th
										class="cursor-pointer px-2 py-2 text-center transition-colors select-none hover:bg-gray-200 dark:hover:bg-gray-600"
										onclick={() => toggleSort('count')}
									>
										<span class="flex items-center justify-center gap-1">
											Count
											<span class={sortColumn === 'count' ? 'opacity-100' : 'opacity-0'}>
												{#if sortDirection === 'asc' && sortColumn === 'count'}
													<ArrowUp class="size-3" />
												{:else}
													<ArrowDown class="size-3" />
												{/if}
											</span>
										</span>
									</th>
								{/if}
								<th
									class="cursor-pointer px-2 py-2 text-right transition-colors select-none hover:bg-gray-200 dark:hover:bg-gray-600"
									onclick={() => toggleSort('best')}
								>
									<span class="flex items-center justify-end gap-1">
										Best
										<span class={sortColumn === 'best' ? 'opacity-100' : 'opacity-0'}>
											{#if sortDirection === 'asc' && sortColumn === 'best'}
												<ArrowUp class="size-3" />
											{:else}
												<ArrowDown class="size-3" />
											{/if}
										</span>
									</span>
								</th>
								<th
									class="cursor-pointer px-2 py-2 text-right transition-colors select-none hover:bg-gray-200 dark:hover:bg-gray-600"
									onclick={() => toggleSort('avg')}
								>
									<span class="flex items-center justify-end gap-1">
										Mean
										<span class={sortColumn === 'avg' ? 'opacity-100' : 'opacity-0'}>
											{#if sortDirection === 'asc' && sortColumn === 'avg'}
												<ArrowUp class="size-3" />
											{:else}
												<ArrowDown class="size-3" />
											{/if}
										</span>
									</span>
								</th>
								<th class="px-2 py-2"></th>
							</tr>
						</thead>
						<tbody>
							{#each sortedCaseBreakdown as caseData}
								{@const isSelected =
									selectedCase?.groupId === caseData.groupId &&
									selectedCase?.caseId === caseData.caseId}
								<tr
									class="cursor-pointer border-t border-gray-200 transition-colors
									{isSelected
										? 'hover:bg-primary-150 bg-primary-100 dark:bg-primary-900/30 dark:hover:bg-primary-900/40'
										: 'bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700'}"
									onclick={() => toggleCaseSelection(caseData.groupId, caseData.caseId)}
								>
									<td
										class="px-2 py-2 font-medium {isSelected
											? 'text-primary-700 dark:text-primary-300'
											: 'text-gray-900 dark:text-white'}">{caseData.displayName}</td
									>
									{#if hasMixedSolves}
										<td class="px-2 py-2 text-center text-gray-600 dark:text-gray-400"
											>{caseData.timedCount}</td
										>
										<td class="px-2 py-2 text-center text-gray-600 dark:text-gray-400"
											>{caseData.untimedCount}</td
										>
									{:else}
										<td class="px-2 py-2 text-center text-gray-600 dark:text-gray-400"
											>{caseData.count}</td
										>
									{/if}
									<td class="px-2 py-2 text-right font-mono text-green-600 dark:text-green-400"
										>{formatTime(caseData.best)}</td
									>
									<td class="px-2 py-2 text-right font-mono text-gray-600 dark:text-gray-400"
										>{formatTime(caseData.mean)}</td
									>
									<td class="px-2 py-2 text-right">
										<button
											type="button"
											class="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white dark:focus:ring-gray-700"
											onclick={(e) => {
												e.stopPropagation();
												openCaseStats(caseData.groupId, caseData.caseId);
											}}
										>
											<ChartNoAxesColumn size={16} />
										</button>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{:else}
			<P class="text-center text-gray-500 dark:text-gray-400">No solves recorded yet.</P>
		{/if}
	</div>

	{#if caseStatsOpen && currentStatsCase}
		<CaseStatsModal
			bind:open={caseStatsOpen}
			groupId={currentStatsCase.groupId}
			caseId={currentStatsCase.caseId}
		/>
	{/if}
</Modal>
