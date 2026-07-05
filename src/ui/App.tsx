import { useEffect, useMemo, useState, type ReactNode } from "react";

import { defaultScenarioInputs, modelStart } from "../model/start-values";
import { simulateScenario } from "../model/simulation";
import type {
  HousingStock,
  ScenarioInputs,
  SimulationYearResult,
} from "../model/types";
import {
  defaultScenarioUrlState,
  parseScenarioUrlState,
  serializeScenarioSearch,
  type ScenarioUrlState,
} from "../routing/scenario-url";

type ControlDefinition = {
  id: keyof ScenarioFormState;
  label: string;
  min: number;
  max: number;
  step: number;
  suffix: string;
  group: "Oslo-kommunale grep" | "Eksterne makroforutsetninger";
};

type ScenarioFormState = ScenarioUrlState;

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
    group: "Oslo-kommunale grep",
  },
  {
    id: "municipalSales",
    label: "Kommunale salg per år",
    min: 0,
    max: 1000,
    step: 50,
    suffix: "boliger",
    group: "Oslo-kommunale grep",
  },
  {
    id: "nonCommercialShareOfNewBuild",
    label: "Ikke-kommersiell andel av nybygg",
    min: 0,
    max: 50,
    step: 1,
    suffix: "%",
    group: "Oslo-kommunale grep",
  },
  {
    id: "interestRate",
    label: "Rente",
    min: 1,
    max: 8,
    step: 0.1,
    suffix: "%",
    group: "Eksterne makroforutsetninger",
  },
  {
    id: "householdGrowthRate",
    label: "Befolkningsvekst",
    min: -0.5,
    max: 2,
    step: 0.1,
    suffix: "%",
    group: "Eksterne makroforutsetninger",
  },
  {
    id: "constructionCostGrowth",
    label: "Byggekostnadsvekst",
    min: 0,
    max: 8,
    step: 0.1,
    suffix: "%",
    group: "Eksterne makroforutsetninger",
  },
];

const controlGroups = [
  {
    description: "Spaker kommunen kan endre direkte i denne første modellen.",
    id: "Oslo-kommunale grep",
  },
  {
    description:
      "Ikke modellert som egne spaker ennå. Kommer senere der staten endrer rammer for skatt, Husbanken eller leieregulering.",
    id: "Statlige grep",
  },
  {
    description:
      "Ytre forutsetninger som påvirker modellen, men ikke styres av Oslo kommune.",
    id: "Eksterne makroforutsetninger",
  },
] as const;

const initialFormState: ScenarioFormState = defaultScenarioUrlState;

const getInitialFormState = (): ScenarioFormState => {
  if (typeof window === "undefined") {
    return initialFormState;
  }

  return parseScenarioUrlState(window.location.search);
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

const formatNumberInputValue = (value: number) =>
  Number.isInteger(value) ? String(value) : value.toFixed(1);

const totalHousingStock = (housingStock: HousingStock) =>
  housingStock.ownerOccupied +
  housingStock.privateRental +
  housingStock.municipal +
  housingStock.nonCommercial;

const normalizeValues = (values: number[], baseValue: number) => {
  if (baseValue === 0) {
    return values.map(() => 100);
  }

  return values.map((value) => (value / baseValue) * 100);
};

const buildPath = (
  values: number[],
  minValue: number,
  maxValue: number,
  width: number,
  height: number,
  padding: {
    bottom: number;
    left: number;
    right: number;
    top: number;
  },
) => {
  const range = Math.max(1, maxValue - minValue);
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  return values
    .map((value, index) => {
      const x =
        padding.left + (plotWidth * index) / Math.max(1, values.length - 1);
      const y =
        height - padding.bottom - ((value - minValue) / range) * plotHeight;
      const command = index === 0 ? "M" : "L";

      return `${command} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
};

const buildIndicatorSeries = (years: SimulationYearResult[]): ChartSeries[] => [
  {
    key: "price",
    label: "Boligprisindeks",
    color: "#365f91",
    values: normalizeValues(
      years.map((year) => year.state.housingPriceIndex),
      years[0].state.housingPriceIndex,
    ),
  },
  {
    key: "pressure",
    label: "Privat leiepress",
    color: "#82612b",
    values: normalizeValues(
      years.map((year) => year.privateRentalPressure),
      years[0].privateRentalPressure,
    ),
  },
];

const buildHousingStockSeries = (
  years: SimulationYearResult[],
): ChartSeries[] => [
  {
    key: "totalHousingStock",
    label: "Total boligbestand",
    color: "#17211c",
    values: years.map((year) => totalHousingStock(year.state.housingStock)),
  },
  {
    key: "municipal",
    label: "Kommunal boligbestand",
    color: "#b13f2d",
    values: years.map((year) => year.state.housingStock.municipal),
  },
  {
    key: "ownerOccupied",
    label: "Selveide boliger",
    color: "#6f5b9a",
    values: years.map((year) => year.state.housingStock.ownerOccupied),
  },
  {
    key: "privateRental",
    label: "Privatleide boliger",
    color: "#a05d3b",
    values: years.map((year) => year.state.housingStock.privateRental),
  },
  {
    key: "nonCommercial",
    label: "Ikke-kommersiell boligbestand",
    color: "#276e62",
    values: years.map((year) => year.state.housingStock.nonCommercial),
  },
];

const buildHousingChangeSeries = (
  years: SimulationYearResult[],
): ChartSeries[] => [
  {
    key: "started",
    label: "Igangsatte boliger",
    color: "#365f91",
    values: years.map((year) => year.startedDwellings),
  },
  {
    key: "completed",
    label: "Ferdigstilte boliger",
    color: "#82612b",
    values: years.map((year) => year.completedDwellings),
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
  const [draftValue, setDraftValue] = useState(formatNumberInputValue(value));

  useEffect(() => {
    setDraftValue(formatNumberInputValue(value));
  }, [value]);

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
          onBlur={() => setDraftValue(formatNumberInputValue(value))}
          onChange={(event) => {
            setDraftValue(event.currentTarget.value);
            onChange(definition.id, event.currentTarget.valueAsNumber);
          }}
          step={definition.step}
          type="number"
          value={draftValue}
        />
      </div>
      <p className="m-0 text-sm text-[#68746d]">
        {formatControlValue(value, definition)} {definition.suffix}
      </p>
    </div>
  );
}

function LineChart({
  ariaLabel,
  referenceValue,
  valueFloor,
  years,
  series,
}: {
  ariaLabel: string;
  referenceValue?: number;
  valueFloor?: number;
  years: number[];
  series: ChartSeries[];
}) {
  const width = 860;
  const height = 320;
  const padding = {
    bottom: 42,
    left: 88,
    right: 42,
    top: 36,
  };
  const allValues = series.flatMap((item) => item.values);
  const minValue = Math.min(valueFloor ?? referenceValue ?? 0, ...allValues);
  const maxValue = Math.max(referenceValue ?? 0, ...allValues);
  const middleValue = referenceValue ?? minValue + (maxValue - minValue) / 2;
  const gridValues = Array.from(
    new Set(
      [minValue, middleValue, maxValue].map((value) => Math.round(value)),
    ),
  );

  return (
    <figure className="m-0">
      <div className="overflow-x-auto rounded-lg border border-[#ddd8cd] bg-white">
        <svg
          aria-label={ariaLabel}
          className="block min-w-[720px]"
          role="img"
          viewBox={`0 0 ${width} ${height}`}
        >
          <rect fill="#ffffff" height={height} width={width} />
          {gridValues.map((value) => {
            const y =
              height -
              padding.bottom -
              ((value - minValue) / Math.max(1, maxValue - minValue)) *
                (height - padding.top - padding.bottom);

            return (
              <g key={value}>
                <line
                  stroke="#e7e0d4"
                  strokeWidth="1"
                  x1={padding.left}
                  x2={width - padding.right}
                  y1={y}
                  y2={y}
                />
                <text
                  fill="#68746d"
                  fontSize="12"
                  textAnchor="end"
                  x={padding.left - 10}
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
            x1={padding.left}
            x2={padding.left}
            y1={padding.top}
            y2={height - padding.bottom}
          />
          <line
            stroke="#cfc7b8"
            strokeWidth="1.5"
            x1={padding.left}
            x2={width - padding.right}
            y1={height - padding.bottom}
            y2={height - padding.bottom}
          />
          {series.map((item) => (
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
              padding.left +
              ((width - padding.left - padding.right) * index) /
                Math.max(1, years.length - 1);

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

function ChartPanel({
  ariaLabel,
  children,
  referenceValue,
  series,
  title,
  valueFloor,
  years,
}: {
  ariaLabel: string;
  children: ReactNode;
  referenceValue?: number;
  series: ChartSeries[];
  title: string;
  valueFloor?: number;
  years: number[];
}) {
  return (
    <section className="rounded-lg border border-[#ddd8cd] bg-white p-5">
      <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h2 className="m-0 text-xl font-semibold">{title}</h2>
          <div className="m-0 mt-1 text-sm text-[#68746d]">{children}</div>
        </div>
        <p className="m-0 text-sm font-semibold text-[#435048]">
          {modelStart.startYear}-{modelStart.endYear}
        </p>
      </div>

      <LineChart
        ariaLabel={ariaLabel}
        referenceValue={referenceValue}
        series={series}
        valueFloor={valueFloor}
        years={years}
      />
    </section>
  );
}

function SummaryCard({
  explanation,
  label,
  value,
}: {
  explanation: string;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-[#ddd8cd] bg-white p-4">
      <p className="m-0 text-sm text-[#68746d]">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      <p className="mt-3 text-sm leading-snug text-[#435048]">{explanation}</p>
    </div>
  );
}

export function App() {
  const [formState, setFormState] =
    useState<ScenarioFormState>(getInitialFormState);
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
  const indicatorSeries = buildIndicatorSeries(years);
  const housingStockSeries = buildHousingStockSeries(years);
  const housingChangeSeries = buildHousingChangeSeries(years);
  const firstYear = years[0];
  const lastYear = years[years.length - 1];

  useEffect(() => {
    const nextSearch = serializeScenarioSearch(formState);

    if (nextSearch === window.location.search) {
      return;
    }

    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${nextSearch}${window.location.hash}`,
    );
  }, [formState]);

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

          {controlGroups.map((group) => {
            const groupControls = controls.filter(
              (control) => control.group === group.id,
            );

            return (
              <section className="mt-6" key={group.id}>
                <h3 className="m-0 text-sm font-bold text-[#435048] uppercase">
                  {group.id}
                </h3>
                <p className="mt-1 text-sm leading-snug text-[#68746d]">
                  {group.description}
                </p>
                <div className="mt-2">
                  {groupControls.length === 0 ? (
                    <p className="m-0 rounded-md border border-dashed border-[#cfc7b8] bg-[#fbf8f1] p-3 text-sm text-[#68746d]">
                      Ingen aktiv kontroll i første prototype.
                    </p>
                  ) : (
                    groupControls.map((control) => (
                      <ScenarioControl
                        definition={control}
                        key={control.id}
                        onChange={updateFormValue}
                        value={formState[control.id]}
                      />
                    ))
                  )}
                </div>
              </section>
            );
          })}
        </aside>

        <section className="grid gap-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard
              explanation="Kommunalt disponerte boliger etter kjøp, salg og modellert beholdningsendring."
              label="Kommunale boliger"
              value={`${formatMetricValue(firstYear.state.housingStock.municipal)} -> ${formatMetricValue(lastYear.state.housingStock.municipal)}`}
            />
            <SummaryCard
              explanation="Boliger utenfor ordinær kommersiell eier- og leiemodell, bygget opp gjennom nybyggandelen."
              label="Ikke-kommersielle"
              value={`${formatMetricValue(firstYear.state.housingStock.nonCommercial)} -> ${formatMetricValue(lastYear.state.housingStock.nonCommercial)}`}
            />
            <SummaryCard
              explanation="Modellert prisnivå der 100 er startnivået. Brukes foreløpig som driver for privat bygging."
              label="Boligprisindeks"
              value={`${formatMetricValue(firstYear.state.housingPriceIndex, 1)} -> ${formatMetricValue(lastYear.state.housingPriceIndex, 1)}`}
            />
            <SummaryCard
              explanation="Indikator for press i privat leiemarked. Høyere verdi betyr strammere marked i modellen."
              label="Privat leiepress"
              value={`${formatMetricValue(firstYear.privateRentalPressure, 2)} -> ${formatMetricValue(lastYear.privateRentalPressure, 2)}`}
            />
          </div>

          <ChartPanel
            ariaLabel="Indekserte indikatorer for scenarioet"
            referenceValue={100}
            series={indicatorSeries}
            title="Indikatorer"
            valueFloor={95}
            years={chartYears}
          >
            Boligprisindeks og privat leiepress er indeksert til 100 i første
            modellår.
          </ChartPanel>

          <ChartPanel
            ariaLabel="Boligbestand for scenarioet"
            series={housingStockSeries}
            title="Boligbestand"
            valueFloor={0}
            years={chartYears}
          >
            Faktiske beholdninger etter disposisjonsform og total boligbestand.
          </ChartPanel>

          <ChartPanel
            ariaLabel="Boligendringer for scenarioet"
            series={housingChangeSeries}
            title="Boligendringer"
            valueFloor={0}
            years={chartYears}
          >
            Faktiske årlige strømmer for igangsatte og ferdigstilte boliger.
          </ChartPanel>

          <section className="rounded-lg border border-[#ddd8cd] bg-white p-5">
            <div className="grid gap-3 text-sm leading-snug text-[#435048] md:grid-cols-2">
              <p className="m-0">
                Indikatorer vises som indeks for å gjøre utviklingen
                sammenlignbar. Boligbestand og boligendringer vises som faktiske
                modellverdier.
              </p>
              <p className="m-0">
                Første prototype bruker grove startverdier og ukalibrerte
                regler. Tabellen under viser samme verdier år for år.
              </p>
            </div>
          </section>

          <section className="rounded-lg border border-[#ddd8cd] bg-white p-5">
            <h2 className="m-0 text-xl font-semibold">Årstabell</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-[#ddd8cd] text-[#68746d]">
                    <th className="py-2 pr-4 font-semibold">År</th>
                    <th className="py-2 pr-4 font-semibold">Total</th>
                    <th className="py-2 pr-4 font-semibold">Kommunal</th>
                    <th className="py-2 pr-4 font-semibold">Selveid</th>
                    <th className="py-2 pr-4 font-semibold">Privatleid</th>
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
                        {formatMetricValue(
                          totalHousingStock(year.state.housingStock),
                        )}
                      </td>
                      <td className="py-2 pr-4">
                        {formatMetricValue(year.state.housingStock.municipal)}
                      </td>
                      <td className="py-2 pr-4">
                        {formatMetricValue(
                          year.state.housingStock.ownerOccupied,
                        )}
                      </td>
                      <td className="py-2 pr-4">
                        {formatMetricValue(
                          year.state.housingStock.privateRental,
                        )}
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
