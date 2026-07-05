import type { ScenarioUrlState } from "../routing/scenario-url";

export type ControlDefinition = {
  id: keyof ScenarioUrlState;
  label: string;
  min: number;
  max: number;
  step: number;
  suffix: string;
  group: "Oslo-kommunale grep" | "Eksterne makroforutsetninger";
};

export const controls: ControlDefinition[] = [
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

export const clampScenarioFormValue = (
  id: keyof ScenarioUrlState,
  value: number,
) => {
  const definition = controls.find((control) => control.id === id);

  return definition
    ? Math.min(Math.max(value, definition.min), definition.max)
    : value;
};
