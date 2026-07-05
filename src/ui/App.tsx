import { useMemo, useState } from "react";

import { defaultScenarioInputs, modelStart } from "../model/start-values";
import { simulateScenario } from "../model/simulation";
import type { ScenarioInputs, SimulationYearResult } from "../model/types";

type ControlDefinition = {
  id: keyof ScenarioFormState;
  label: string;
  min: number;
  max: number;
  step: number;
  suffix: string;
  group: "Kommunale grep" | "Eksterne forutsetninger";
};

type ScenarioFormState = {
  municipalPurchases: number;
  municipalSales: number;
  nonCommercialShareOfNewBuild: number;
  interestRate: number;
  householdGrowthRate: number;
  constructionCostGrowth: number;
};

type ChartSeries = {
  key: string;
  label: string;
  color: string;
  values: number[];
};

const controls: ControlDefinition[] = [
  {
    id: "municipalPurchases",
    label: "Kommunale kjøp per år",
    min: 0,
    max: 2000,
    step: 50,
    suffix: "boliger",
    group: "Kommunale grep",
  },
  {
    id: "municipalSales",
    label: "Kommunale salg per år",
    min: 0,
    max: 1000,
    step: 50,
    suffix: "boliger",
    group: "Kommunale grep",
  },
  {
    id: "nonCommercialShareOfNewBuild",
    label: "Ikke-kommersiell andel av nybygg",
    min: 0,
    max: 50,
    step: 1,
    suffix: "%",
    group: "Kommunale grep",
  },
  {
    id: "interestRate",
    label: "Rente",
    min: 1,
    max: 8,
    step: 0.1,
    suffix: "%",
    group: "Eksterne forutsetninger",
  },
  {
    id: "householdGrowthRate",
    label: "Befolkningsvekst",
    min: -0.5,
    max: 2,
    step: 0.1,
    suffix: "%",
    group: "Eksterne forutsetninger",
  },
  {
    id: "constructionCostGrowth",
    label: "Byggekostnadsvekst",
    min: 0,
    max: 8,
    step: 0.1,
    suffix: "%",
    group: "Eksterne forutsetninger",
  },
];

const initialFormState: ScenarioFormState = {
  municipalPurchases: defaultScenarioInputs.policies.municipalPurchases,
  municipalSales: defaultScenarioInputs.policies.municipalSales,
  nonCommercialShareOfNewBuild:
    defaultScenarioInputs.policies.nonCommercialShareOfNewBuild * 100,
  interestRate: defaultScenarioInputs.exogenous.interestRate * 100,
  householdGrowthRate:
    defaultScenarioInputs.exogenous.householdGrowthRate * 100,
  constructionCostGrowth:
    defaultScenarioInputs.exogenous.constructionCostGrowth * 100,
};

const numberFormatter = new Intl.NumberFormat("nb-NO", {
  maximumFractionDigits: 0,
});

const decimalFormatter = new Intl.NumberFormat("nb-NO", {
  maximumFractionDigits: 1,
  minimumFractionDigits: 1,
});

const toScenarioInputs = (formState: ScenarioFormState): ScenarioInputs => ({
  policies: {
    municipalPurchases: formState.municipalPurchases,
    municipalSales: formState.municipalSales,
    nonCommercialShareOfNewBuild: formState.nonCommercialShareOfNewBuild / 100,
  },
  exogenous: {
    interestRate: formState.interestRate / 100,
    householdGrowthRate: formState.householdGrowthRate / 100,
    constructionCostGrowth: formState.constructionCostGrowth / 100,
    regulatedNewCapacity: defaultScenarioInputs.exogenous.regulatedNewCapacity,
  },
});

const formatControlValue = (
  value: number,
  definition: ControlDefinition,
): string => {
  if (definition.suffix === "%" && definition.step < 1) {
    return decimalFormatter.format(value);
  }

  return numberFormatter.format(value);
};

const formatMetricValue = (value: number, decimals = 0) =>
  new Intl.NumberFormat("nb-NO", {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(value);

const normalizeSeries = (values: number[]) => {
  const firstValue = values[0];

  if (firstValue === 0) {
    return values.map(() => 100);
  }

  return values.map((value) => (value / firstValue) * 100);
};

const buildPath = (
  values: number[],
  minValue: number,
  maxValue: number,
  width: number,
  height: number,
  padding: number,
) => {
  const range = Math.max(1, maxValue - minValue);
  const plotWidth = width - padding * 2;
  const plotHeight = height - padding * 2;

  return values
    .map((value, index) => {
      const x = padding + (plotWidth * index) / Math.max(1, values.length - 1);
      const y = height - padding - ((value - minValue) / range) * plotHeight;
      const command = index === 0 ? "M" : "L";

      return `${command} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
};

const buildChartSeries = (years: SimulationYearResult[]): ChartSeries[] => [
  {
    key: "municipal",
    label: "Kommunal boligbestand",
    color: "#b13f2d",
    values: years.map((year) => year.state.housingStock.municipal),
  },
  {
    key: "nonCommercial",
    label: "Ikke-kommersiell boligbestand",
    color: "#276e62",
    values: years.map((year) => year.state.housingStock.nonCommercial),
  },
  {
    key: "price",
    label: "Boligprisindeks",
    color: "#365f91",
    values: years.map((year) => year.state.housingPriceIndex),
  },
  {
    key: "pressure",
    label: "Privat leiepress",
    color: "#82612b",
    values: years.map((year) => year.privateRentalPressure),
  },
];

function ScenarioControl({
  definition,
  value,
  onChange,
}: {
  definition: ControlDefinition;
  value: number;
  onChange: (id: keyof ScenarioFormState, value: number) => void;
}) {
  const inputId = `control-${definition.id}`;

  return (
    <div className="grid gap-2 border-b border-[#e5dfd2] py-4 last:border-0">
      <div className="flex items-baseline justify-between gap-3">
        <label
          className="text-sm font-semibold text-[#1e2a23]"
          htmlFor={inputId}
        >
          {definition.label}
        </label>
        <span className="text-xs text-[#68746d]">{definition.suffix}</span>
      </div>
      <div className="grid grid-cols-[1fr_6.5rem] items-center gap-3">
        <input
          aria-label={`${definition.label} slider`}
          className="h-2 w-full cursor-pointer accent-[#b13f2d]"
          max={definition.max}
          min={definition.min}
          onChange={(event) =>
            onChange(definition.id, event.currentTarget.valueAsNumber)
          }
          step={definition.step}
          type="range"
          value={value}
        />
        <input
          aria-label={definition.label}
          className="h-10 w-full rounded-md border border-[#cfc7b8] bg-white px-2 text-right text-sm text-[#17211c]"
          id={inputId}
          max={definition.max}
          min={definition.min}
          onChange={(event) =>
            onChange(definition.id, event.currentTarget.valueAsNumber)
          }
          step={definition.step}
          type="number"
          value={Number.isInteger(value) ? value : value.toFixed(1)}
        />
      </div>
      <p className="m-0 text-sm text-[#68746d]">
        {formatControlValue(value, definition)} {definition.suffix}
      </p>
    </div>
  );
}

function IndexedLineChart({
  years,
  series,
}: {
  years: number[];
  series: ChartSeries[];
}) {
  const width = 860;
  const height = 320;
  const padding = 42;
  const normalizedSeries = series.map((item) => ({
    ...item,
    values: normalizeSeries(item.values),
  }));
  const allValues = normalizedSeries.flatMap((item) => item.values);
  const minValue = Math.min(95, ...allValues);
  const maxValue = Math.max(105, ...allValues);
  const gridValues = [minValue, 100, maxValue];

  return (
    <figure className="m-0">
      <div className="overflow-x-auto rounded-lg border border-[#ddd8cd] bg-white">
        <svg
          aria-label="Indeksert utvikling for scenarioet"
          className="block min-w-[720px]"
          role="img"
          viewBox={`0 0 ${width} ${height}`}
        >
          <rect fill="#ffffff" height={height} width={width} />
          {gridValues.map((value) => {
            const y =
              height -
              padding -
              ((value - minValue) / Math.max(1, maxValue - minValue)) *
                (height - padding * 2);

            return (
              <g key={value}>
                <line
                  stroke="#e7e0d4"
                  strokeWidth="1"
                  x1={padding}
                  x2={width - padding}
                  y1={y}
                  y2={y}
                />
                <text
                  fill="#68746d"
                  fontSize="12"
                  textAnchor="end"
                  x={padding - 10}
                  y={y + 4}
                >
                  {formatMetricValue(value, 0)}
                </text>
              </g>
            );
          })}
          <line
            stroke="#cfc7b8"
            strokeWidth="1.5"
            x1={padding}
            x2={padding}
            y1={padding}
            y2={height - padding}
          />
          <line
            stroke="#cfc7b8"
            strokeWidth="1.5"
            x1={padding}
            x2={width - padding}
            y1={height - padding}
            y2={height - padding}
          />
          {normalizedSeries.map((item) => (
            <path
              d={buildPath(
                item.values,
                minValue,
                maxValue,
                width,
                height,
                padding,
              )}
              fill="none"
              key={item.key}
              stroke={item.color}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="3"
            />
          ))}
          {years.map((year, index) => {
            if (index !== 0 && index !== years.length - 1) {
              return null;
            }

            const x =
              padding +
              ((width - padding * 2) * index) / Math.max(1, years.length - 1);

            return (
              <text
                fill="#68746d"
                fontSize="12"
                key={year}
                textAnchor={index === 0 ? "start" : "end"}
                x={x}
                y={height - 12}
              >
                {year}
              </text>
            );
          })}
        </svg>
      </div>
      <figcaption className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#435048]">
        {series.map((item) => (
          <span className="inline-flex items-center gap-2" key={item.key}>
            <span
              aria-hidden="true"
              className="h-2.5 w-6 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            {item.label}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}

export function App() {
  const [formState, setFormState] =
    useState<ScenarioFormState>(initialFormState);
  const scenarioInputs = useMemo(
    () => toScenarioInputs(formState),
    [formState],
  );
  const simulation = useMemo(
    () => simulateScenario({ inputs: scenarioInputs }),
    [scenarioInputs],
  );
  const years = simulation.years;
  const chartYears = years.map((year) => year.year);
  const chartSeries = buildChartSeries(years);
  const firstYear = years[0];
  const lastYear = years[years.length - 1];

  const updateFormValue = (id: keyof ScenarioFormState, value: number) => {
    if (!Number.isFinite(value)) {
      return;
    }

    const definition = controls.find((control) => control.id === id);
    const nextValue = definition
      ? Math.min(Math.max(value, definition.min), definition.max)
      : value;

    setFormState((current) => ({ ...current, [id]: nextValue }));
  };

  return (
    <main className="min-h-screen px-4 py-8 sm:px-8 lg:px-12">
      <header className="mb-8 max-w-5xl">
        <p className="mb-2 text-xs font-bold tracking-[0.08em] text-[#68746d] uppercase">
          Oslo boligsimulator
        </p>
        <h1 className="m-0 text-3xl leading-[1.1] tracking-normal sm:text-5xl">
          Scenarioverksted
        </h1>
        <p className="mt-4 max-w-3xl text-base text-[#435048]">
          Første modell kjører hele Oslo fra {modelStart.startYear} til{" "}
          {modelStart.endYear}. Tallene er grove startverdier og skal brukes til
          å teste modellstruktur.
        </p>
      </header>

      <div className="grid gap-6 xl:grid-cols-[23rem_1fr]">
        <aside className="self-start rounded-lg border border-[#ddd8cd] bg-white p-5">
          <h2 className="m-0 text-xl font-semibold">Scenario</h2>
          <p className="mt-2 text-sm text-[#68746d]">
            Slidere gir rask utforsking. Nummerfeltene kan brukes for presise
            verdier.
          </p>

          {(["Kommunale grep", "Eksterne forutsetninger"] as const).map(
            (group) => (
              <section className="mt-6" key={group}>
                <h3 className="m-0 text-sm font-bold text-[#435048] uppercase">
                  {group}
                </h3>
                <div className="mt-2">
                  {controls
                    .filter((control) => control.group === group)
                    .map((control) => (
                      <ScenarioControl
                        definition={control}
                        key={control.id}
                        onChange={updateFormValue}
                        value={formState[control.id]}
                      />
                    ))}
                </div>
              </section>
            ),
          )}
        </aside>

        <section className="grid gap-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-[#ddd8cd] bg-white p-4">
              <p className="m-0 text-sm text-[#68746d]">Kommunale boliger</p>
              <p className="mt-2 text-2xl font-semibold">
                {formatMetricValue(firstYear.state.housingStock.municipal)}{" "}
                {"->"}{" "}
                {formatMetricValue(lastYear.state.housingStock.municipal)}
              </p>
            </div>
            <div className="rounded-lg border border-[#ddd8cd] bg-white p-4">
              <p className="m-0 text-sm text-[#68746d]">Ikke-kommersielle</p>
              <p className="mt-2 text-2xl font-semibold">
                {formatMetricValue(firstYear.state.housingStock.nonCommercial)}{" "}
                {"->"}{" "}
                {formatMetricValue(lastYear.state.housingStock.nonCommercial)}
              </p>
            </div>
            <div className="rounded-lg border border-[#ddd8cd] bg-white p-4">
              <p className="m-0 text-sm text-[#68746d]">Boligprisindeks</p>
              <p className="mt-2 text-2xl font-semibold">
                {formatMetricValue(firstYear.state.housingPriceIndex, 1)} {"->"}{" "}
                {formatMetricValue(lastYear.state.housingPriceIndex, 1)}
              </p>
            </div>
            <div className="rounded-lg border border-[#ddd8cd] bg-white p-4">
              <p className="m-0 text-sm text-[#68746d]">Privat leiepress</p>
              <p className="mt-2 text-2xl font-semibold">
                {formatMetricValue(firstYear.privateRentalPressure, 2)} {"->"}{" "}
                {formatMetricValue(lastYear.privateRentalPressure, 2)}
              </p>
            </div>
          </div>

          <section className="rounded-lg border border-[#ddd8cd] bg-white p-5">
            <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <h2 className="m-0 text-xl font-semibold">
                  Utvikling over tid
                </h2>
                <p className="m-0 mt-1 text-sm text-[#68746d]">
                  Første graf er indeksert med første modellår = 100. Tabellen
                  viser faktiske verdier.
                </p>
              </div>
              <p className="m-0 text-sm font-semibold text-[#435048]">
                {modelStart.startYear}-{modelStart.endYear}
              </p>
            </div>

            <IndexedLineChart series={chartSeries} years={chartYears} />
          </section>

          <section className="rounded-lg border border-[#ddd8cd] bg-white p-5">
            <h2 className="m-0 text-xl font-semibold">Årstabell</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-[#ddd8cd] text-[#68746d]">
                    <th className="py-2 pr-4 font-semibold">År</th>
                    <th className="py-2 pr-4 font-semibold">Kommunal</th>
                    <th className="py-2 pr-4 font-semibold">
                      Ikke-kommersiell
                    </th>
                    <th className="py-2 pr-4 font-semibold">Prisindeks</th>
                    <th className="py-2 pr-4 font-semibold">Leiepress</th>
                    <th className="py-2 pr-4 font-semibold">Igangsatt</th>
                    <th className="py-2 pr-4 font-semibold">Ferdigstilt</th>
                  </tr>
                </thead>
                <tbody>
                  {years.map((year) => (
                    <tr
                      className="border-b border-[#eee8dd] last:border-0"
                      key={year.year}
                    >
                      <td className="py-2 pr-4 font-semibold">{year.year}</td>
                      <td className="py-2 pr-4">
                        {formatMetricValue(year.state.housingStock.municipal)}
                      </td>
                      <td className="py-2 pr-4">
                        {formatMetricValue(
                          year.state.housingStock.nonCommercial,
                        )}
                      </td>
                      <td className="py-2 pr-4">
                        {formatMetricValue(year.state.housingPriceIndex, 1)}
                      </td>
                      <td className="py-2 pr-4">
                        {formatMetricValue(year.privateRentalPressure, 2)}
                      </td>
                      <td className="py-2 pr-4">
                        {formatMetricValue(year.startedDwellings)}
                      </td>
                      <td className="py-2 pr-4">
                        {formatMetricValue(year.completedDwellings)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
