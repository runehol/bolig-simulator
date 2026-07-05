import { observedOsloSeries, firstBacktestYears } from "../data/observed-oslo";
import { buildInitialUnderConstruction } from "./development-pipeline";
import { modelParameters } from "./start-values";
import { simulateScenario } from "./simulation";
import type {
  ModelStart,
  ModelState,
  ScenarioTimeline,
  SimulationResult,
  Year,
} from "./types";

export type HistoricalBacktestYear = {
  year: Year;
  modeledTotalHousingStock: number;
  observedTotalHousingStock: number | undefined;
  totalHousingStockError: number | undefined;
  modeledCompletedDwellings: number;
  observedCompletedDwellings: number | undefined;
  completedDwellingsError: number | undefined;
};

const ownerOccupiedShareOfPrivateStock = 261_000 / (261_000 + 113_000);
const lowIncomeShareOfRenters = 40_000 / (40_000 + 73_000);
const historicalCompletionLagYears = 2;
const historicalInitialAnnualStartsFallback =
  observedOsloSeries.startedDwellings.values[firstBacktestYears.start];

const sumHousingStock = (state: ModelState) =>
  state.housingStock.ownerOccupied +
  state.housingStock.privateRental +
  state.housingStock.municipal +
  state.housingStock.nonCommercial;

const buildHistoricalInitialState = (): ModelState => {
  const year = firstBacktestYears.start;
  const totalHousingStock = observedOsloSeries.housingStockTotal.values[year];
  const municipal = observedOsloSeries.municipalDwellingsAvailable.values[year];
  const nonCommercial = 0;
  const privateStock = totalHousingStock - municipal - nonCommercial;
  const ownerOccupied = Math.round(
    privateStock * ownerOccupiedShareOfPrivateStock,
  );
  const privateRental = privateStock - ownerOccupied;

  return {
    year,
    housingPriceIndex: 100,
    constructionCostIndex: 100,
    housingStock: {
      ownerOccupied,
      privateRental,
      municipal,
      nonCommercial,
    },
    households: {
      lowIncomeRenters: Math.round(privateRental * lowIncomeShareOfRenters),
      otherRenters: Math.round(privateRental * (1 - lowIncomeShareOfRenters)),
      ownerHouseholds: ownerOccupied,
    },
    development: {
      regulatedBacklog: 25_000,
      startedDwellings:
        observedOsloSeries.startedDwellings.values[firstBacktestYears.start],
      underConstruction: buildInitialUnderConstruction({
        startYear: firstBacktestYears.start,
        completionLagYears: historicalCompletionLagYears,
        annualStartsByYear: observedOsloSeries.startedDwellings.values,
        fallbackAnnualStarts: historicalInitialAnnualStartsFallback,
      }),
      completionLagYears: historicalCompletionLagYears,
    },
  };
};

export const historicalModelStart: ModelStart = {
  modelVersion: "0.1-historical-observed-starts",
  startYear: firstBacktestYears.start,
  endYear: firstBacktestYears.end,
  geography: "whole-oslo",
  dataQuality: "rough",
};

export const historicalInitialState: ModelState = buildHistoricalInitialState();

export const historicalScenarioTimeline: ScenarioTimeline = {
  policies: {},
  exogenous: {},
};

for (
  let year = historicalModelStart.startYear;
  year <= historicalModelStart.endYear;
  year += 1
) {
  const startedDwellings = observedOsloSeries.startedDwellings.values[year];

  historicalScenarioTimeline.policies[year] = {
    municipalPurchases: 0,
    municipalSales: 0,
    nonCommercialShareOfNewBuild: 0,
  };
  historicalScenarioTimeline.exogenous[year] = {
    interestRate: observedOsloSeries.policyRateAnnualAverage.values[year],
    householdGrowthRate: 0,
    constructionCostGrowth: 0,
    regulatedNewCapacity: startedDwellings,
    startedDwellingsOverride: startedDwellings,
  };
}

export const simulateHistoricalScenario = (): SimulationResult =>
  simulateScenario({
    start: historicalModelStart,
    state: historicalInitialState,
    inputs: historicalScenarioTimeline,
    parameters: modelParameters,
  });

export const compareHistoricalBacktest = (
  result: SimulationResult = simulateHistoricalScenario(),
): HistoricalBacktestYear[] =>
  result.years.map((yearResult) => {
    const modeledTotalHousingStock = sumHousingStock(yearResult.state);
    const observedTotalHousingStock =
      observedOsloSeries.housingStockTotal.values[yearResult.year];
    const observedCompletedDwellings =
      observedOsloSeries.completedDwellings.values[yearResult.year];

    return {
      year: yearResult.year,
      modeledTotalHousingStock,
      observedTotalHousingStock,
      totalHousingStockError:
        observedTotalHousingStock === undefined
          ? undefined
          : modeledTotalHousingStock - observedTotalHousingStock,
      modeledCompletedDwellings: yearResult.completedDwellings,
      observedCompletedDwellings,
      completedDwellingsError:
        observedCompletedDwellings === undefined
          ? undefined
          : yearResult.completedDwellings - observedCompletedDwellings,
    };
  });
