/**
 * Shared chart configuration utilities for solve statistics charts
 * Used by CaseStatsModal and SessionStatsModal
 */

export interface ChartSeries {
	name: string;
	data: (number | null)[];
}

export interface ChartOptionsArgs {
	height?: number;
	axisFontSize: string;
	tooltipFontSize?: string;
	series: ChartSeries[];
	categories: number[];
	showLegend?: boolean;
	onDataPointMouseEnter?: (dataPointIndex: number) => void;
	onDataPointMouseLeave?: () => void;
}

/**
 * Creates base chart options for solve time line charts
 * The returned object can be extended with additional options like discrete markers
 */
export function createSolveChartOptions({
	height = 200,
	axisFontSize,
	tooltipFontSize = '0.875rem',
	series,
	categories,
	showLegend = false,
	onDataPointMouseEnter,
	onDataPointMouseLeave
}: ChartOptionsArgs) {
	const axisLabelColor = 'var(--color-chart-axis)';

	const baseOptions: any = {
		chart: {
			type: 'line',
			height,
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
			...(onDataPointMouseEnter || onDataPointMouseLeave
				? {
						events: {
							...(onDataPointMouseEnter && {
								dataPointMouseEnter: function (_event: any, _chartContext: any, config: any) {
									onDataPointMouseEnter(config.dataPointIndex);
								}
							}),
							...(onDataPointMouseLeave && {
								dataPointMouseLeave: function () {
									onDataPointMouseLeave();
								}
							})
						}
					}
				: {})
		},
		series,
		xaxis: {
			categories,
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
			size: 0
		}
	};

	// Add legend if requested
	if (showLegend) {
		baseOptions.legend = {
			show: true,
			position: 'top',
			horizontalAlign: 'center',
			labels: {
				colors: axisLabelColor
			}
		};
	}

	return baseOptions;
}

/**
 * Creates a discrete marker configuration for highlighting specific data points
 */
export function createDiscreteMarker(
	dataPointIndex: number,
	fillColor: string = '#1A56DB',
	seriesIndex: number = 0
) {
	return {
		seriesIndex,
		dataPointIndex,
		fillColor,
		strokeColor: '#fff',
		size: 6,
		shape: 'circle'
	};
}

/**
 * Converts solve times from centiseconds to seconds for chart display
 */
export function prepareSolveTimesForChart(times: (number | undefined)[]): number[] {
	return times
		.filter((t): t is number => t !== undefined)
		.map((t) => parseFloat((t / 100).toFixed(2)));
}
