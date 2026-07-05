# Oslo boligsimulator

Grunnoppsett for en interaktiv, statisk webapp for what-if-scenarioer om
boligmarked og boligpolitikk i Oslo.

Stacken følger designnotatet:

- TypeScript for simuleringsmotor og datamodell
- React og Vite for brukergrensesnitt og statisk bygg
- GitHub Pages og GitHub Actions for første deploy

ECharts, MapLibre GL JS og en Web Worker kan legges til når de første faktiske
visningene og simuleringsflytene implementeres.

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
  test/        felles testoppsett
  ui/          React-komponenter
  main.tsx     React-entrypoint
  styles.css   global styling
```

Når modellen legges til, bør simuleringslogikken ligge i `src/model`, ikke i
React-komponentene.
