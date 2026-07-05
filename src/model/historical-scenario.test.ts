import { describe, expect, it } from "vitest";

import { observedOsloSeries } from "../data/observed-oslo";
import {
  compareHistoricalBacktest,
  historicalInitialState,
  historicalModelStart,
  historicalScenarioTimeline,
  simulateHistoricalScenario,
} from "./historical-scenario";

const totalHousingStock = () =>
  historicalInitialState.housingStock.ownerOccupied +
  historicalInitialState.housingStock.privateRental +
  historicalInitialState.housingStock.municipal +
  historicalInitialState.housingStock.nonCommercial;

describe("historical scenario", () => {
  it("starts in 2015 with observed total and municipal housing stock", () => {
    expect(historicalModelStart.startYear).toBe(2015);
    expect(historicalModelStart.endYear).toBe(2025);
    expect(totalHousingStock()).toBe(
      observedOsloSeries.housingStockTotal.values[2015],
    );
    expect(historicalInitialState.housingStock.municipal).toBe(
      observedOsloSeries.municipalDwellingsAvailable.values[2015],
    );
    expect(historicalInitialState.development.underConstruction).toEqual({
      2015: observedOsloSeries.startedDwellings.values[2013],
      2016: observedOsloSeries.startedDwellings.values[2014],
    });
  });

  it("uses observed starts and policy rates as historical exogenous input", () => {
    expect(
      historicalScenarioTimeline.exogenous[2024].startedDwellingsOverride,
    ).toBe(observedOsloSeries.startedDwellings.values[2024]);
    expect(historicalScenarioTimeline.exogenous[2024].interestRate).toBe(0.045);
  });

  it("passes observed starts through the completion pipeline", () => {
    const result = simulateHistoricalScenario();

    expect(
      result.years.find((year) => year.year === 2015)?.completedDwellings,
    ).toBe(observedOsloSeries.startedDwellings.values[2013]);
    expect(
      result.years.find((year) => year.year === 2016)?.completedDwellings,
    ).toBe(observedOsloSeries.startedDwellings.values[2014]);
    expect(
      result.years.find((year) => year.year === 2015)?.startedDwellings,
    ).toBe(observedOsloSeries.startedDwellings.values[2015]);
    expect(
      result.years.find((year) => year.year === 2017)?.completedDwellings,
    ).toBe(observedOsloSeries.startedDwellings.values[2015]);
  });

  it("builds a comparison against observed evaluation series", () => {
    const comparison = compareHistoricalBacktest();
    const firstYear = comparison[0];

    expect(firstYear.year).toBe(2015);
    expect(firstYear.observedTotalHousingStock).toBe(
      observedOsloSeries.housingStockTotal.values[2015],
    );
    expect(firstYear.observedCompletedDwellings).toBe(
      observedOsloSeries.completedDwellings.values[2015],
    );
  });
});
