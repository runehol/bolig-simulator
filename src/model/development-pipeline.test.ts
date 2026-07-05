import { describe, expect, it } from "vitest";

import { buildInitialUnderConstruction } from "./development-pipeline";

describe("buildInitialUnderConstruction", () => {
  it("fills initial completions from starts before the model start", () => {
    expect(
      buildInitialUnderConstruction({
        startYear: 2015,
        completionLagYears: 2,
        annualStartsByYear: {
          2013: 3_668,
          2014: 1_732,
        },
        fallbackAnnualStarts: 2_000,
      }),
    ).toEqual({
      2015: 3_668,
      2016: 1_732,
    });
  });

  it("uses the same fallback rule when earlier starts are missing", () => {
    expect(
      buildInitialUnderConstruction({
        startYear: 2027,
        completionLagYears: 2,
        annualStartsByYear: {
          2025: 1_764,
        },
        fallbackAnnualStarts: 2_150,
      }),
    ).toEqual({
      2027: 1_764,
      2028: 2_150,
    });
  });
});
