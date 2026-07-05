import { describe, expect, it } from "vitest";

import {
  defaultScenarioUrlState,
  parseScenarioUrlState,
  serializeScenarioSearch,
  serializeScenarioUrlState,
} from "./scenario-url";

describe("scenario URL routing", () => {
  it("keeps default values implicit", () => {
    expect(serializeScenarioSearch(defaultScenarioUrlState)).toBe("");
  });

  it("serializes only values that differ from the default scenario", () => {
    const searchParams = serializeScenarioUrlState({
      ...defaultScenarioUrlState,
      householdGrowthRate: 1.2,
      municipalPurchases: 900,
    });

    expect(searchParams.toString()).toBe("kjop=900&vekst=1.2");
  });

  it("parses a partial URL on top of the default scenario", () => {
    expect(parseScenarioUrlState("?kjop=900&rente=5.5")).toEqual({
      ...defaultScenarioUrlState,
      interestRate: 5.5,
      municipalPurchases: 900,
    });
  });

  it("ignores unknown, missing and invalid parameters", () => {
    expect(
      parseScenarioUrlState(
        "?kjop=not-a-number&salg=1200&rente=&gammel=123&kost=4",
      ),
    ).toEqual({
      ...defaultScenarioUrlState,
      constructionCostGrowth: 4,
    });
  });

  it("round-trips a valid scenario through the URL format", () => {
    const scenario = {
      constructionCostGrowth: 4.5,
      householdGrowthRate: 1.1,
      interestRate: 5.2,
      municipalPurchases: 1250,
      municipalSales: 250,
      nonCommercialShareOfNewBuild: 35,
    };

    expect(parseScenarioUrlState(serializeScenarioSearch(scenario))).toEqual(
      scenario,
    );
  });
});
