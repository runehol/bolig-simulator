export type Year = number;

export type DataQuality = "observed" | "derived" | "rough" | "assumption";

export type Geography = "whole-oslo";

export type ModelStart = {
  modelVersion: string;
  startYear: Year;
  endYear: Year;
  geography: Geography;
  dataQuality: DataQuality;
};

export type HousingStock = {
  ownerOccupied: number;
  privateRental: number;
  municipal: number;
  nonCommercial: number;
};

export type HouseholdState = {
  lowIncomeRenters: number;
  otherRenters: number;
  ownerHouseholds: number;
};

export type DevelopmentState = {
  regulatedBacklog: number;
  startedDwellings: number;
  underConstruction: Record<Year, number>;
  completionLagYears: number;
};

export type ModelState = {
  year: Year;
  housingPriceIndex: number;
  constructionCostIndex: number;
  housingStock: HousingStock;
  households: HouseholdState;
  development: DevelopmentState;
};

export type PolicyInputs = {
  municipalPurchases: number;
  municipalSales: number;
  nonCommercialShareOfNewBuild: number;
};

export type ExogenousInputs = {
  interestRate: number;
  householdGrowthRate: number;
  constructionCostGrowth: number;
  regulatedNewCapacity: number;
};

export type ScenarioInputs = {
  policies: PolicyInputs;
  exogenous: ExogenousInputs;
};

export type ScenarioTimeline = {
  policies: Record<Year, PolicyInputs>;
  exogenous: Record<Year, ExogenousInputs>;
};

export type ModelParameters = {
  baseStartShare: number;
  minStartShare: number;
  maxStartShare: number;
  marginThreshold: number;
  marginSensitivity: number;
  interestCostWeight: number;
  constructionCostWeight: number;
  nonCommercialRequirementCost: number;
  demandPressurePriceWeight: number;
  interestRatePriceWeight: number;
  supplyReliefPriceWeight: number;
  rentPressureThreshold: number;
  highHousingCostBurdenThreshold: number;
};

export type SimulationYearResult = {
  year: Year;
  state: ModelState;
  completedDwellings: number;
  startedDwellings: number;
  projectMargin: number;
  startShare: number;
  privateRentalPressure: number;
  highHousingCostBurdenHouseholds: number;
};

export type SimulationResult = {
  modelStart: ModelStart;
  inputs: ScenarioTimeline;
  parameters: ModelParameters;
  years: SimulationYearResult[];
};
