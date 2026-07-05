import type { Year } from "../model/types";

export type ObservedSeriesSource = {
  name: string;
  url: string;
  updated: string;
  accessed: string;
  notes?: string;
};

export type ObservedSeries = {
  source: ObservedSeriesSource;
  values: Record<Year, number>;
};

export type ObservedOsloSeries = {
  housingStockTotal: ObservedSeries;
  startedDwellings: ObservedSeries;
  completedDwellings: ObservedSeries;
  municipalDwellingsAvailable: ObservedSeries;
  municipalDwellingsOwned: ObservedSeries;
  policyRateAnnualAverage: ObservedSeries;
};

const accessed = "2026-07-05";

const ssbHousingStockSource: ObservedSeriesSource = {
  name: "SSB tabell 06265: Boliger, etter region, bygningstype, statistikkvariabel og år",
  url: "https://data.ssb.no/api/v0/no/table/06265",
  updated: "2026-03-03",
  accessed,
};

const ssbBuildingActivitySource: ObservedSeriesSource = {
  name: "SSB tabell 05940: Byggeareal. Boliger og bruksareal til bolig, etter bygningstype",
  url: "https://data.ssb.no/api/v0/no/table/05940",
  updated: "2026-01-29",
  accessed,
};

const ssbMunicipalHousingSource: ObservedSeriesSource = {
  name: "SSB tabell 12008: Kommunalt disponerte boliger",
  url: "https://data.ssb.no/api/v0/no/table/12008",
  updated: "2026-06-15",
  accessed,
  notes:
    "Kommunalt disponerte boliger brukes som praktisk proxy for kommunal boligbestand.",
};

const norgesBankPolicyRateSource: ObservedSeriesSource = {
  name: "Norges Bank data API: IR/B.KPRA.OL.R, styringsrente avledet fra rentekorridor",
  url: "https://data.norges-bank.no/api/data/IR/B.KPRA.OL.R",
  updated: "2026-07-05",
  accessed,
  notes:
    "Årsgjennomsnitt av dagsobservasjoner. Serien OL er utlånsrente over natten; styringsrenten er avledet som OL minus 1 prosentpoeng i perioden.",
};

export const observedOsloSeries: ObservedOsloSeries = {
  housingStockTotal: {
    source: ssbHousingStockSource,
    values: {
      2015: 323_856,
      2016: 326_506,
      2017: 329_358,
      2018: 332_292,
      2019: 336_901,
      2020: 342_640,
      2021: 345_427,
      2022: 348_252,
      2023: 350_315,
      2024: 353_256,
      2025: 355_915,
      2026: 357_673,
    },
  },
  startedDwellings: {
    source: ssbBuildingActivitySource,
    values: {
      2015: 2_328,
      2016: 4_829,
      2017: 5_555,
      2018: 3_240,
      2019: 2_516,
      2020: 2_790,
      2021: 2_894,
      2022: 1_669,
      2023: 2_495,
      2024: 2_121,
      2025: 1_764,
    },
  },
  completedDwellings: {
    source: ssbBuildingActivitySource,
    values: {
      2015: 2_059,
      2016: 2_398,
      2017: 2_686,
      2018: 4_241,
      2019: 4_849,
      2020: 2_974,
      2021: 2_619,
      2022: 1_959,
      2023: 3_239,
      2024: 3_076,
      2025: 2_122,
    },
  },
  municipalDwellingsAvailable: {
    source: ssbMunicipalHousingSource,
    values: {
      2015: 12_751,
      2016: 12_609,
      2017: 12_902,
      2018: 13_029,
      2019: 13_060,
      2020: 13_209,
      2021: 13_230,
      2022: 13_567,
      2023: 13_910,
      2024: 14_043,
      2025: 14_137,
    },
  },
  municipalDwellingsOwned: {
    source: ssbMunicipalHousingSource,
    values: {
      2015: 11_056,
      2016: 11_021,
      2017: 11_259,
      2018: 11_609,
      2019: 11_658,
      2020: 11_837,
      2021: 11_892,
      2022: 12_194,
      2023: 12_591,
      2024: 12_619,
      2025: 12_720,
    },
  },
  policyRateAnnualAverage: {
    source: norgesBankPolicyRateSource,
    values: {
      2015: 0.010456,
      2016: 0.005534,
      2017: 0.005,
      2018: 0.00569,
      2019: 0.01148,
      2020: 0.003577,
      2021: 0.000791,
      2022: 0.01334,
      2023: 0.035448,
      2024: 0.045,
      2025: 0.042938,
    },
  },
};

export const firstBacktestYears = {
  start: 2015,
  end: 2025,
} as const;
