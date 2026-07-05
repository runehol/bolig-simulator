# Oslo boligsimulator

Interaktiv, statisk webapp for what-if-scenarioer om boligmarked og
boligpolitikk i Oslo.

Live side: <https://runehol.github.io/bolig-simulator/>

Stacken følger designnotatet:

- TypeScript for simuleringsmotor og datamodell
- React, Apache ECharts, Tailwind CSS og Vite for brukergrensesnitt og statisk
  bygg
- GitHub Pages og GitHub Actions for første deploy

Første scenarioverksted kjører en deterministisk modell i nettleseren, med
slidere, nummerfelt, ECharts-grafer med hover og sluttverdier, tabell med
faktiske verdier og korte delbare scenario-URL-er. Standardverdier er implisitte
i URL-en, slik at bare scenarioavvik skrives til adressefeltet.

## Kom i gang

```bash
npm install
npm run dev
```

Bygg produksjonsversjonen:

```bash
npm run build
```

Kjør kvalitetssjekkene:

```bash
npm run check
```

Dette kjører lint, produksjonsbygg og Vitest-testene. Under utvikling kan
testene kjøres i watch-modus:

```bash
npm run test
```

Formater kode og konfigurasjon:

```bash
npm run format
```

## Struktur

```text
src/
  data/        observerte serier og kildemetadata for backtest
  model/       simuleringslogikk, startverdier og modelltester
  routing/     parsing og serialisering av delbare scenario-URL-er
  test/        felles testoppsett
  ui/          React-komponenter
  main.tsx     React-entrypoint
  styles.css   Tailwind-import og global basestil
```

Simuleringslogikken ligger i `src/model`, ikke i React-komponentene. Første
modellkjerne kjører hele Oslo som én enhet fra 2027 til 2040 med grove,
utskiftbare startverdier fra `src/model/start-values.ts`. Observerte serier for
historisk sammenligning ligger separat i `src/data/`.
