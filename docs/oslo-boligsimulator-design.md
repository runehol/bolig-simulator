# Oslo boligsimulator: designdokument

Arbeidsdokument for en interaktiv what-if-simulator for boligmarked og
boligpolitikk i Oslo. Formålet er ikke primært å spå boligpris i et bestemt år,
men å gjøre det mulig å teste politiske grep, vise mekanismer og sammenligne
fordelingsvirkninger over tid.

## Formål

Simulatoren skal gjøre det mulig å spørre:

- Hva skjer hvis Oslo kommune kjøper flere boliger hvert år?
- Hva skjer hvis en større andel av nybygg går til ikke-kommersielle boliger?
- Hva skjer hvis renten, byggekostnadene eller befolkningsveksten endrer seg?
- Hva ville skjedd hvis et grep hadde blitt innført fra 2015?
- Hvilke grupper får lavere boutgiftsbelastning, tryggere bolig eller kortere
  vei inn i stabile boforhold?
- Hvilke bydeler får effekten, og hvilke blir stående igjen med presset?

Simulatoren skal være pedagogisk og politisk lesbar. Den skal vise hvilke
antakelser som driver resultatene, og gjøre det mulig å dele scenarioer med
andre gjennom URL-er.

## Målgruppe

Primære brukere:

- politisk interesserte uten teknisk bakgrunn
- folkevalgte og programkomitemedlemmer
- aktivister og organisasjonsledd
- journalister eller andre som vil forstå virkningen av ulike boligpolitiske
  grep

Sekundære brukere:

- personer som vil kontrollere modellantakelser
- folk som vil bidra med data, kode eller modellkritikk

Dette betyr at grensesnittet må prioritere forklaring, scenarioer og
sammenligning, ikke teknisk modellterminologi.

## Førende produktvalg

### Delbare scenarioer

Et scenario skal kunne deles som en vanlig lenke. En bruker skal kunne stille
inn politiske grep, kopiere URL-en og sende den til noen andre, som da får samme
scenario.

Eksempel på enkel URL:

```text
/scenario?start=2027&kjop=500&ikkekomm=25&rente=4.5
```

Eksempel på historisk what-if:

```text
/scenario?start=2015&baseline=historisk&kjop=500&ikkekomm=20
```

Eksempel på avansert scenario, der mange årsspesifikke verdier komprimeres i
URL:

```text
/scenario?s=komprimert-scenario-json
```

Første versjon bør støtte korte, lesbare URL-parametre. Senere kan full
scenario-serialisering legges til for avanserte tidslinjer.

### To brukermoduser

Enkel modus:

- felles startår
- politiske grep gjelder likt hvert år fra start
- få, tydelige kontrollere
- hovedgrafer og fordelingsmål

Avansert modus:

- politiske grep kan fases inn år for år
- historiske inputdata kan overstyres
- scenario kan lagres som komprimert URL
- tydeligere kalibrering og sensitivitetsanalyse

Første offentlige versjon bør være enkel modus, men datamodellen bør støtte
avansert modus fra starten.

### Spillmekanikk uten vinnertilstand

Simulatoren kan gjerne hente mekanikker fra serious games og policy
sandbox-verktøy, men bør ikke presenteres som et spill der brukeren "vinner"
boligkrisen. Boligkrisen er et politisk og sosialt problem med målkonflikter,
treghet og fordelingsvirkninger. Produktet bør derfor bruke spill-lignende
interaksjon for å gjøre systemdynamikken forståelig, ikke for å late som
problemet har en enkel optimal løsning.

Aktuelle mekanikker:

- runder eller år, der hvert år gir nye effekter på bygging, flytting,
  boligbehov, kommunal økonomi og leiepress
- begrensede ressurser som budsjett, tomter, administrativ kapasitet og politisk
  handlingsrom
- målkonflikter mellom rask boligbygging, kommunal risiko, geografisk fordeling,
  arealbruk, klima og sosial treffsikkerhet
- hendelser eller eksterne sjokk som renteøkning, byggekostnadshopp,
  Husbanken-kutt eller svakere privat igangsetting
- scenariohistorikk som viser hvilke valg som skapte hvilke resultater
- sammenligning mellom brukerens scenario, historisk utvikling og nullalternativ
- delbare scenarioer uten brukerkonto

Produktet bør ha indikatorer, ikke en enkel vinnertilstand. Relevante
indikatorer kan være:

- husholdninger i utrygg privat leie
- husholdninger med høy boutgiftsbelastning
- udekket kommunalt boligbehov
- ikke-kommersiell boligbestand
- privat igangsetting og ferdigstilling
- geografisk konsentrasjon av kommunale og ikke-kommersielle boliger
- kommunal kapitalbinding og årlig budsjettbelastning

Språk og visuell retning bør derfor ligge nær "boligpolitisk verksted" eller
"scenarioverksted", ikke "redd byen"-spill. Det kan være engasjerende og
utforskende, men må bevare faglig alvor og vise usikkerhet tydelig.

## Teknologivalg

### Anbefalt stack

- TypeScript for simuleringsmotor og datamodell
- React for brukergrensesnitt
- Vite for lokal utvikling og statisk bygg
- GitHub Pages for første deploy
- GitHub Actions for automatisk bygg og publisering
- JSON eller CSV for baseline-data og scenarioforutsetninger
- Web Worker hvis simuleringen etter hvert blir tung nok til å påvirke
  brukergrensesnittet

### Begrunnelse

Dette bør være en statisk webapp i første versjon. All modellkjøring skjer i
nettleseren. Det gir:

- enkel deploy
- ingen serverdrift
- ingen brukerkontoer
- enkel deling
- lav sikkerhetsrisiko
- full reproduserbarhet så lenge data og modellversjon er kjent

GitHub Pages passer fordi appen kan bygges til statiske filer. Hvis prosjektet
senere trenger innlogging, database, scenarioarkiv, serverberegning eller
API-nøkler, kan det vurderes å flytte til Vercel, Netlify, Cloudflare Pages
eller en enkel backend.

### Visualisering og bibliotekvalg

Simulatoren bør ha både grafvisning og geografisk visning, men de skal ikke
gjøre samme jobb.

Grafvisning bør være hovedvisningen for utvikling over tid:

- boligprisindeks eller kvadratmeterpris over tid
- boligbestand over tid
- kommunal og ikke-kommersiell boligbestand
- privat igangsetting og ferdigstilling
- leiepress
- boutgiftsbelastning
- forskjell mellom scenario og nullalternativ

Geografisk visning bør brukes når romlig fordeling er selve poenget:

- huspris per bydel eller delbydel
- kommunale boliger som andel av boligbestand
- ikke-kommersiell boligandel
- leiepress eller boutgiftsbelastning etter område
- regulert kapasitet og større utbyggingsområder
- forskjell mellom gammel og ny bydelsstruktur

Kart bør ikke erstatte grafer. For eksempel er "boligbestand over tid" ofte best
som linje, stablet areal eller små multiples. Kart er best for å vise hvor
presset, investeringene eller boligtypene ligger.

Anbefalt førstevalg:

- Apache ECharts for vanlige grafer, fordi det dekker mange diagramtyper, har
  Canvas/SVG-rendering, datasett/transformasjoner og innebygd støtte for
  responsivitet og tilgjengelighetsfunksjoner.
- MapLibre GL JS for geografisk visning, fordi det kan vise GeoJSON-polygonger,
  vektorlag, popups, tidslider og interaktive kart uten Mapbox-lisensbinding.
- deck.gl som senere tillegg hvis vi får store punkt-/polygonmengder, tunge lag,
  mange scenarioer eller behov for mer avansert WebGL-basert kartvisualisering.

Mulige alternativer:

- Recharts hvis vi vil ha veldig enkle React-grafer raskt, men det kan bli
  trangt for avansert interaksjon.
- visx hvis vi vil ha maksimal designkontroll, men da må vi bygge mer selv.
- Vega-Lite hvis vi vil ha deklarative, forskningsnære grafspesifikasjoner som
  ligner mer på grammar-of-graphics-tenkning, men det kan bli tyngre å tilpasse
  til et polert app-UI.

Første prototype bør derfor bruke:

```text
Apache ECharts + MapLibre GL JS
```

og bare legge til deck.gl hvis MapLibre alene blir for begrensende.

Viktig designregel:

- bruk både absolutte tall og rater der det trengs
- merk usikre/imputerte geografiske tall tydelig
- ikke bruk koropletkart for absolutte mengder uten normalisering, fordi store
  eller folkerike områder da lett ser viktigere ut enn de er
- la brukeren klikke på et område i kartet og få samme område markert i grafene
- la brukeren velge variabel, år og geografi i samme kontrollflate

### Foreslått kodestruktur

```text
src/
  model/
    types.ts
    initial-state.ts
    flows.ts
    policies.ts
    simulate.ts
    calibration.ts
  data/
    historical/
    baseline/
    metadata/
  ui/
    controls/
    charts/
    maps/
    scenario/
    layout/
  routing/
    scenario-url.ts
  workers/
    simulation-worker.ts
```

Simuleringslogikken skal ikke ligge inne i React-komponenter. UI-et skal bare
lese scenario, sende det til modellen og vise resultatene.

## Modellvalg

### Modelltype

Første modell bør være en bydelbasert stock-flow-modell.

Den modellerer beholdninger og strømmer, ikke enkelthus og enkelthusholdninger.
Beholdninger kan for eksempel være:

- lavinntektshusholdninger i privat leie i Gamle Oslo
- barnefamilier i kommunal bolig i Stovner
- boliger i privat utleie i Nordre Aker
- ikke-kommersielle boliger i Grunerlokka
- regulerte, men ikke ferdigstilte boliger i bydel

Strømmer kan for eksempel være:

- husholdninger flytter fra privat leie til eie
- husholdninger flytter fra privat leie til kommunal bolig
- husholdninger presses ut av Oslo
- kommunen kjøper boliger
- kommunen selger boliger
- boliger flyttes fra eie til privat utleie
- nybygg fordeles mellom eie, privat leie, kommunal og ikke-kommersiell sektor
- regulerte prosjekter ferdigstilles etter forsinkelse

### Hvorfor ikke agentbasert modell først?

En agentbasert modell kan være mer realistisk for enkelte mekanismer, men den
krever langt mer data og er vanskeligere å forklare. For politisk what-if er det
viktigere at modellen er lesbar, delbar og mulig å kritisere.

En stock-flow-modell gir bedre førsteversjon fordi:

- mekanismene kan forklares
- scenarioer kan kjøres raskt i nettleseren
- datakravene er lavere
- usikkerhet og antakelser blir synlige
- modellen kan backtestes mot historiske aggregater

Senere kan enkelte delprosesser få agentlignende logikk, for eksempel
husholdningers flyttevalg eller utbyggeres beslutning om å starte prosjekt.

## Grunnenheter

### Tid

Standard tidssteg bør være år i første versjon.

Årlige steg passer fordi mange relevante data finnes årlig, og fordi politiske
vedtak, budsjetter og boligbygging ofte diskuteres i årsrytme. Kvartal kan
vurderes senere for rente, pris og leie, men øker kompleksiteten mye.

Foreslåtte standardperioder:

- historisk kalibrering: 2015 til siste tilgjengelige år
- framtidsscenario: siste tilgjengelige år til 2040
- politisk what-if over historien: 2015 til siste tilgjengelige år

### Geografi

Modellen bør ikke bruke dagens bydel som hardkodet primærnøkkel dersom
bydelsgrensene er i endring. Bydel er politisk lesbart, men administrativt
ustabilt. Hvis Oslo går fra dagens 15 bydeler til en ny struktur, vil historiske
tidsserier på gammel bydel bli vanskelige å sammenligne direkte med nye bydeler.

Anbefalt prinsipp:

```text
stabil minste geografi
  -> aggregeres til gammel bydel
  -> aggregeres til ny bydel
  -> aggregeres til hele Oslo
```

Ideelt bør modellens interne geografiske enhet være delbydel, grunnkrets eller
en annen relativt stabil sone. Bydel bør være en rapporteringsvisning, ikke
modellens egentlige datanøkkel.

Dette gir flere fordeler:

- historiske data kan vises etter gammel bydel
- framtidige scenarioer kan vises etter ny bydel
- modellen kan sammenligne gammel og ny bydelsstruktur
- effekter av boligpolitikk kan vises mer presist geografisk
- data blir mindre sårbar for administrative reformer

Bydel kan likevel brukes i første prototype hvis datagrunnlaget på mindre
geografi er for svakt. I så fall må modellen ha en eksplisitt geografiversjon,
for eksempel `bydel-2004` og `bydel-2028`, og dokumentere at historiske og
framtidige bydelsserier ikke er direkte sammenlignbare uten omkoding.

Mulig senere nivå:

- delbydel eller grunnkrets for mer presis segregasjonsanalyse
- kollektivsoner eller planområder for byutviklingsspørsmål

Åpent dataspørsmål:

- Finnes relevante bolig-, husholdnings- og inntektsdata på delbydel eller
  grunnkrets?
- Finnes kommunal boligbestand på delbydel, grunnkrets eller adresse som kan
  aggregeres forsvarlig?
- Hvis kommunale boliger bare finnes på bydel eller adresse, hvordan kan data
  brukes uten å publisere sensitiv geografisk informasjon?
- Hvilken geografi bruker SSB, Oslo kommune og Boligbygg for de viktigste
  seriene?
- Kan vi lage en stabil "crosswalk" mellom delbydel, gammel bydel og ny bydel?

### Husholdningsgrupper

Første versjon bør ha få, men politisk relevante grupper:

- lavinntekt enslige
- lavinntekt barnefamilier
- unge førstegangsetablerere
- studenter og midlertidige husholdninger
- vanlige leietakerhusholdninger
- eierhusholdninger med lav eller moderat inntekt
- høyinntekt eierhusholdninger

Dette må senere kalibreres mot tilgjengelige data. Det viktigste er å skille
grupper som har ulik betalingsevne, boligbehov og sårbarhet.

### Boligtyper og disposisjonsform

Minimumsinndeling:

- eie
- privat leie
- kommunal bolig
- ikke-kommersiell leie
- studentbolig eller annen særskilt boligform, hvis datagrunnlaget tillater det

Mulig inndeling etter størrelse:

- 1-roms
- 2-roms
- 3-roms
- 4-roms eller større

Størrelse bør inn tidlig dersom simulatoren skal si noe meningsfullt om
barnefamilier, trangboddhet og geografisk fordeling.

## Scenario og datastruktur

Alle drivere bør representeres som tidsserier internt, også når
brukergrensesnittet bare viser én slider.

```ts
type Year = number;

type PolicyInputs = {
  municipalPurchases: number;
  municipalSales: number;
  nonCommercialShareOfNewBuild: number;
  municipalShareOfNewBuild: number;
  startLoanLevel: number;
  housingAllowanceLevel: number;
  secondaryHomeTaxPressure: number;
  rentRegulationStrength: number;
};

type Scenario = {
  modelVersion: string;
  startYear: Year;
  endYear: Year;
  geographyVersion: "grunnkrets" | "delbydel" | "bydel-2004" | "bydel-2028";
  reportingGeography: "whole-oslo" | "bydel-2004" | "bydel-2028" | "delbydel";
  baseline: "historical" | "current" | "custom";
  exogenous: Record<Year, ExogenousInputs>;
  policies: Record<Year, PolicyInputs>;
};
```

Brukergrensesnittet kan starte med enkle kontrollere, men modellen bør alltid få
en komplett tidslinje.

Geografikoblinger bør ligge i egne metadatafiler, ikke inne i modellreglene:

```text
data/metadata/geography/
  delbydel-to-bydel-2004.json
  delbydel-to-bydel-2028.json
  grunnkrets-to-delbydel.json
```

Hvis data bare finnes på bydel, må den merkes med hvilken bydelsstruktur den
gjelder. Den bør ikke uten videre fordeles ned på delbydel uten en eksplisitt
fordelingsregel og usikkerhetsmerking.

### Fordeling fra bydel til delbydel

Hvis viktige data bare finnes på bydelsnivå, kan modellen i noen tilfeller
fordele bydelsverdier ned til delbydel med en fordelingsnøkkel. Dette bør
behandles som imputert data, ikke observert data.

En enkel første regel kan være folketallsbasert fordeling:

```text
estimert verdi i delbydel =
  verdi i bydel
  * befolkning i delbydel
  / befolkning i bydel
```

Dette kan være akseptabelt for grove størrelser som:

- husholdninger
- enkelte etterspørselsmål
- noen inntekts- eller befolkningsnære indikatorer
- aggregerte behovsmål der ingen bedre lokal fordeling finnes

Men folketallsfordeling kan være misvisende for størrelser som er sterkt
geografisk konsentrert:

- kommunale boliger
- studentboliger
- store regulerings- eller utbyggingsprosjekter
- tomtereserver
- institusjonsboliger
- sekundærboliger
- boliger etter størrelse og bygningstype

For slike data bør modellen enten bruke en bedre fordelingsnøkkel eller beholde
data på bydel med usikkerhetsflagg.

Mulige fordelingsnøkler:

- befolkning
- husholdninger
- boligbestand
- boligbestand etter størrelse eller bygningstype
- leietakerandel
- lavinntektshusholdninger
- areal eller regulert boligpotensial
- faktisk adresse-/punktdata aggregert opp til delbydel, hvis det er lovlig og
  forsvarlig

Hver imputert variabel bør ha metadata:

```ts
type GeographyAllocationMethod =
  | "observed"
  | "population-share"
  | "household-share"
  | "dwelling-share"
  | "renter-share"
  | "low-income-share"
  | "area-share"
  | "custom-crosswalk";

type DataQuality = "observed" | "estimated" | "rough" | "not-comparable";
```

UI-et bør kunne vise dette enkelt, for eksempel: "Fordelt fra bydel etter
folketall. Usikkert på delbydelsnivå."

## Eksogene variabler

Eksogene variabler er forhold modellen får servert, i stedet for å beregne selv.

Første sett:

- styringsrente eller relevant lånerente
- inntektsvekst
- inflasjon
- arbeidsledighet
- befolkningsvekst
- husholdningsvekst
- byggekostnader
- tomtetilgang og regulert/byggeklar boligpipeline
- historisk ferdigstilte boliger
- statlige rammer for Husbanken, startlån og bostøtte der det er relevant

For historisk backtest bør faktiske historiske verdier brukes. For
framtidsscenarioer bør brukeren kunne velge antakelser eller bruke
standardbaner.

## Politiske kontrollere

Første versjon bør ikke ha for mange spaker. Den bør prioritere grep som er
politisk forståelige og modellmessig virksomme.

Kommunale grep:

- kommunale boligkjøp per år
- kommunale boligsalg per år
- andel nybygg som blir kommunale boliger
- andel nybygg som blir ikke-kommersielle boliger
- kommunal tomtepolitikk: salg, feste, kommunalt eie
- krav eller mål for boligstørrelser i nye prosjekter
- startlån-nivå
- bostøtte eller lokal støtteordning, dersom modellert

Statlige eller eksterne grep:

- rente
- utlånsstramhet
- skattepress på sekundærbolig
- byggekostnad
- befolkningsvekst
- inntektsvekst

Det bør skilles tydelig i UI mellom grep Oslo kommune kan gjøre selv, grep som
krever statlig politikk, og eksterne makroforhold.

## Første sentrale flyter

### Privat utbyggingsrespons

Privat utbyggingsrespons må være en sentral del av modellen, ikke bare en senere
forbedring. Et av de viktigste politiske spørsmålene er hvor mye nybygging som
faktisk utløses eller bremses av pris, rente, byggekostnader, tomtetilgang og
kommunal reguleringspolitikk.

Modellen bør derfor skille mellom:

- mulig utbyggingsvolum gitt areal og tomter
- regulerte, men ikke igangsatte boliger
- igangsatte boliger under bygging
- ferdigstilte boliger som går inn i boligbestanden

Mulig pipeline:

```text
tomte- og arealpotensial
  -> regulerte boliger
  -> igangsatte boliger
  -> ferdigstilte boliger
  -> boligbestand
```

Privat utbyggers beslutning om å starte prosjekt bør avhenge av forventet
lønnsomhet og risiko.

Mulig enkel regel:

```text
forventet prosjektmargin =
  forventet salgspris eller kapitalisert leieverdi
  - tomtekostnad
  - byggekostnad
  - finansieringskostnad
  - rekkefølgekrav og andre prosjektkostnader
```

Hvis forventet prosjektmargin er høy nok, øker igangsettingen. Hvis marginen
faller under terskel, utsettes eller stoppes prosjekter.

Viktige drivere:

- boligpris og forventet prisvekst
- leienivå og forventet leievekst
- rente og finansieringskostnad
- byggekostnad
- tomtepris
- tilgjengelige og regulerte tomter
- kommunal reguleringstakt
- rekkefølgekrav og andre planpålagte kostnader
- krav om kommunal eller ikke-kommersiell andel
- risiko for usolgte boliger

Politisk påvirkning:

- mer regulert areal kan øke mulig bygging, men bare hvis prosjektene er
  lønnsomme
- kommunal tomtepolitikk kan påvirke tomtekostnad og hvem som får bygge
- krav om ikke-kommersiell andel kan redusere privat margin hvis det ikke
  finansieres, men kan også gi mer stabile prosjekter hvis kommunen eller en
  ikke-kommersiell aktør tar risiko
- høy rente kan bremse privat igangsetting selv om boligbehovet er høyt
- lavere salgsprisvekst kan redusere spekulativ utbyggingsvilje

Åpent modellspørsmål:

- Skal første prototype modellere privat utbyggingsrespons med en enkel
  marginregel, eller starte med historisk ferdigstilling som input?
- Hvordan skal reguleringsreserve og faktisk tomtetilgang estimeres per bydel?
- Hvordan skal kommunale krav til ikke-kommersiell andel påvirke privat
  prosjektmargin?
- Skal modellen ha en egen forsinkelse fra regulering til igangsetting og fra
  igangsetting til ferdigstilling?

Anbefaling:

Første prototype kan fortsatt bruke historisk ferdigstilling som input i
backtest, men framtidsscenarioer bør ha en enkel privat utbyggingsrespons fra
starten. Ellers blir modellen for svak på et av de viktigste politiske
spørsmålene: om kommunale og statlige grep faktisk øker, flytter, bremser eller
endrer sammensetningen av nybygging.

### Nybygg til boligbestand

Når boliger er ferdigstilt, må de fordeles på disposisjonsform og
husholdningsgrupper. Dette er en egen flyt etter utbyggingsresponsen.

Mulig regel:

```text
ferdigstilte boliger
  -> eie
  -> privat leie
  -> kommunal bolig
  -> ikke-kommersiell leie
```

Politisk påvirkning:

- krav om ikke-kommersiell andel øker ikke-kommersiell beholdning
- kommunalt kjøp i nybygg øker kommunal beholdning
- høyere byggekostnad kan redusere framtidig ferdigstillelse
- lavere forventet salgspris kan utsette prosjekter

Åpent modellspørsmål:

- Skal andelen som går til privat utleie beregnes fra investoravkastning, eller
  settes som scenarioantakelse?
- Skal kommunal og ikke-kommersiell andel tas fra ferdigstilte boliger før
  resten fordeles til eie og privat leie?
- Hvordan skal boligstørrelse påvirke hvilke husholdninger som faktisk får nytte
  av nybyggingen?

Anbefaling:

I historisk backtest kan ferdigstillelse brukes som observert input for å
isolere andre modellregler. I framtidsscenarioer bør ferdigstillelse komme fra
pipeline- og utbyggingsresponsmodulen.

### Privat leie til eie

Noen husholdninger går fra privat leie til eie når betalingsevne og lånetilgang
gjør det mulig.

Viktige drivere:

- inntekt
- rente
- boligpris
- egenkapital
- utlånsregler
- startlån
- prisnivå i bydel

Politisk påvirkning:

- startlån kan flytte noen husholdninger fra leie til eie
- høyere rente reduserer overgang
- høyere priser reduserer overgang
- økt ikke-kommersiell leie kan gjøre eie mindre nødvendig for stabilitet

Åpent modellspørsmål:

- Skal modellen skille mellom ønsket overgang til eie og presset overgang ut av
  Oslo?

### Privat leie til kommunal eller ikke-kommersiell bolig

Dette er en av de viktigste politiske flytene.

Viktige drivere:

- kommunal boligtilgang
- tildelingskriterier
- ikke-kommersiell boligtilgang
- leiepress
- husholdningstype
- inntekt
- bydel

Politisk påvirkning:

- kommunale boligkjøp øker kapasiteten
- kommunale salg reduserer kapasiteten
- ikke-kommersiell nybygging øker alternativet til privat leie
- strengere eller bredere tildelingskriterier endrer hvem som får plass

Åpent modellspørsmål:

- Skal kommunal bolig kun være for de mest vanskeligstilte, mens
  ikke-kommersiell leie også tar moderat lavinntekt?
- Eller skal modellen la brukeren velge tildelingsprofil?

### Privat leie til utflytting eller trangboddhet

Når leiepresset øker, må modellen kunne vise negative fordelingsvirkninger.

Mulige utfall:

- husholdningen blir boende med høyere boutgiftsbelastning
- husholdningen flytter til billigere bydel
- husholdningen flytter ut av Oslo
- husholdningen blir trangbodd
- husholdningen får kommunal eller ikke-kommersiell bolig hvis kapasitet finnes

Dette er vanskelig å kalibrere, men politisk viktig. Første versjon kan bruke en
enkel pressindeks som styrer fordeling mellom disse utfallene.

### Kommunale kjøp og salg

Kommunale kjøp bør modelleres som direkte økning i kommunal boligbestand, med
bydel og boligstørrelse.

Viktige drivere:

- årlige kjøp
- gjennomsnittlig kjøpspris
- hvilke bydeler kommunen kjøper i
- hvilke boligstørrelser som kjøpes
- vedlikeholds- og finansieringskostnad
- eventuell erstatning for salg

Politisk påvirkning:

- kjøpsvolum
- geografisk prioritering
- krav om familieboliger
- forbud mot nettosalg
- finansieringsmodell

Må skilles fra:

- kjøp som bare erstatter solgte boliger
- netto økning i kommunal boligbestand
- midlertidig framskaffelse gjennom innleie

### Sekundærboliger og privat utleietilbud

Sekundærboliger påvirker både eie- og leiemarkedet. Tiltak mot sekundærboliger
kan redusere spekulativ etterspørsel, men også redusere privat leietilbud hvis
boliger selges til eiere.

Mulige strømmer:

- eierbolig blir privat utleie
- privat utleie blir solgt til eier
- sekundærbolig blir stående tom eller brukt til korttidsutleie

Politisk påvirkning:

- skatt på sekundærbolig
- regulering av korttidsutleie
- rente
- forventet prisvekst
- leienivå

Modellen bør ikke automatisk anta at færre sekundærboliger alltid reduserer
boligproblemet. Effekten avhenger av om boligen går til eierhusholdning,
langstidsleie, korttidsleie eller står tom.

## Outputmål

Simulatoren bør prioritere fordelingsmål framfor bare pris.

Første outputsett:

- husholdninger i privat leie med høy boutgiftsbelastning
- lavinntektshusholdninger med stabil bolig
- husholdninger på kommunal venteliste eller i udekket behov
- kommunal boligbestand
- ikke-kommersiell boligbestand
- privat leiepress
- modellert gjennomsnittlig leie
- modellert boligprisindeks
- utflyttingspress for lavinntektshusholdninger
- geografisk fordeling av kommunale og ikke-kommersielle boliger
- kommunal kapitalbinding og årlig kostnad

Hvert outputmål bør ha en kort forklaring i UI: hva det betyr, hvordan det
beregnes, og hvor usikkert det er.

## Historisk backtest

Backtest er nødvendig for å gjøre modellen troverdig.

Første backtest bør starte i 2015 og gå til siste tilgjengelige år.

I historisk modus bør modellen bruke faktiske historiske input der det finnes:

- rente
- inflasjon
- inntektsvekst
- befolkning og husholdninger
- boligbygging
- kommunal boligbestand
- observerte boligpriser
- observerte leier, hvis datakvalitet er god nok

Det må skilles mellom:

- input modellen får vite
- output modellen skal forsøke å treffe
- observerte verdier som brukes til evaluering

Hvis modellen mates med alt, tester den ingenting. Hvis den mates med for lite,
blir den for løs. Første kalibreringsmål bør derfor være begrenset.

Foreslåtte første kalibreringsmål:

- boligbestand etter bydel og disposisjonsform, hvis data finnes
- kommunal boligbestand
- boligprisindeks
- leieindikator
- befolknings- og husholdningsfordeling

Historisk what-if bør være egen modus:

```text
Faktisk 2015-2025
vs
Hva hvis Oslo hadde kjøpt 500 flere kommunale boliger per år fra 2015?
```

Dette er politisk mer interessant enn en ren framtidsprognose.

## Første modellregler som må spesifiseres

Dette er kjernen vi må gå mer detaljert inn i senere.

### Leiepress

Mulig enkel regel:

```text
leiepress = etterspørsel etter privat leie / tilgjengelige private leieboliger
```

Leiepress bør påvirke:

- leienivå
- boutgiftsbelastning
- utflytting
- trangboddhet
- overgang til kommunal eller ikke-kommersiell bolig, hvis kapasitet finnes

Åpent:

- Hvor elastisk skal leie være mot press?
- Skal elastisiteten variere mellom bydeler?
- Skal lavinntektshusholdninger presses ut raskere enn andre?

### Boligpris

Boligpris bør i første omgang være en grov indeks, ikke hovedoutput.

Mulige drivere:

- rente
- inntekt
- tilbud av eierboliger
- forventninger
- befolkningsvekst
- utlånsstramhet

Åpent:

- Hvor mye trenger modellen å treffe boligpris for å være nyttig politisk?
- Bør boligpris primært brukes som mellomvariabel for kjøpekraft og kommunale
  kjøpskostnader?

### Kommunal boligkø eller udekket behov

Dette er viktigere enn formell venteliste alene, fordi behov kan være skjult.

Mulig regel:

```text
udekket behov neste år =
  udekket behov i år
  + nye husholdninger med alvorlig boligproblem
  - tildelinger til kommunal bolig
  - overganger til andre stabile løsninger
```

Åpent:

- Skal modellen bruke formell venteliste, estimert behov eller begge?
- Hvordan skal midlertidige botilbud og bostedsløshet håndteres?

### Ikke-kommersiell bolig

Ikke-kommersiell bolig bør ikke behandles som bare "billig kommunal bolig". Den
kan ha annen målgruppe, annen finansiering og annen innlåsing.

Modellen må skille mellom:

- kommunal bolig for vanskeligstilte
- ikke-kommersiell leie for bredere grupper
- kooperative eller tredje boligsektor-lignende modeller
- kostnadsleie, gjengs leie eller annen leiemodell

Åpent:

- Skal ikke-kommersiell bolig tildeles etter inntekt, botid, kø, loddtrekning
  eller behov?
- Skal boligen være permanent ikke-kommersiell, eller kan den privatiseres
  senere?

## Datakilder som må kartlegges

Foreløpig kildekategori:

- Oslo kommune: kommunale boliger, Boligbygg, boligbehov, plan, regulering,
  årsrapporter og budsjett
- Oslo kommune: bydelsreform, delbydeler, grunnkretser og koblingsnøkler mellom
  gammel og ny bydelsstruktur
- SSB: befolkning, husholdninger, boligbestand, boligpriser, leie, inntekt og
  boforhold
- Husbanken: startlån, bostøtte og relevante kommune-/fylkestall
- Norges Bank: rentehistorikk
- Eiendom Norge eller andre boligprisindekser, hvis åpne nok til bruk
- Leieboerforeningen, NOU-er og offentlige utredninger for mekanismer og
  leiemarked

Kildebruk må være reproduserbar. For SSB-data bør tabellnummer og API-spørring
dokumenteres i scripts eller metadata.

## Gjennomførbarhet og politisk avgrensing

Simulatoren må skille mellom:

- grep Oslo kommune kan gjøre alene
- grep som krever budsjettflertall
- grep som krever nasjonal lovendring
- grep som krever statlig finansiering eller Husbanken-endringer
- makroforhold som ikke er politiske kontroller for Oslo

Dette bør vises i UI, slik at brukeren ikke får inntrykk av at Oslo kommune kan
styre alt direkte.

## Åpne spørsmål

- Hvilke tre politiske grep skal være med i aller første prototype?
- Skal første prototype bruke hele Oslo som én enhet før bydel legges til?
- Hvilke outputmål er viktigst politisk: boutgiftsbelastning, stabil bolig,
  kommunal boligkø, leiepress eller geografisk fordeling?
- Skal modellen først være forklarende/pedagogisk, eller forsøke kalibrert
  historisk treff fra starten?
- Hvor detaljert skal ikke-kommersiell boligmodell være i første versjon?
- Hvilke deler av modellen skal være "Oslo kan gjøre dette", og hvilke skal være
  "ekstern forutsetning"?
- Hvor enkel kan privat utbyggingsrespons være før den blir politisk misvisende?
- Skal tomtetilgang modelleres som fysisk areal, regulerte boliger, kommunal
  tomtebank eller en samlet kapasitetsindeks?
- Bør intern modellgeografi være delbydel, grunnkrets eller en egen stabil
  soneinndeling?
- Hvilke datasett finnes på lavere nivå enn bydel, og hvilke finnes bare på
  gammel eller ny bydel?
- Kan kommunal boligbestand brukes geografisk uten å publisere sensitiv eller
  for detaljert informasjon?
- Hvilke variabler kan trygt fordeles etter folketall, og hvilke trenger
  boligbestand, leietakerandel, lavinntektsandel eller egne nøkler?
- Hvor synlig skal usikkerhetsmerking for imputerte delbydelstall være i
  brukergrensesnittet?

## Anbefalt første beslutning

Første tekniske prototype bør være:

- statisk Vite/React/TypeScript-app
- deploy til GitHub Pages
- én simuleringsmotor uten backend
- scenarioer serialisert i URL
- hele Oslo som første visning, men med geografimodell som kan støtte
  delbydel/gammel bydel/ny bydel
- årlige tidssteg
- startår 2015 eller 2027, valgt i UI
- tre politiske spaker: kommunale kjøp, kommunale salg og ikke-kommersiell andel
  av nybygg
- tre eksterne spaker: rente, befolkningsvekst og byggekostnad
- en enkel privat utbyggingsrespons basert på prosjektmargin og tilgjengelig
  regulert kapasitet
- output: kommunal boligbestand, privat leiepress, ikke-kommersiell
  boligbestand, igangsatte/ferdigstilte boliger og husholdninger med høy
  boutgiftsbelastning

Når dette virker, kan modellen deles opp etter bydel og historisk backtest
bygges inn.
