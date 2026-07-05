import { describe, expect, it } from "vitest";

import {
  defaultScenarioInputs,
  initialState,
  modelParameters,
  modelStart,
} from "./start-values";
import {
  expandScenarioInputs,
  simulateOneYear,
  simulateScenario,
} from "./simulation";
import type { ModelState, ScenarioInputs } from "./types";

const totalHousingStock = (state: ModelState) =>
  state.housingStock.ownerOccupied +
  state.housingStock.privateRental +
  state.housingStock.municipal +
  state.housingStock.nonCommercial;

const withoutScheduledCompletions: ModelState = {
  ...initialState,
  development: {
    ...initialState.development,
    underConstruction: {},
  },
};

describe("simulateScenario", () => {
  it("is deterministic for the same starting values and inputs", () => {
    const firstRun = simulateScenario();
    const secondRun = simulateScenario();

    expect(secondRun).toEqual(firstRun);
    expect(firstRun.years).toHaveLength(
      modelStart.endYear - modelStart.startYear + 1,
    );
  });

  it("expands constant scenario inputs to one value per year", () => {
    const timeline = expandScenarioInputs(defaultScenarioInputs);

    expect(timeline.policies[2027]).toEqual(defaultScenarioInputs.policies);
    expect(timeline.exogenous[2040]).toEqual(defaultScenarioInputs.exogenous);
    expect(Object.keys(timeline.policies)).toHaveLength(14);
  });
});

describe("simulateOneYear", () => {
  it("starts more dwellings when the housing price index is higher", () => {
    const lowerPrice = simulateOneYear({
      ...withoutScheduledCompletions,
      housingPriceIndex: 95,
    });
    const higherPrice = simulateOneYear({
      ...withoutScheduledCompletions,
      housingPriceIndex: 120,
    });

    expect(higherPrice.startedDwellings).toBeGreaterThan(
      lowerPrice.startedDwellings,
    );
  });

  it("starts fewer dwellings when interest rates are higher", () => {
    const lowInterestInputs: ScenarioInputs = {
      ...defaultScenarioInputs,
      exogenous: {
        ...defaultScenarioInputs.exogenous,
        interestRate: 0.02,
      },
    };
    const highInterestInputs: ScenarioInputs = {
      ...defaultScenarioInputs,
      exogenous: {
        ...defaultScenarioInputs.exogenous,
        interestRate: 0.12,
      },
    };

    const lowInterest = simulateOneYear(
      withoutScheduledCompletions,
      lowInterestInputs,
    );
    const highInterest = simulateOneYear(
      withoutScheduledCompletions,
      highInterestInputs,
    );

    expect(highInterest.startedDwellings).toBeLessThan(
      lowInterest.startedDwellings,
    );
  });

  it("starts fewer dwellings when construction costs are higher", () => {
    const stableCostsInputs: ScenarioInputs = {
      ...defaultScenarioInputs,
      exogenous: {
        ...defaultScenarioInputs.exogenous,
        constructionCostGrowth: 0,
      },
    };
    const highCostsInputs: ScenarioInputs = {
      ...defaultScenarioInputs,
      exogenous: {
        ...defaultScenarioInputs.exogenous,
        constructionCostGrowth: 1,
      },
    };

    const stableCosts = simulateOneYear(
      withoutScheduledCompletions,
      stableCostsInputs,
    );
    const highCosts = simulateOneYear(
      withoutScheduledCompletions,
      highCostsInputs,
    );

    expect(highCosts.startedDwellings).toBeLessThan(
      stableCosts.startedDwellings,
    );
  });

  it("schedules started dwellings after the completion lag", () => {
    const result = simulateOneYear(withoutScheduledCompletions);
    const completionYear =
      withoutScheduledCompletions.year +
      withoutScheduledCompletions.development.completionLagYears;

    expect(result.state.development.underConstruction[completionYear]).toBe(
      result.startedDwellings,
    );
  });

  it("moves municipal purchases into municipal stock without growing total stock", () => {
    const result = simulateOneYear(withoutScheduledCompletions);

    expect(result.state.housingStock.municipal).toBe(
      withoutScheduledCompletions.housingStock.municipal +
        defaultScenarioInputs.policies.municipalPurchases,
    );
    expect(totalHousingStock(result.state)).toBe(
      totalHousingStock(withoutScheduledCompletions),
    );
  });

  it("reduces municipal stock when municipal sales are set", () => {
    const saleInputs: ScenarioInputs = {
      ...defaultScenarioInputs,
      policies: {
        ...defaultScenarioInputs.policies,
        municipalPurchases: 0,
        municipalSales: 400,
      },
    };
    const result = simulateOneYear(withoutScheduledCompletions, saleInputs);

    expect(result.state.housingStock.municipal).toBe(
      withoutScheduledCompletions.housingStock.municipal - 400,
    );
  });

  it("adds completed non-commercial dwellings from the new-build share", () => {
    const result = simulateOneYear(initialState);

    expect(result.state.housingStock.nonCommercial).toBe(
      initialState.housingStock.nonCommercial +
        result.completedDwellings *
          defaultScenarioInputs.policies.nonCommercialShareOfNewBuild,
    );
  });

  it("raises private rental pressure when rental supply is lower", () => {
    const lowerSupply = simulateOneYear({
      ...withoutScheduledCompletions,
      housingStock: {
        ...withoutScheduledCompletions.housingStock,
        privateRental: 90_000,
      },
    });
    const higherSupply = simulateOneYear({
      ...withoutScheduledCompletions,
      housingStock: {
        ...withoutScheduledCompletions.housingStock,
        privateRental: 140_000,
      },
    });

    expect(lowerSupply.privateRentalPressure).toBeGreaterThan(
      higherSupply.privateRentalPressure,
    );
  });

  it("uses clamped start shares", () => {
    const result = simulateOneYear(
      {
        ...withoutScheduledCompletions,
        housingPriceIndex: 1_000,
      },
      defaultScenarioInputs,
      modelParameters,
    );

    expect(result.startShare).toBe(modelParameters.maxStartShare);
  });
});
