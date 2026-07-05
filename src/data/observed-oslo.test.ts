import { describe, expect, it } from "vitest";

import { firstBacktestYears, observedOsloSeries } from "./observed-oslo";

const yearKeys = (values: Record<number, number>) =>
  Object.keys(values).map(Number);

describe("observedOsloSeries", () => {
  it("keeps first backtest years inside all first evaluation series", () => {
    const evaluationSeries = [
      observedOsloSeries.housingStockTotal,
      observedOsloSeries.startedDwellings,
      observedOsloSeries.completedDwellings,
      observedOsloSeries.municipalDwellingsAvailable,
    ];

    for (const series of evaluationSeries) {
      expect(yearKeys(series.values)).toContain(firstBacktestYears.start);
      expect(yearKeys(series.values)).toContain(firstBacktestYears.end);
    }
  });

  it("uses observed housing stock as an external evaluation series", () => {
    expect(observedOsloSeries.housingStockTotal.values[2015]).toBe(323_856);
    expect(observedOsloSeries.housingStockTotal.values[2026]).toBe(357_673);
  });

  it("keeps completed dwellings separate from started dwellings", () => {
    expect(observedOsloSeries.startedDwellings.values[2025]).toBe(1_764);
    expect(observedOsloSeries.completedDwellings.values[2025]).toBe(2_122);
  });

  it("documents kommunalt disponerte boliger as the municipal stock proxy", () => {
    expect(observedOsloSeries.municipalDwellingsAvailable.values[2025]).toBe(
      14_137,
    );
    expect(observedOsloSeries.municipalDwellingsAvailable.source.notes).toMatch(
      /proxy/,
    );
  });

  it("stores policy rate annual averages as decimal rates", () => {
    expect(observedOsloSeries.policyRateAnnualAverage.values[2021]).toBeCloseTo(
      0.000791,
    );
    expect(observedOsloSeries.policyRateAnnualAverage.values[2024]).toBe(0.045);
    expect(observedOsloSeries.policyRateAnnualAverage.source.notes).toMatch(
      /OL minus 1/,
    );
  });
});
