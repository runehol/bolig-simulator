import { useMemo } from "react";

import { observedOsloSeries } from "../data/observed-oslo";
import {
  compareHistoricalBacktest,
  historicalModelStart,
} from "../model/historical-scenario";
import { ChartPanel } from "./ChartPanel";
import { formatMetricValue } from "./format";
import type { ScenarioChartSeries } from "./ScenarioChart";
import { SummaryCard } from "./SummaryCard";

type HistoricalBacktestRows = ReturnType<typeof compareHistoricalBacktest>;

const calculateMeanAbsoluteError = (values: Array<number | undefined>) => {
  const numericValues = values.filter((value) => value !== undefined);

  if (numericValues.length === 0) {
    return undefined;
  }

  return (
    numericValues.reduce((sum, value) => sum + Math.abs(value), 0) /
    numericValues.length
  );
};

const calculateMeanAbsolutePercentError = (
  values: Array<{ error: number | undefined; observed: number | undefined }>,
) => {
  const numericValues = values.filter(
    (value) => value.error !== undefined && value.observed !== undefined,
  );

  if (numericValues.length === 0) {
    return undefined;
  }

  return (
    numericValues.reduce(
      (sum, value) => sum + Math.abs(value.error ?? 0) / (value.observed ?? 1),
      0,
    ) *
    (100 / numericValues.length)
  );
};

const buildHistoricalHousingStockSeries = (
  rows: HistoricalBacktestRows,
): ScenarioChartSeries[] => [
  {
    key: "modeledTotalHousingStock",
    label: "Modellert boligbestand",
    color: "#365f91",
    values: rows.map((row) => row.modeledTotalHousingStock),
  },
  {
    key: "observedTotalHousingStock",
    label: "Observert boligbestand",
    color: "#b13f2d",
    values: rows.map((row) => row.observedTotalHousingStock ?? 0),
  },
];

const buildHistoricalCompletedSeries = (
  rows: HistoricalBacktestRows,
): ScenarioChartSeries[] => [
  {
    key: "modeledCompletedDwellings",
    label: "Modellert ferdigstilt",
    color: "#365f91",
    values: rows.map((row) => row.modeledCompletedDwellings),
  },
  {
    key: "observedCompletedDwellings",
    label: "Observert ferdigstilt",
    color: "#b13f2d",
    values: rows.map((row) => row.observedCompletedDwellings ?? 0),
  },
];

const buildHistoricalPolicyRateSeries = (
  rows: HistoricalBacktestRows,
): ScenarioChartSeries[] => [
  {
    key: "policyRate",
    label: "Styringsrente",
    color: "#6f5b9a",
    decimals: 1,
    unit: "%",
    values: rows.map(
      (row) =>
        observedOsloSeries.policyRateAnnualAverage.values[row.year] * 100,
    ),
  },
];

export function HistoricalBacktestView() {
  const comparisonRows = useMemo(() => compareHistoricalBacktest(), []);
  const chartYears = comparisonRows.map((row) => row.year);
  const housingStockSeries = buildHistoricalHousingStockSeries(comparisonRows);
  const completedSeries = buildHistoricalCompletedSeries(comparisonRows);
  const policyRateSeries = buildHistoricalPolicyRateSeries(comparisonRows);
  const stockMae = calculateMeanAbsoluteError(
    comparisonRows.map((row) => row.totalHousingStockError),
  );
  const stockMape = calculateMeanAbsolutePercentError(
    comparisonRows.map((row) => ({
      error: row.totalHousingStockError,
      observed: row.observedTotalHousingStock,
    })),
  );
  const completedMae = calculateMeanAbsoluteError(
    comparisonRows.map((row) => row.completedDwellingsError),
  );
  const completedMape = calculateMeanAbsolutePercentError(
    comparisonRows.map((row) => ({
      error: row.completedDwellingsError,
      observed: row.observedCompletedDwellings,
    })),
  );
  const periodLabel = `${historicalModelStart.startYear}-${historicalModelStart.endYear}`;

  return (
    <section className="grid min-w-0 gap-6">
      <header className="max-w-5xl">
        <h1 className="m-0 text-3xl leading-[1.1] tracking-normal sm:text-5xl">
          Historisk test
        </h1>
        <p className="mt-4 max-w-3xl text-base text-[#435048]">
          Første backtest kjører modellen for {periodLabel} med observerte
          igangsettinger og historisk styringsrente. Den tester foreløpig
          pipeline, ferdigstillelser og boligbestand før vi kalibrerer
          utbyggerresponsen.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 2xl:grid-cols-4">
        <SummaryCard
          explanation="Gjennomsnittlig absolutt årsavvik mellom modellert og observert total boligbestand."
          label="Boligbestand MAE"
          value={stockMae === undefined ? "-" : formatMetricValue(stockMae)}
        />
        <SummaryCard
          explanation="Gjennomsnittlig absolutt prosentavvik for total boligbestand."
          label="Boligbestand MAPE"
          value={
            stockMape === undefined
              ? "-"
              : `${formatMetricValue(stockMape, 1)} %`
          }
        />
        <SummaryCard
          explanation="Gjennomsnittlig absolutt årsavvik mellom modellert og observert ferdigstillelse."
          label="Ferdigstilt MAE"
          value={
            completedMae === undefined ? "-" : formatMetricValue(completedMae)
          }
        />
        <SummaryCard
          explanation="Gjennomsnittlig absolutt prosentavvik for ferdigstilte boliger."
          label="Ferdigstilt MAPE"
          value={
            completedMape === undefined
              ? "-"
              : `${formatMetricValue(completedMape, 1)} %`
          }
        />
      </div>

      <ChartPanel
        ariaLabel="Historisk test av total boligbestand"
        periodLabel={periodLabel}
        series={housingStockSeries}
        title="Total boligbestand"
        years={chartYears}
      >
        Modellert boligbestand sammenlignet med observert SSB-serie.
      </ChartPanel>

      <ChartPanel
        ariaLabel="Historisk test av ferdigstilte boliger"
        periodLabel={periodLabel}
        series={completedSeries}
        title="Ferdigstilte boliger"
        valueFloor={0}
        years={chartYears}
      >
        Ferdigstillelser fra modellen sammenlignet med observerte ferdigstilte
        boliger.
      </ChartPanel>

      <ChartPanel
        ariaLabel="Historisk styringsrente"
        periodLabel={periodLabel}
        series={policyRateSeries}
        title="Styringsrente"
        valueFloor={0}
        years={chartYears}
      >
        Årsgjennomsnitt av historisk styringsrente, brukt som eksogen input i
        backtesten.
      </ChartPanel>

      <section className="rounded-lg border border-[#ddd8cd] bg-white p-5">
        <h2 className="m-0 text-xl font-semibold">Avvikstabell</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[#ddd8cd] text-[#68746d]">
                <th className="py-2 pr-4 font-semibold">År</th>
                <th className="py-2 pr-4 font-semibold">Modellert bestand</th>
                <th className="py-2 pr-4 font-semibold">Observert bestand</th>
                <th className="py-2 pr-4 font-semibold">Avvik bestand</th>
                <th className="py-2 pr-4 font-semibold">
                  Modellert ferdigstilt
                </th>
                <th className="py-2 pr-4 font-semibold">
                  Observert ferdigstilt
                </th>
                <th className="py-2 pr-4 font-semibold">Avvik ferdigstilt</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row) => (
                <tr
                  className="border-b border-[#eee8dd] last:border-0"
                  key={row.year}
                >
                  <td className="py-2 pr-4 font-semibold">{row.year}</td>
                  <td className="py-2 pr-4">
                    {formatMetricValue(row.modeledTotalHousingStock)}
                  </td>
                  <td className="py-2 pr-4">
                    {row.observedTotalHousingStock === undefined
                      ? "-"
                      : formatMetricValue(row.observedTotalHousingStock)}
                  </td>
                  <td className="py-2 pr-4">
                    {row.totalHousingStockError === undefined
                      ? "-"
                      : formatMetricValue(row.totalHousingStockError)}
                  </td>
                  <td className="py-2 pr-4">
                    {formatMetricValue(row.modeledCompletedDwellings)}
                  </td>
                  <td className="py-2 pr-4">
                    {row.observedCompletedDwellings === undefined
                      ? "-"
                      : formatMetricValue(row.observedCompletedDwellings)}
                  </td>
                  <td className="py-2 pr-4">
                    {row.completedDwellingsError === undefined
                      ? "-"
                      : formatMetricValue(row.completedDwellingsError)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
