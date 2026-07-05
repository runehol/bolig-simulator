import { LineChart } from "echarts/charts";
import type { LineSeriesOption } from "echarts/charts";
import {
  GridComponent,
  LegendComponent,
  TooltipComponent,
  type GridComponentOption,
  type LegendComponentOption,
  type TooltipComponentOption,
} from "echarts/components";
import type { ComposeOption, ECharts, SetOptionOpts } from "echarts/core";
import * as echarts from "echarts/core";
import { SVGRenderer } from "echarts/renderers";
import { useEffect, useMemo, useRef } from "react";

echarts.use([
  GridComponent,
  LegendComponent,
  LineChart,
  SVGRenderer,
  TooltipComponent,
]);

export type ScenarioChartSeries = {
  color: string;
  key: string;
  label: string;
  values: number[];
};

type ScenarioChartOption = ComposeOption<
  | GridComponentOption
  | LegendComponentOption
  | LineSeriesOption
  | TooltipComponentOption
>;

type ScenarioChartProps = {
  ariaLabel: string;
  referenceValue?: number;
  series: ScenarioChartSeries[];
  valueFloor?: number;
  years: number[];
};

const numberFormatter = new Intl.NumberFormat("nb-NO", {
  maximumFractionDigits: 0,
});

const tooltipFormatter = (params: unknown) => {
  if (!Array.isArray(params)) {
    return "";
  }

  const rows = params
    .map((item) => {
      const point = item as {
        color?: string;
        marker?: string;
        seriesName?: string;
        value?: [number, number];
      };
      const value = Array.isArray(point.value) ? point.value[1] : undefined;

      return `<div>${point.marker ?? ""}${point.seriesName ?? ""}: <strong>${numberFormatter.format(Number(value ?? 0))}</strong></div>`;
    })
    .join("");
  const year = (params[0] as { axisValueLabel?: string } | undefined)
    ?.axisValueLabel;

  return `<div><strong>${year ?? ""}</strong></div>${rows}`;
};

const buildOption = ({
  series,
  valueFloor,
  years,
}: Omit<ScenarioChartProps, "ariaLabel">): ScenarioChartOption => ({
  animation: false,
  color: series.map((item) => item.color),
  grid: {
    bottom: 56,
    containLabel: true,
    left: 16,
    right: 88,
    top: 28,
  },
  legend: {
    bottom: 0,
    icon: "roundRect",
    itemHeight: 8,
    itemWidth: 22,
    textStyle: {
      color: "#435048",
      fontSize: 12,
    },
    type: "scroll",
  },
  series: series.map((item) => ({
    data: item.values.map((value, index) => [years[index], value]),
    emphasis: {
      focus: "series",
    },
    endLabel: {
      color: item.color,
      formatter: (params) => {
        const value = Array.isArray(params.value)
          ? params.value[1]
          : params.value;

        return numberFormatter.format(Number(value ?? 0));
      },
      show: true,
    },
    labelLayout: {
      moveOverlap: "shiftY",
    },
    name: item.label,
    showSymbol: false,
    smooth: false,
    symbolSize: 6,
    type: "line",
  })),
  tooltip: {
    axisPointer: {
      type: "line",
    },
    confine: true,
    formatter: tooltipFormatter,
    trigger: "axis",
  },
  xAxis: {
    axisLabel: {
      color: "#68746d",
    },
    axisLine: {
      lineStyle: {
        color: "#cfc7b8",
      },
    },
    axisTick: {
      show: false,
    },
    type: "category",
  },
  yAxis: {
    axisLabel: {
      color: "#68746d",
      formatter: (value: number) => numberFormatter.format(value),
    },
    min: valueFloor,
    splitLine: {
      lineStyle: {
        color: "#e7e0d4",
      },
    },
    type: "value",
  },
});

export function ScenarioChart({
  ariaLabel,
  referenceValue,
  series,
  valueFloor,
  years,
}: ScenarioChartProps) {
  const chartRef = useRef<ECharts | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const option = useMemo(
    () => buildOption({ referenceValue, series, valueFloor, years }),
    [referenceValue, series, valueFloor, years],
  );

  useEffect(() => {
    const container = containerRef.current;

    if (!container || navigator.userAgent.includes("jsdom")) {
      return;
    }

    const chart = echarts.init(container, undefined, {
      renderer: "svg",
    });
    chartRef.current = chart;

    const resizeChart = () => chart.resize();
    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(resizeChart);

    resizeObserver?.observe(container);
    window.addEventListener("resize", resizeChart);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", resizeChart);
      chart.dispose();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    const setOptionOptions: SetOptionOpts = {
      notMerge: true,
    };

    chartRef.current?.setOption(option, setOptionOptions);
  }, [option]);

  return (
    <div
      aria-label={ariaLabel}
      className="h-[22rem] w-full"
      ref={containerRef}
      role="img"
    />
  );
}
