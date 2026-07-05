import type { ReactNode } from "react";

import { ScenarioChart, type ScenarioChartSeries } from "./ScenarioChart";
import { formatMetricValue } from "./format";

type ChartPanelProps = {
  ariaLabel: string;
  children: ReactNode;
  periodLabel: string;
  referenceValue?: number;
  series: ScenarioChartSeries[];
  title: string;
  valueFloor?: number;
  years: number[];
};

export function ChartPanel({
  ariaLabel,
  children,
  periodLabel,
  referenceValue,
  series,
  title,
  valueFloor,
  years,
}: ChartPanelProps) {
  return (
    <section className="rounded-lg border border-[#ddd8cd] bg-white p-5">
      <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h2 className="m-0 text-xl font-semibold">{title}</h2>
          <div className="m-0 mt-1 text-sm text-[#68746d]">{children}</div>
        </div>
        <p className="m-0 text-sm font-semibold text-[#435048]">
          {periodLabel}
        </p>
      </div>

      <ScenarioChart
        ariaLabel={ariaLabel}
        referenceValue={referenceValue}
        series={series}
        valueFloor={valueFloor}
        years={years}
      />
      <div className="mt-4 grid gap-2 border-t border-[#eee8dd] pt-4 sm:grid-cols-2 lg:grid-cols-3">
        {series.map((item) => {
          const finalValue = item.values[item.values.length - 1] ?? 0;

          return (
            <div className="flex items-baseline gap-2 text-sm" key={item.key}>
              <span
                aria-hidden="true"
                className="h-2.5 w-5 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-[#435048]">{item.label}</span>
              <span className="ml-auto font-semibold text-[#17211c]">
                {formatMetricValue(finalValue, item.decimals ?? 0)}
                {item.unit === undefined ? "" : ` ${item.unit}`}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
