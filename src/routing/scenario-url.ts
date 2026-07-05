import { defaultScenarioInputs } from "../model/start-values";

export type ScenarioUrlState = {
  municipalPurchases: number;
  municipalSales: number;
  nonCommercialShareOfNewBuild: number;
  interestRate: number;
  householdGrowthRate: number;
  constructionCostGrowth: number;
};

type ScenarioUrlField = keyof ScenarioUrlState;

type ScenarioUrlParameter = {
  field: ScenarioUrlField;
  max: number;
  min: number;
  parameter: string;
};

export const defaultScenarioUrlState: ScenarioUrlState = {
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

const parameters: ScenarioUrlParameter[] = [
  {
    field: "municipalPurchases",
    max: 2000,
    min: 0,
    parameter: "kjop",
  },
  {
    field: "municipalSales",
    max: 1000,
    min: 0,
    parameter: "salg",
  },
  {
    field: "nonCommercialShareOfNewBuild",
    max: 50,
    min: 0,
    parameter: "ikkekomm",
  },
  {
    field: "interestRate",
    max: 8,
    min: 1,
    parameter: "rente",
  },
  {
    field: "householdGrowthRate",
    max: 2,
    min: -0.5,
    parameter: "vekst",
  },
  {
    field: "constructionCostGrowth",
    max: 8,
    min: 0,
    parameter: "kost",
  },
];

const numberFormat = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 3,
  minimumFractionDigits: 0,
  useGrouping: false,
});

const isDefaultValue = (value: number, defaultValue: number) =>
  Math.abs(value - defaultValue) < 0.000001;

const isValidValue = (value: number, parameter: ScenarioUrlParameter) =>
  Number.isFinite(value) && value >= parameter.min && value <= parameter.max;

const toSearchParams = (query: string | URLSearchParams): URLSearchParams => {
  if (typeof query !== "string") {
    return query;
  }

  return new URLSearchParams(query.startsWith("?") ? query.slice(1) : query);
};

export const parseScenarioUrlState = (
  query: string | URLSearchParams,
): ScenarioUrlState => {
  const searchParams = toSearchParams(query);

  return parameters.reduce<ScenarioUrlState>(
    (state, parameter) => {
      const rawValue = searchParams.get(parameter.parameter);

      if (rawValue === null || rawValue.trim() === "") {
        return state;
      }

      const value = Number(rawValue);

      if (!isValidValue(value, parameter)) {
        return state;
      }

      return { ...state, [parameter.field]: value };
    },
    { ...defaultScenarioUrlState },
  );
};

export const serializeScenarioUrlState = (
  state: ScenarioUrlState,
): URLSearchParams => {
  const searchParams = new URLSearchParams();

  for (const parameter of parameters) {
    const value = state[parameter.field];
    const defaultValue = defaultScenarioUrlState[parameter.field];

    if (
      !isValidValue(value, parameter) ||
      isDefaultValue(value, defaultValue)
    ) {
      continue;
    }

    searchParams.set(parameter.parameter, numberFormat.format(value));
  }

  return searchParams;
};

export const serializeScenarioSearch = (state: ScenarioUrlState): string => {
  const searchParams = serializeScenarioUrlState(state);
  const search = searchParams.toString();

  return search === "" ? "" : `?${search}`;
};
