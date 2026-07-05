# Oslo boligsimulator: milepælplan

Arbeidsplan for å gå fra Vite/React-skjelett til en første brukbar boligpolitisk
simulator. Produkt- og modellretningen ligger i
`docs/oslo-boligsimulator-design.md`; dette dokumentet beskriver rekkefølge,
avgrensning og ferdigkriterier.

Planen skal være levende, men bør ikke samle alle modellresonnementer. Når en
modellbeslutning endrer selve produkt- eller modellretningen, hører den hjemme i
designnotatet.

## Førende prinsipper

- Første versjon skal være pedagogisk og politisk lesbar før den forsøker å være
  en fullverdig prognosemodell.
- Simuleringslogikk skal ligge i `src/model/`, ikke i React-komponenter.
- Alle scenarioverdier skal være tidslinjer internt, selv når UI-et viser en
  enkel kontroll.
- Samme scenario og samme modellversjon skal gi samme output.
- Delbare URL-er skal representere scenario-input, ikke skjult
  applikasjonstilstand.
- Hele Oslo kan brukes som første modellgeografi, men typene bør ikke blokkere
  senere bydel, delbydel eller ny bydelsstruktur.
- Usikkerhet, grove antakelser og ikke-kalibrerte regler skal være synlige i UI.
- Backtest skal bygges inn før modellen brukes som argument for historisk treff.

## Milepæl 0: Avklar første modellgrense

Mål: lukke de viktigste valgene før modellkoden blir for bred.

- [x] Velg første kjørbare modellperiode:

  - 2027 til 2040 for framtidsscenario
  - 2015 holdes tilbake til historisk backtest

- [x] Velg første modellgeografi:

  - hele Oslo som én enhet
  - bydel, delbydel og grunnkrets holdes tilbake til senere dataløp

- [x] Bekreft første politiske spaker:

  - kommunale boligkjøp per år
  - kommunale boligsalg per år
  - ikke-kommersiell andel av nybygg

- [x] Bekreft første eksterne spaker:

  - rente
  - befolkningsvekst
  - byggekostnad

- [x] Bekreft at første framtidsmodell skal beregne ferdigstilte boliger gjennom
      en enkel privat utbyggingsrespons.
- [x] Skill grove startverdier ut i eget dokument: `docs/model-startverdier.md`.
- [x] Avklar startverdier for boligprisindeks, regulert backlog, igangsatte
      boliger og byggetidsforsinkelse.
- [x] Bekreft første husholdningsgrupper:

  - `lowIncomeRenters`
  - `otherRenters`
  - `ownerHouseholds`

- [x] Bekreft første disposisjonsformer for boligbestand:

  - `ownerOccupied`
  - `privateRental`
  - `municipal`
  - `nonCommercial`

- [x] Velg første outputsett for UI:

  - kommunal boligbestand
  - ikke-kommersiell boligbestand
  - modellert boligprisindeks
  - privat leiepress
  - igangsatte og ferdigstilte boliger
  - husholdninger med høy boutgiftsbelastning

- [x] Skriv ned hvilke tall som er grove startverdier, og hvilke som må komme
      fra kilder før modellen kan brukes offentlig.

Ferdig når: første modellgrense er konkret nok til at TypeScript-typer og
deterministiske enhetstester kan skrives uten å gjette på produktretning.

## Milepæl 1: Modelltyper og deterministisk simulering

Mål: etablere en ren modellkjerne uten UI-avhengigheter.

- [x] Opprett `src/model/`.
- [x] Definer grunnleggende typer for år, scenario, eksterne input, politiske
      input, modelltilstand og output.
- [x] Lag en starttilstand for hele Oslo med tydelig merkede eksempelverdier.
- [x] Implementer en enkel årlig simuleringsløkke.
- [x] La politiske input og eksterne input ekspanderes til komplett tidslinje.
- [x] Implementer en enkel modellert boligprisindeks som mellomvariabel.
- [x] Implementer regulert backlog, igangsatte boliger, boliger under bygging og
      ferdigstilte boliger som egen pipeline.
- [x] Implementer privat igangsetting som respons på boligprisindeks,
      byggekostnad, rente, ikke-kommersielt krav og regulert kapasitet.
- [x] Implementer første husholdningsgrupper som enkel modelltilstand:
      `lowIncomeRenters`, `otherRenters` og `ownerHouseholds`.
- [x] Implementer boligbestand etter disposisjonsform: `ownerOccupied`,
      `privateRental`, `municipal` og `nonCommercial`.
- [x] Implementer kommunale kjøp og salg som stock-flow-regler.
- [x] Implementer ikke-kommersiell andel av nybygg som egen beholdningsregel.
- [x] Implementer en første leiepressindikator.
- [x] Legg til enhetstester for:

  - stabil gjentakbarhet
  - høyere boligprisindeks øker privat igangsetting når andre forhold er like
  - høyere rente eller byggekostnad reduserer privat igangsetting
  - igangsatte boliger blir ferdigstilt etter valgt byggetidsforsinkelse
  - kommunale kjøp flytter boliger til kommunal bestand uten nødvendigvis å øke
    samlet boligbestand
  - kommunale kjøp øker kommunal boligbestand
  - kommunale salg reduserer kommunal boligbestand
  - ikke-kommersiell nybyggandel øker ikke-kommersiell beholdning
  - høyere etterspørsel eller lavere privat leietilbud øker leiepress

Ferdig når: `npm run test:run` dekker modellkjernen, og samme scenario gir samme
output uten React.

## Milepæl 2: Første scenario-UI

Mål: gjøre modellkjernen synlig og justerbar i appen.

- [x] Erstatt scaffold-visningen med et enkelt scenarioverksted.
- [x] Legg kontrollere for de første politiske spakene.
- [x] Legg kontrollere for de første eksterne spakene.
- [x] Vis valgt startår, sluttår og modellversjon.
- [x] Vis de første fire tidsseriene i samme graf:

  - total boligbestand
  - kommunal boligbestand
  - ikke-kommersiell boligbestand
  - modellert boligprisindeks
  - privat leiepress

- [x] Normaliser boligbestand i første graf slik at total boligbestand i første
      modellår = 100. Kommunal og ikke-kommersiell boligbestand vises mot samme
      starttotal, mens prisindeks og leiepress fortsatt indekseres mot egen
      startverdi.
- [x] Vis faktiske verdier i tabell under grafen.
- [x] Behandle normalisering til første år = 100 som en regel for første
      scenario-UI, ikke som en generell regel for alle framtidige
      visualiseringer.
- [x] Merk eksempeldata og grove antakelser tydelig i brukerflaten.
- [x] Legg til komponenttester for brukerobserverbar oppførsel:

  - endring i kjøp oppdaterer output
  - endring i salg oppdaterer output
  - endring i ikke-kommersiell andel oppdaterer output

Ferdig når: en bruker kan endre scenario i nettleseren og se at relevante
outputmål endrer seg på en forklarbar måte.

## Milepæl 3: Delbare scenarioer

Mål: gjøre enkle scenarioer stabile og delbare via URL.

- [x] Opprett `src/routing/`.
- [x] Definer korte URL-parametre for første enkle modus:

  - `kjop`: kommunale kjøp per år
  - `salg`: kommunale salg per år
  - `ikkekomm`: ikke-kommersiell andel av nybygg
  - `rente`: rente
  - `vekst`: befolkningsvekst
  - `kost`: byggekostnadsvekst

- [x] Hold standardverdier implisitte i URL-en, slik at bare brukerendrede
      scenarioavvik serialiseres.
- [x] Implementer parsing fra URL til scenario-input.
- [x] Implementer serialisering fra scenario-input til URL.
- [x] Bevar ukjente eller ugyldige verdier på en ryddig måte:

  - ugyldige tall faller tilbake til standardverdi
  - gamle eller manglende parametre gir et gyldig standardsenario

- [x] Legg til tester for URL-rundtur:

  - scenario til URL til scenario
  - manglende parametre
  - ugyldige parametre

Ferdig når: to brukere kan åpne samme URL og få samme scenario og samme
modelloutput, gitt samme modellversjon. Første korte URL-format er relativt til
gjeldende standardverdier og er ikke ment som en evig reproduserbar
modell-snapshot.

## Milepæl 4: Forklaringer og første grafvisning

Mål: gjøre output lesbart uten at brukeren må forstå modellkoden.

- [x] Legg korte forklaringer på hvert outputmål.
- [x] Skill tydelig mellom Oslo-kommunale grep, statlige grep og eksterne
      makroforutsetninger.
- [x] Vurder første grafbibliotek; ikke innfør det før behovet er tydeligere enn
      i første SVG-graf.
- [x] Vis minst én tidsserie for kommunal eller ikke-kommersiell boligbestand.
- [x] Vis minst én indikator for leiepress eller boutgiftsbelastning.
- [x] Legg inn tekstlig usikkerhetsmerking for eksempeldata og ukalibrerte
      regler.

Ferdig når: første prototype kan brukes i en samtale om hva et scenario gjør,
ikke bare som teknisk demonstrasjon.

## Milepæl 5: Datagrunnlag og første backtest

Mål: begynne overgangen fra eksempelmodell til kildebasert modell.

- [ ] Kartlegg første åpne datakilder for:

  - befolkning og husholdninger
  - boligbestand
  - kommunal boligbestand
  - boligbygging
  - rente
  - byggekostnad eller relevant kostnadsindeks

- [ ] Dokumenter tabellnummer, API-spørringer eller filkilder der data hentes.
- [ ] Skill modellinput fra evalueringsdata.
- [ ] Lag et historisk scenario for 2015 til siste tilgjengelige år.
- [ ] Velg et begrenset første kalibreringsmål.
- [ ] Vis historisk output mot observert serie for minst ett mål.

Ferdig når: repoet kan kjøre en enkel historisk sammenligning uten at modellen
mates med akkurat den serien den skal evalueres mot.

## Milepæl 6: Geografi og fordelingsspørsmål

Mål: forberede overgang fra hele Oslo til geografisk modellering.

- [ ] Avklar første interne geografinivå:

  - hele Oslo
  - bydel
  - delbydel
  - grunnkrets
  - annen stabil sone

- [ ] Kartlegg koblinger mellom gammel bydel, ny bydel og lavere geografi.
- [ ] Definer metadata for geografiversjon.
- [ ] Definer metadata for datakvalitet og fordelingsmetode.
- [ ] Bestem hvilke variabler som aldri bør fordeles ned med enkel
      folketallsnøkkel.
- [ ] Lag en første rapporteringsvisning som kan aggregere modelloutput.

Ferdig når: geografisk modellering kan innføres uten å hardkode dagens
bydelsstruktur som modellens egentlige nøkkel.

## Milepæl 7: Offentlig førsteversjon

Mål: gjøre en liten, ærlig og delbar versjon klar for ekstern testing.

- [ ] Fullfør enkel modus.
- [ ] Sørg for at alle synlige outputmål har forklaring.
- [ ] Sørg for at eksempeldata, usikre antakelser og modellversjon vises.
- [ ] Kjør `npm run check`.
- [ ] Kontroller at GitHub Pages-oppsettet fortsatt bruker
      `base: "/bolig-simulator/"`.
- [ ] Oppdater README med faktisk appstruktur, kommandoer og begrensninger.
- [ ] Publiser via eksisterende GitHub Pages-flyt.

Ferdig når: lenken kan deles med folk som ikke kjenner kodebasen, og de kan
forstå både hva simulatoren viser og hva den foreløpig ikke kan brukes til.

## Utsatt med vilje

Disse temaene er viktige, men bør ikke styre første modellkjerne:

- full agentbasert modell
- brukerkontoer eller serverlagret scenarioarkiv
- avansert komprimert scenarioformat
- Web Worker før simuleringen faktisk blir tung
- MapLibre-kart før geografimodellen og datagrunnlaget er avklart
- deck.gl eller tunge WebGL-lag
- finmasket husholdningsmodell med mange grupper
- presis boligprisprognose som hovedoutput
- full modellering av sekundærboliger og korttidsutleie

## Nærmeste anbefalte arbeid

Start med milepæl 0 og 1. Den viktigste første avklaringen er startverdier og
parametre for boligprisindeks, regulert backlog, igangsettingsrespons og
byggetidsforsinkelse. Framtidig ferdigstilling skal beregnes gjennom den enkle
private utbyggingsresponsen fra starten.
