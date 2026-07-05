import { useEffect, useMemo, useState, type ReactNode } from "react";

import {
  compareHistoricalBacktest,
  historicalModelStart,
} from "../model/historical-scenario";
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
import { ScenarioChart, type ScenarioChartSeries } from "./ScenarioChart";

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

type ChartSeries = ScenarioChartSeries;
type AppView = "scenario" | "historical";

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
  rows: ReturnType<typeof compareHistoricalBacktest>,
): ChartSeries[] => [
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
  rows: ReturnType<typeof compareHistoricalBacktest>,
): ChartSeries[] => [
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

function ChartPanel({
  ariaLabel,
  children,
  periodLabel,
  referenceValue,
  series,
  title,
  valueFloor,
  years,
}: {
  ariaLabel: string;
  children: ReactNode;
  periodLabel: string;
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
                {formatMetricValue(finalValue)}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function AppTabs({
  activeView,
  onChange,
}: {
  activeView: AppView;
  onChange: (view: AppView) => void;
}) {
  return (
    <nav aria-label="Hovedvisning" className="mb-8 border-b border-[#ddd8cd]">
      <div className="flex gap-2" role="tablist">
        {[
          { id: "scenario" as const, label: "Simulator" },
          { id: "historical" as const, label: "Historisk test" },
        ].map((tab) => (
          <button
            aria-selected={activeView === tab.id}
            className={`border-b-2 px-4 py-3 text-sm font-semibold ${
              activeView === tab.id
                ? "border-[#b13f2d] text-[#17211c]"
                : "border-transparent text-[#68746d]"
            }`}
            key={tab.id}
            onClick={() => onChange(tab.id)}
            role="tab"
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
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

function HistoricalBacktestView() {
  const comparisonRows = useMemo(() => compareHistoricalBacktest(), []);
  const chartYears = comparisonRows.map((row) => row.year);
  const housingStockSeries = buildHistoricalHousingStockSeries(comparisonRows);
  const completedSeries = buildHistoricalCompletedSeries(comparisonRows);
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
    <section className="grid gap-6">
      <div>
        <h2 className="m-0 text-2xl font-semibold">Historisk test</h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[#435048]">
          Første backtest kjører modellen for {periodLabel} med observerte
          igangsettinger og historisk styringsrente. Den tester foreløpig
          pipeline, ferdigstillelser og boligbestand før vi kalibrerer
          utbyggerresponsen.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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

function ScenarioWorkshopView({
  formState,
  housingChangeSeries,
  housingStockSeries,
  indicatorSeries,
  lastYear,
  firstYear,
  updateFormValue,
  years,
}: {
  firstYear: SimulationYearResult;
  formState: ScenarioFormState;
  housingChangeSeries: ChartSeries[];
  housingStockSeries: ChartSeries[];
  indicatorSeries: ChartSeries[];
  lastYear: SimulationYearResult;
  updateFormValue: (id: keyof ScenarioFormState, value: number) => void;
  years: SimulationYearResult[];
}) {
  const chartYears = years.map((year) => year.year);
  const periodLabel = `${modelStart.startYear}-${modelStart.endYear}`;

  return (
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
          periodLabel={periodLabel}
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
          periodLabel={periodLabel}
          series={housingStockSeries}
          title="Boligbestand"
          valueFloor={0}
          years={chartYears}
        >
          Faktiske beholdninger etter disposisjonsform og total boligbestand.
        </ChartPanel>

        <ChartPanel
          ariaLabel="Boligendringer for scenarioet"
          periodLabel={periodLabel}
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
              Første prototype bruker grove startverdier og ukalibrerte regler.
              Tabellen under viser samme verdier år for år.
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
                  <th className="py-2 pr-4 font-semibold">Ikke-kommersiell</th>
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
                      {formatMetricValue(year.state.housingStock.ownerOccupied)}
                    </td>
                    <td className="py-2 pr-4">
                      {formatMetricValue(year.state.housingStock.privateRental)}
                    </td>
                    <td className="py-2 pr-4">
                      {formatMetricValue(year.state.housingStock.nonCommercial)}
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
  );
}

export function App() {
  const [activeView, setActiveView] = useState<AppView>("scenario");
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

      <AppTabs activeView={activeView} onChange={setActiveView} />

      {activeView === "scenario" ? (
        <ScenarioWorkshopView
          firstYear={firstYear}
          formState={formState}
          housingChangeSeries={housingChangeSeries}
          housingStockSeries={housingStockSeries}
          indicatorSeries={indicatorSeries}
          lastYear={lastYear}
          updateFormValue={updateFormValue}
          years={years}
        />
      ) : (
        <HistoricalBacktestView />
      )}
    </main>
  );
}
