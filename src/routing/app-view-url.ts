export type AppView = "scenario" | "historical";

const historicalViewHash = "#/historisk";

export const parseAppView = (hash: string): AppView =>
  hash === historicalViewHash ? "historical" : "scenario";

export const serializeAppViewHash = (view: AppView): string =>
  view === "historical" ? historicalViewHash : "";
