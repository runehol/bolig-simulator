# Arbeidsregler for agenter

Dette repoet er en Vite/React/TypeScript/Tailwind-app for Oslo boligsimulator.
`docs/oslo-boligsimulator-design.md` er produkt- og modellreferansen.

## Før du endrer

- Sjekk arbeidskopien med `git status --short`.
- Les filene du faktisk skal endre, og relevant del av designnotatet.
- Bevar GitHub Pages-oppsettet i `vite.config.ts`, særlig
  `base: "/bolig-simulator/"`.

## Kode

- Bruk TypeScript, React, Tailwind CSS og eksisterende Vite-oppsett.
- Simuleringslogikk skal ikke ligge i React-komponenter.
- Modellkode hører hjemme under `src/model/` når den innføres.
- Scenario-URL-logikk hører hjemme under `src/routing/` når den innføres.
- UI-kode hører hjemme under `src/ui/`.
- Bruk Tailwind utility-klasser som standard for layout og komponentstil.
- Behold `src/styles.css` til Tailwind-import og global basestil.

## Tester

- Bruk Vitest som testkjører.
- Bruk React Testing Library for komponenttester av React-UI.
- Bruk `@testing-library/jest-dom`-matchere via `src/test/setup.ts`.
- Legg tester nær koden de dekker når det er praktisk, for eksempel
  `src/ui/App.test.tsx` for UI-komponenter.
- Kjør `npm run test` for watch-modus under utvikling.
- Kjør `npm run test:run` for en engangskjøring av testene.
- Nye modellfunksjoner bør ha deterministiske enhetstester som dekker
  scenario-input og forventet output.
- Nye UI-flyter bør ha komponenttester som tester brukerobserverbar oppførsel,
  ikke interne React-detaljer.

## Formatering

- Bruk `npm run format` for automatisk formatering.
- Bruk `npm run format:check` for å kontrollere formatering uten å skrive filer.
- Prettier er autoritativ for TypeScript, TSX, CSS, JSON og Markdown.
- Markdown skal brekkes rundt 80 tegn der det er praktisk.

## Kvalitetssjekker

- `npm run check` kjører formatkontroll, ESLint, TypeScript/Vite-build og
  Vitest.
- `npm run lint` kan brukes alene for ESLint-regler.
- `npm run build` kan brukes alene for TypeScript-prosjektbygg og Vite-build.
- `npm run test:run` kan brukes alene for Vitest-testene.

## Dokumentasjon

- Oppdater README når kommandoer, struktur, installasjon eller deploy endres.
- Oppdater designnotatet bare når produkt- eller modellretning faktisk endres.
