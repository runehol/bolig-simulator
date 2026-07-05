# Arbeidsregler for agenter

Dette repoet er en Vite/React/TypeScript-app for Oslo boligsimulator.
`docs/oslo-boligsimulator-design.md` er produkt- og modellreferansen, men ikke
kopier hele planen inn i kode eller dokumentasjon.

## Før du endrer

- Sjekk arbeidskopien med `git status --short`.
- Les filene du faktisk skal endre, og relevant del av designnotatet.
- Hold endringer små. Ikke rydd, refaktorer eller flytt filer som ikke trengs
  for oppgaven.
- Bevar GitHub Pages-oppsettet i `vite.config.ts`, særlig
  `base: "/bolig-simulator/"`, med mindre deploystrategien endres eksplisitt.

## Kode

- Bruk TypeScript, React og eksisterende Vite-oppsett.
- Simuleringslogikk skal ikke ligge i React-komponenter.
- Modellkode hører hjemme under `src/model/` når den innføres.
- Scenario-URL-logikk hører hjemme under `src/routing/` når den innføres.
- UI-kode hører hjemme under `src/ui/`.
- Legg tester nær koden de dekker når det er praktisk, for eksempel
  `src/ui/App.test.tsx` for UI-komponenter.
- Bruk `src/test/setup.ts` for felles testoppsett som skal gjelde alle
  Vitest-tester.
- Ikke legg til nye runtime-avhengigheter uten konkret behov i implementert
  kode.
- Ikke opprett tomme katalogstrukturer bare for å speile designnotatet.

## Tester

- Bruk Vitest som testkjører.
- Bruk React Testing Library for komponenttester av React-UI.
- Bruk `@testing-library/jest-dom`-matchere via `src/test/setup.ts`.
- Kjør `npm run test` for watch-modus under utvikling.
- Kjør `npm run test:run` for en engangskjøring av testene.
- Nye modellfunksjoner bør ha deterministiske enhetstester som dekker
  scenario-input og forventet output.
- Nye UI-flyter bør ha komponenttester som tester brukerobserverbar oppførsel,
  ikke interne React-detaljer.

## Formatering

- Bruk `npm run format` for automatisk formatering.
- Bruk `npm run format:check` for å kontrollere formatering uten å skrive filer.
- Følg eksisterende stil:
  - 2 mellomrom innrykk i TypeScript/TSX, JSON og CSS.
  - Doble anførselstegn i TypeScript/TSX.
  - Semikolon der eksisterende TypeScript-kode bruker det.
  - CSS med én regel per blokk og lesbare linjeskift.
- I Markdown-filer skal linjer brekkes rundt 80 tegn der det er praktisk.
- Prettier gjelder også Markdown i `docs/`.

## Kvalitetssjekker

Kjør disse før du avslutter kodeendringer:

```bash
npm run check
```

- `npm run check` kjører formatkontroll, ESLint, TypeScript/Vite-build og
  Vitest.
- `npm run lint` kan brukes alene for ESLint-regler.
- `npm run build` kan brukes alene for TypeScript-prosjektbygg og Vite-build.
- `npm run test:run` kan brukes alene for Vitest-testene.
- Hvis du bare endrer Markdown eller ren tekst, holder det vanligvis å sjekke
  diffen og linjelengde.
- Hvis en sjekk ikke kan kjøres, oppgi konkret kommando og feilmelding.

## Dokumentasjon

- Oppdater README når kommandoer, struktur, installasjon eller deploy endres.
- Oppdater designnotatet bare når produkt- eller modellretning faktisk endres.
- Ikke legg detaljerte milepælsplaner i designnotatet uten eksplisitt ønske.

## Før du svarer

- Se over `git diff`.
- Sjekk at nye filer er relevante og ikke bare stillas.
- Oppsummer hvilke sjekker som ble kjørt, eller hvorfor de ble hoppet over.
