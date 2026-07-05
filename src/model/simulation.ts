import {
  defaultScenarioInputs,
  initialState,
  modelParameters,
  modelStart,
} from "./start-values";
import type {
  ExogenousInputs,
  HousingStock,
  ModelParameters,
  ModelStart,
  ModelState,
  ScenarioInputs,
  ScenarioTimeline,
  SimulationResult,
  SimulationYearResult,
  Year,
} from "./types";

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(Math.max(value, minimum), maximum);

const sumHousingStock = (housingStock: HousingStock) =>
  housingStock.ownerOccupied +
  housingStock.privateRental +
  housingStock.municipal +
  housingStock.nonCommercial;

const cloneState = (state: ModelState): ModelState => ({
  ...state,
  housingStock: { ...state.housingStock },
  households: { ...state.households },
  development: {
    ...state.development,
    underConstruction: { ...state.development.underConstruction },
  },
});

export const expandScenarioInputs = (
  inputs: ScenarioInputs | ScenarioTimeline,
  start: ModelStart = modelStart,
): ScenarioTimeline => {
  if (!("municipalPurchases" in inputs.policies)) {
    return inputs;
  }

  const constantInputs = inputs as ScenarioInputs;
  const policies: Record<Year, ScenarioInputs["policies"]> = {};
  const exogenous: Record<Year, ScenarioInputs["exogenous"]> = {};

  for (let year = start.startYear; year <= start.endYear; year += 1) {
    policies[year] = { ...constantInputs.policies };
    exogenous[year] = { ...constantInputs.exogenous };
  }

  return { policies, exogenous };
};

const calculatePrivateRentalPressure = (state: ModelState) => {
  const renterHouseholds =
    state.households.lowIncomeRenters + state.households.otherRenters;

  return renterHouseholds / Math.max(1, state.housingStock.privateRental);
};

const calculateTotalHousingPressure = (state: ModelState) => {
  const totalHouseholds =
    state.households.lowIncomeRenters +
    state.households.otherRenters +
    state.households.ownerHouseholds;
  const totalHousingStock = sumHousingStock(state.housingStock);

  return totalHouseholds / Math.max(1, totalHousingStock);
};

const calculateHousingPriceIndex = (
  state: ModelState,
  exogenous: ExogenousInputs,
  completedDwellings: number,
  parameters: ModelParameters,
) => {
  const totalHousingStock = sumHousingStock(state.housingStock);
  const supplyRelief = completedDwellings / Math.max(1, totalHousingStock);
  const totalHousingPressure = calculateTotalHousingPressure(state);
  const demandPressure = Math.max(0, totalHousingPressure - 1);
  const priceGrowth =
    parameters.demandPressurePriceWeight * demandPressure +
    exogenous.householdGrowthRate -
    parameters.interestRatePriceWeight * exogenous.interestRate -
    parameters.supplyReliefPriceWeight * supplyRelief;

  return Math.max(1, state.housingPriceIndex * (1 + priceGrowth));
};

const calculateProjectMargin = (
  housingPriceIndex: number,
  constructionCostIndex: number,
  inputs: ScenarioInputs,
  parameters: ModelParameters,
) =>
  housingPriceIndex / 100 -
  (constructionCostIndex / 100) * parameters.constructionCostWeight -
  inputs.exogenous.interestRate * parameters.interestCostWeight -
  inputs.policies.nonCommercialShareOfNewBuild *
    parameters.nonCommercialRequirementCost -
  parameters.marginThreshold;

const applyHouseholdGrowth = (
  state: ModelState,
  exogenous: ExogenousInputs,
) => {
  const renterGrowth =
    (state.households.lowIncomeRenters + state.households.otherRenters) *
    exogenous.householdGrowthRate;
  const ownerGrowth =
    state.households.ownerHouseholds * exogenous.householdGrowthRate;

  return {
    lowIncomeRenters: state.households.lowIncomeRenters + renterGrowth * 0.4,
    otherRenters: state.households.otherRenters + renterGrowth * 0.6,
    ownerHouseholds: state.households.ownerHouseholds + ownerGrowth,
  };
};

export const simulateOneYear = (
  state: ModelState,
  inputs: ScenarioInputs = defaultScenarioInputs,
  parameters: ModelParameters = modelParameters,
): SimulationYearResult => {
  const currentState = cloneState(state);
  const completedDwellings =
    currentState.development.underConstruction[currentState.year] ?? 0;
  const housingPriceIndex = calculateHousingPriceIndex(
    currentState,
    inputs.exogenous,
    completedDwellings,
    parameters,
  );
  const constructionCostIndex =
    currentState.constructionCostIndex *
    (1 + inputs.exogenous.constructionCostGrowth);
  const projectMargin = calculateProjectMargin(
    housingPriceIndex,
    constructionCostIndex,
    inputs,
    parameters,
  );
  const startShare = clamp(
    parameters.baseStartShare + parameters.marginSensitivity * projectMargin,
    parameters.minStartShare,
    parameters.maxStartShare,
  );
  const startedDwellings =
    currentState.development.regulatedBacklog * startShare;
  const completionYear =
    currentState.year + currentState.development.completionLagYears;
  const nonCommercialCompleted =
    completedDwellings * inputs.policies.nonCommercialShareOfNewBuild;
  const marketCompleted = completedDwellings - nonCommercialCompleted;
  const municipalPurchases = Math.min(
    inputs.policies.municipalPurchases,
    currentState.housingStock.privateRental +
      currentState.housingStock.ownerOccupied,
  );
  const municipalSales = Math.min(
    inputs.policies.municipalSales,
    currentState.housingStock.municipal + municipalPurchases,
  );
  const purchasesFromPrivateRental = Math.min(
    municipalPurchases,
    currentState.housingStock.privateRental,
  );
  const purchasesFromOwnerOccupied =
    municipalPurchases - purchasesFromPrivateRental;
  const soldToPrivateRental = municipalSales;
  const underConstruction = { ...currentState.development.underConstruction };

  delete underConstruction[currentState.year];
  underConstruction[completionYear] =
    (underConstruction[completionYear] ?? 0) + startedDwellings;

  const nextState: ModelState = {
    year: currentState.year + 1,
    housingPriceIndex,
    constructionCostIndex,
    housingStock: {
      ownerOccupied:
        currentState.housingStock.ownerOccupied -
        purchasesFromOwnerOccupied +
        marketCompleted * 0.7,
      privateRental:
        currentState.housingStock.privateRental -
        purchasesFromPrivateRental +
        soldToPrivateRental +
        marketCompleted * 0.3,
      municipal:
        currentState.housingStock.municipal +
        municipalPurchases -
        municipalSales,
      nonCommercial:
        currentState.housingStock.nonCommercial + nonCommercialCompleted,
    },
    households: applyHouseholdGrowth(currentState, inputs.exogenous),
    development: {
      regulatedBacklog:
        currentState.development.regulatedBacklog +
        inputs.exogenous.regulatedNewCapacity -
        startedDwellings,
      startedDwellings,
      underConstruction,
      completionLagYears: currentState.development.completionLagYears,
    },
  };
  const privateRentalPressure = calculatePrivateRentalPressure(nextState);
  const pressureAboveThreshold = Math.max(
    0,
    privateRentalPressure - parameters.rentPressureThreshold,
  );
  const highHousingCostBurdenHouseholds =
    nextState.households.lowIncomeRenters *
    clamp(
      parameters.highHousingCostBurdenThreshold + pressureAboveThreshold,
      0,
      1,
    );

  return {
    year: currentState.year,
    state: nextState,
    completedDwellings,
    startedDwellings,
    projectMargin,
    startShare,
    privateRentalPressure,
    highHousingCostBurdenHouseholds,
  };
};

export const simulateScenario = ({
  start = modelStart,
  state = initialState,
  inputs = defaultScenarioInputs,
  parameters = modelParameters,
}: {
  start?: ModelStart;
  state?: ModelState;
  inputs?: ScenarioInputs | ScenarioTimeline;
  parameters?: ModelParameters;
} = {}): SimulationResult => {
  const years: SimulationYearResult[] = [];
  let currentState = cloneState({ ...state, year: start.startYear });
  const timeline = expandScenarioInputs(inputs, start);

  for (let year = start.startYear; year <= start.endYear; year += 1) {
    const result = simulateOneYear(
      { ...currentState, year },
      {
        policies: timeline.policies[year],
        exogenous: timeline.exogenous[year],
      },
      parameters,
    );

    years.push(result);
    currentState = result.state;
  }

  return {
    modelStart: start,
    inputs: timeline,
    parameters,
    years,
  };
};
