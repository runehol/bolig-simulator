import type { Year } from "./types";

export type InitialUnderConstructionInput = {
  startYear: Year;
  completionLagYears: number;
  annualStartsByYear: Record<Year, number>;
  fallbackAnnualStarts: number;
};

export const buildInitialUnderConstruction = ({
  startYear,
  completionLagYears,
  annualStartsByYear,
  fallbackAnnualStarts,
}: InitialUnderConstructionInput): Record<Year, number> => {
  const underConstruction: Record<Year, number> = {};

  for (let offset = 0; offset < completionLagYears; offset += 1) {
    const completionYear = startYear + offset;
    const startYearForCompletion = completionYear - completionLagYears;

    underConstruction[completionYear] =
      annualStartsByYear[startYearForCompletion] ?? fallbackAnnualStarts;
  }

  return underConstruction;
};
