import { useEffect, useMemo, useState } from "react";

import { defaultScenarioInputs, modelStart } from "../model/start-values";
import { simulateScenario } from "../model/simulation";
import type {
  HousingStock,
  ScenarioInputs,
  SimulationYearResult,
} from "../model/types";
import type { ScenarioUrlState } from "../routing/scenario-url";
import { ChartPanel } from "./ChartPanel";
import { formatMetricValue } from "./format";
import { controls, type ControlDefinition } from "./scenario-controls";
import type { ScenarioChartSeries } from "./ScenarioChart";
import { SummaryCard } from "./SummaryCard";

type ScenarioFormState = ScenarioUrlState;

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

const buildIndicatorSeries = (
  years: SimulationYearResult[],
): ScenarioChartSeries[] => [
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
): ScenarioChartSeries[] => [
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
): ScenarioChartSeries[] => [
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
    <div className="grid gap-2 border-b border-[#e5dfd2] py-4 last:border-0 dark:border-[#30382f]">
      <div className="flex items-baseline justify-between gap-3">
        <label
          className="text-sm font-semibold text-[#1e2a23] dark:text-[#f7f8f2]"
          htmlFor={inputId}
        >
          {definition.label}
        </label>
        <span className="text-xs text-[#68746d] dark:text-[#a8b2a8]">
          {definition.suffix}
        </span>
      </div>
      <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-[minmax(0,1fr)_6.5rem]">
        <input
          aria-label={`${definition.label} slider`}
          className="h-2 w-full cursor-pointer accent-[#b13f2d] dark:accent-[#d8664f]"
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
          className="h-10 w-full max-w-[8rem] rounded-md border border-[#cfc7b8] bg-white px-2 text-right text-sm text-[#17211c] dark:border-[#586252] dark:bg-[#111510] dark:text-[#eef2e9] sm:max-w-none"
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
      <p className="m-0 text-sm text-[#68746d] dark:text-[#a8b2a8]">
        {formatControlValue(value, definition)} {definition.suffix}
      </p>
    </div>
  );
}

export function ScenarioWorkshopView({
  formState,
  updateFormValue,
}: {
  formState: ScenarioFormState;
  updateFormValue: (id: keyof ScenarioFormState, value: number) => void;
}) {
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
  const periodLabel = `${modelStart.startYear}-${modelStart.endYear}`;

  return (
    <>
      <header className="mb-8 max-w-5xl">
        <h1 className="m-0 text-3xl leading-[1.1] tracking-normal sm:text-5xl">
          Scenarioverksted
        </h1>
        <p className="mt-4 max-w-3xl text-base text-[#435048] dark:text-[#c7d0c3]">
          Første modell kjører hele Oslo fra {modelStart.startYear} til{" "}
          {modelStart.endYear}. Tallene er grove startverdier og skal brukes til
          å teste modellstruktur.
        </p>
      </header>

      <div className="grid gap-6 xl:grid-cols-[23rem_1fr]">
        <aside className="w-full max-w-[32rem] self-start rounded-lg border border-[#ddd8cd] bg-white p-5 dark:border-[#3b4438] dark:bg-[#1a201a] xl:max-w-none">
          <h2 className="m-0 text-xl font-semibold">Scenario</h2>
          <p className="mt-2 text-sm text-[#68746d] dark:text-[#a8b2a8]">
            Slidere gir rask utforsking. Nummerfeltene kan brukes for presise
            verdier.
          </p>

          {controlGroups.map((group) => {
            const groupControls = controls.filter(
              (control) => control.group === group.id,
            );

            return (
              <section className="mt-6" key={group.id}>
                <h3 className="m-0 text-sm font-bold text-[#435048] uppercase dark:text-[#c7d0c3]">
                  {group.id}
                </h3>
                <p className="mt-1 text-sm leading-snug text-[#68746d] dark:text-[#a8b2a8]">
                  {group.description}
                </p>
                <div className="mt-2">
                  {groupControls.length === 0 ? (
                    <p className="m-0 rounded-md border border-dashed border-[#cfc7b8] bg-[#fbf8f1] p-3 text-sm text-[#68746d] dark:border-[#586252] dark:bg-[#22291f] dark:text-[#a8b2a8]">
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

        <section className="grid min-w-0 gap-6">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 2xl:grid-cols-4">
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

          <section className="rounded-lg border border-[#ddd8cd] bg-white p-5 dark:border-[#3b4438] dark:bg-[#1a201a]">
            <div className="grid gap-3 text-sm leading-snug text-[#435048] dark:text-[#c7d0c3] md:grid-cols-2">
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

          <section className="rounded-lg border border-[#ddd8cd] bg-white p-5 dark:border-[#3b4438] dark:bg-[#1a201a]">
            <h2 className="m-0 text-xl font-semibold">Årstabell</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-[#ddd8cd] text-[#68746d] dark:border-[#3b4438] dark:text-[#a8b2a8]">
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
                      className="border-b border-[#eee8dd] last:border-0 dark:border-[#30382f]"
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
    </>
  );
}
