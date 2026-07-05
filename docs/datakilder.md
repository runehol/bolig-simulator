# Datakilder for Oslo boligsimulator

Første dataløp skal bruke åpne kilder og håndholdte verdier i repoet. Vi skal
ikke bygge API-import ennå. Kildene skal likevel dokumenteres så tydelig at
verdier kan byttes ut eller hentes på nytt senere.

## Kildeprioritet

1. SSB der SSB har dekkende tabeller for Oslo kommune.
2. Oslo kommune der SSB ikke dekker variabelen godt nok.
3. Oslo kommune når modellen må ned på bydel, delbydel, grunnkrets eller
   adressebaserte data.

Kommunalt disponerte boliger brukes som praktisk proxy for kommunal boligbestand
i første modell. Dette er samme størrelse vi foreløpig mener er mest relevant
for kommunens faktiske boligpolitiske kapasitet.

## Dataformat

Første observerte serier ligger i `src/data/observed-oslo.ts`, ikke JSON. Det er
et bevisst skille:

- Scenario-URL-er skal kode brukerens scenario-input.
- Observerte baseline- og evalueringsdata skal følge modellversjonen i repoet.
- TypeScript gir typekontroll og gjør det vanskeligere å blande datafelter.

JSON kan innføres senere hvis vi får større datamengder, skal la ikke-tekniske
bidragsytere redigere data direkte, eller trenger å laste dataversjoner utenfor
app-bundlen.

## Første observerte serier

| Variabel                     | Kilde       | Tabell         | Periode   | Bruk               |
| ---------------------------- | ----------- | -------------- | --------- | ------------------ |
| Total boligbestand           | SSB         | 06265          | 2015-2026 | evaluering         |
| Igangsettingstillatelser     | SSB         | 05940          | 2013-2025 | modellinput/støtte |
| Fullførte boliger            | SSB         | 05940          | 2015-2025 | evaluering         |
| Kommunalt disponerte boliger | SSB         | 12008          | 2015-2025 | kalibrering        |
| Kommunalt eide boliger       | SSB         | 12008          | 2015-2025 | støtteserie        |
| Styringsrente                | Norges Bank | IR/B.KPRA.OL.R | 2015-2025 | modellinput        |

Første backtestvindu settes til 2015-2025 fordi fullførte boliger og kommunale
boliger foreløpig går til 2025. Total boligbestand har også 2026 og kan brukes
når de andre evalueringsseriene oppdateres.

## Kilder kartlagt, ikke tallfestet ennå

| Variabel                     | Første kildevalg | Kandidat                      | Kommentar                                                                     |
| ---------------------------- | ---------------- | ----------------------------- | ----------------------------------------------------------------------------- |
| Befolkning                   | SSB              | 01222                         | Kvartalsvis befolkning. Kan aggregeres til år.                                |
| Husholdninger etter eie/leie | SSB              | 11084                         | Husholdninger etter eierstatus. SSB ga midlertidig 502 ved første uthenting.  |
| Byggekostnad                 | SSB              | 08650                         | Byggekostnadsindeks for boliger. SSB ga midlertidig 502 ved første uthenting. |
| Boligpris                    | SSB              | Prisindeks for brukte boliger | Bør inn før privat utbyggingsrespons kalibreres hardere.                      |
| Delbydel/grunnkrets          | Oslo kommune     | åpne datasett / kartdata      | Brukes når vi går til geografisk modellering.                                 |

## Rentevalg

Modellen skal bruke styringsrenten, ikke boliglånsrente eller rentebane, i
første historiske scenario. Norges Banks API-serie `IR/B.KPRA.OL.R` er brukt som
kilde for dagsobservasjoner. I denne perioden er `OL` utlånsrenten over natten,
og styringsrenten er avledet som `OL - 1` prosentpoeng. Serien lagres i
`src/data/observed-oslo.ts` som årlige gjennomsnitt i desimalform, for eksempel
`0.045` for 4,5 prosent.

## Første backtestmål

Første backtest skal være smal:

- total boligbestand
- fullførte boliger

Dette er med vilje. Modellen skal først testes mot aggregater som ikke krever
finmasket fordeling eller mange ekstra antakelser. Igangsettingstillatelser og
kommunalt disponerte boliger brukes som støtteserier, men ikke som eneste mål
for om modellkjernen treffer.

## Første historiske scenario

Første historiske scenario ligger i `src/model/historical-scenario.ts` og bruker
observerte igangsettingstillatelser som eksogent input. Det betyr at backtesten
foreløpig tester ferdigstillingspipeline og boligbestand, ikke om modellen
klarer å forklare privat igangsetting fra pris, rente og kostnad.

Dette er et bevisst første steg. Når pipeline og beholdningsregnskap er rimelig,
kan vi senere slå av `startedDwellingsOverride` og la utbyggerresponsen forsøke
å forklare historiske igangsettinger.

Initial byggepipeline bygges med samme regel i historisk og framtidig scenario:
for hvert forventet ferdigstillingsår ved modellstart brukes igangsettingen
`completionLagYears` år tidligere. Hvis den observerte igangsettingen mangler,
brukes et eksplisitt fallback-estimat. For 2015-backtesten betyr det at
igangsettinger fra 2013 og 2014 fyller ferdigstillingene i 2015 og 2016. For
2027-starten brukes observert 2025-igangsetting til 2027-ferdigstilling, mens
2028 foreløpig bruker fallback fordi 2026-årstallet ikke finnes i kilden ennå.

## Åpne datavalg

- Skal historisk husholdningsvekst mates fra faktisk befolkning/husholdninger,
  eller skal første backtest bruke en glattet vekstrate?
