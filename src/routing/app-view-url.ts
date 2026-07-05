export type AppView = "scenario" | "historical";

const historicalViewSearch = "?vis=historisk";

const toSearchParams = (query: string | URLSearchParams): URLSearchParams => {
  if (typeof query !== "string") {
    return query;
  }

  return new URLSearchParams(query.startsWith("?") ? query.slice(1) : query);
};

export const parseAppView = (query: string | URLSearchParams): AppView => {
  const searchParams = toSearchParams(query);

  return searchParams.get("vis") === "historisk" ? "historical" : "scenario";
};

export const serializeAppViewSearch = (view: AppView): string =>
  view === "historical" ? historicalViewSearch : "";
