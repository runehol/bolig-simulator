# Modellstartverdier

Grove startverdier for første kjørbare modell av Oslo boligsimulator. Verdiene
skal være lette å bytte ut og skal ikke blandes inn i modellreglene. Første
modell bruker hele Oslo som én geografisk enhet og kjører framtidsscenario fra
2027 til 2040. Historisk 2015-løp hører til senere backtest.

Disse tallene er startverdier for å teste modellstruktur, ikke ferdig kalibrerte
verdier for offentlig bruk.

## Datakvalitet

- `observed`: hentet direkte fra kilde.
- `derived`: regnet enkelt fra observerte tall.
- `rough`: avrundet eller skjønnsmessig fordelt fra observerte nivåer.
- `assumption`: modellantakelse uten egen kildeverdi.

## Kilder

- SSB Kommunefakta for Oslo: <https://www.ssb.no/kommunefakta/oslo>
- SSB-tabeller brukt via Kommunefakta:
  - tabell 01222 for folketall
  - tabell 14746 for befolkningsframskriving
  - tabell 06265 for boligtypeindikatorer
  - tabell 09747 for beboere per husholdning
  - tabell 11038 for eid eller leid bolig
  - tabell 11046 for trangboddhet
- Boligbygg Oslo KF:
  <https://www.oslo.kommune.no/etater-foretak-og-ombud/boligbygg-oslo-kf/>
- Norges Bank policy rate:
  <https://www.norges-bank.no/en/topics/Monetary-policy/Policy-rate/>

## Observerte og avledede nivåer

| Felt                         | Verdi   | Kvalitet | Begrunnelse                                        |
| ---------------------------- | ------- | -------- | -------------------------------------------------- |
| `observedPopulation`         | 729 799 | observed | SSB Kommunefakta, folketall 1. kvartal 2026.       |
| `projectedPopulation2030`    | 753 641 | observed | SSB Kommunefakta, forventet befolkning i 2030.     |
| `personsPerHousehold`        | 1,95    | observed | SSB Kommunefakta, beboere per husholdning i 2025.  |
| `derivedHouseholds`          | 374 000 | derived  | 729 799 / 1,95, avrundet.                          |
| `annualHouseholdGrowthRate`  | 0,8 %   | derived  | Årlig vekst fra 729 799 i 2026 til 753 641 i 2030. |
| `detachedHouses`             | 28 349  | observed | SSB Kommunefakta, eneboliger i 2026.               |
| `apartmentBlockDwellings`    | 256 025 | observed | SSB Kommunefakta, boliger i boligblokk i 2026.     |
| `municipalDwellingsObserved` | 12 000  | rough    | Boligbygg skriver at de har nesten 12 000 boliger. |
| `policyRate`                 | 4,25 %  | observed | Norges Bank, publisert 18.06.2026.                 |

## Første modellstart

```ts
export const modelStart = {
  modelVersion: "0.1-example",
  startYear: 2027,
  endYear: 2040,
  geography: "whole-oslo",
  dataQuality: "rough",
};
```

## Starttilstand

Tallene under er avrundet for modellbruk. De skal ligge i en egen startdatafil
når modellkoden innføres, ikke hardkodes i simuleringsreglene.

```ts
export const initialState = {
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
    startedDwellings: 2_150,
    underConstruction: {
      2027: 1_764,
      2028: 2_150,
    },
    completionLagYears: 2,
  },
};
```

## Startparametre

Disse er modellparametre, ikke observerte fakta.

```ts
export const modelParameters = {
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
```

## Scenario-standarder

```ts
export const defaultScenarioInputs = {
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
```

## Viktige forbehold

- Eier/leier-fordelingen er en grov modellfordeling. SSB-tabell 11038 må hentes
  direkte før offentlig bruk.
- `lowIncomeRenters` er skjønnsmessig satt til 40 000. Dette må senere bygges på
  inntekts- og boforholdsdata.
- `regulatedBacklog` er en antakelse for å teste pipeline-logikken. Den må
  erstattes med en dokumentert reguleringsreserve.
- `underConstruction` fylles med samme pipeline-regel som historisk scenario:
  når tidligere igangsetting finnes, brukes den til forventet ferdigstillingsår;
  når den mangler, brukes et eksplisitt fallback-estimat. For 2027 betyr det at
  2025-igangsettingen brukes til 2027-ferdigstilling, mens 2028 foreløpig bruker
  fallback fordi 2026-årstallet ikke finnes i kilden ennå.
- `nonCommercial` er satt nær null fordi første modell skal vise hvordan feltet
  bygges opp gjennom scenarioet.
