# Oslo boligsimulator

Interaktiv, statisk webapp for what-if-scenarioer om boligmarked og
boligpolitikk i Oslo.

Live side: <https://runehol.github.io/bolig-simulator/>

Stacken følger designnotatet:

- TypeScript for simuleringsmotor og datamodell
- React, Tailwind CSS og Vite for brukergrensesnitt og statisk bygg
- GitHub Pages og GitHub Actions for første deploy

Første scenarioverksted kjører en deterministisk modell i nettleseren, med
slidere, nummerfelt, normalisert tidsseriegraf og tabell med faktiske verdier.
ECharts, MapLibre GL JS og en Web Worker kan legges til når visnings- og
simuleringsbehovene blir mer avanserte.

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
  model/       simuleringslogikk, startverdier og modelltester
  test/        felles testoppsett
  ui/          React-komponenter
  main.tsx     React-entrypoint
  styles.css   Tailwind-import og global basestil
```

Simuleringslogikken ligger i `src/model`, ikke i React-komponentene. Første
modellkjerne kjører hele Oslo som én enhet fra 2027 til 2040 med grove,
utskiftbare startverdier fra `src/model/start-values.ts`.
