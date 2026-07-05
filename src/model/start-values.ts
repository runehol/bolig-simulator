import { observedOsloSeries } from "../data/observed-oslo";
import { buildInitialUnderConstruction } from "./development-pipeline";
import type {
  ModelParameters,
  ModelStart,
  ModelState,
  ScenarioInputs,
} from "./types";

export const modelStart: ModelStart = {
  modelVersion: "0.1-example",
  startYear: 2027,
  endYear: 2040,
  geography: "whole-oslo",
  dataQuality: "rough",
};

export const initialCompletionLagYears = 2;
export const initialAnnualStartsFallback = 2_150;

export const initialState: ModelState = {
  year: 2027,
  housingPriceIndex: 100,
  constructionCostIndex: 100,
  housingStock: {
    ownerOccupied: 261_000,
    privateRental: 113_000,
    municipal: 12_000,
    nonCommercial: 100,
  },
  households: {
    lowIncomeRenters: 40_000,
    otherRenters: 73_000,
    ownerHouseholds: 261_000,
  },
  development: {
    regulatedBacklog: 25_000,
    startedDwellings: initialAnnualStartsFallback,
    underConstruction: buildInitialUnderConstruction({
      startYear: modelStart.startYear,
      completionLagYears: initialCompletionLagYears,
      annualStartsByYear: observedOsloSeries.startedDwellings.values,
      fallbackAnnualStarts: initialAnnualStartsFallback,
    }),
    completionLagYears: initialCompletionLagYears,
  },
};

export const modelParameters: ModelParameters = {
  baseStartShare: 0.08,
  minStartShare: 0.02,
  maxStartShare: 0.18,
  marginThreshold: 0,
  marginSensitivity: 0.08,
  interestCostWeight: 0.08,
  constructionCostWeight: 0.01,
  nonCommercialRequirementCost: 0.25,
  demandPressurePriceWeight: 0.6,
  interestRatePriceWeight: 0.03,
  supplyReliefPriceWeight: 0.2,
  rentPressureThreshold: 1.0,
  highHousingCostBurdenThreshold: 0.3,
};

export const defaultScenarioInputs: ScenarioInputs = {
  policies: {
    municipalPurchases: 500,
    municipalSales: 0,
    nonCommercialShareOfNewBuild: 0.2,
  },
  exogenous: {
    interestRate: 0.0425,
    householdGrowthRate: 0.008,
    constructionCostGrowth: 0.03,
    regulatedNewCapacity: 2_500,
  },
};
