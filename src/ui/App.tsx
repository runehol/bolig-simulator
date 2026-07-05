import { useEffect, useRef, useState } from "react";

import {
  parseAppView,
  serializeAppViewHash,
  type AppView,
} from "../routing/app-view-url";
import {
  defaultScenarioUrlState,
  parseScenarioUrlState,
  serializeScenarioSearch,
  type ScenarioUrlState,
} from "../routing/scenario-url";
import { AppTabs } from "./AppTabs";
import { HistoricalBacktestView } from "./HistoricalBacktestView";
import { clampScenarioFormValue } from "./scenario-controls";
import { ScenarioWorkshopView } from "./ScenarioWorkshopView";

const initialFormState: ScenarioUrlState = defaultScenarioUrlState;

const getInitialFormState = (): ScenarioUrlState => {
  if (typeof window === "undefined") {
    return initialFormState;
  }

  return parseScenarioUrlState(window.location.search);
};

const getInitialView = (): AppView => {
  if (typeof window === "undefined") {
    return "scenario";
  }

  return parseAppView(window.location.hash);
};

const replaceUrl = (search: string, hash = "") => {
  window.history.replaceState(
    null,
    "",
    `${window.location.pathname}${search}${hash}`,
  );
};

const pushUrl = (search: string, hash = "") => {
  window.history.pushState(
    null,
    "",
    `${window.location.pathname}${search}${hash}`,
  );
};

export function App() {
  const [activeView, setActiveView] = useState<AppView>(getInitialView);
  const [formState, setFormState] =
    useState<ScenarioUrlState>(getInitialFormState);
  const lastScenarioSearch = useRef(
    activeView === "scenario" ? serializeScenarioSearch(formState) : "",
  );

  useEffect(() => {
    if (activeView !== "scenario") {
      return;
    }

    const nextSearch = serializeScenarioSearch(formState);
    lastScenarioSearch.current = nextSearch;

    if (nextSearch === window.location.search && window.location.hash === "") {
      return;
    }

    replaceUrl(nextSearch);
  }, [activeView, formState]);

  useEffect(() => {
    const onLocationChange = () => {
      const nextView = parseAppView(window.location.hash);
      setActiveView(nextView);

      if (nextView === "scenario") {
        const nextFormState = parseScenarioUrlState(window.location.search);
        lastScenarioSearch.current = serializeScenarioSearch(nextFormState);
        setFormState(nextFormState);
      }
    };

    window.addEventListener("hashchange", onLocationChange);
    window.addEventListener("popstate", onLocationChange);

    return () => {
      window.removeEventListener("hashchange", onLocationChange);
      window.removeEventListener("popstate", onLocationChange);
    };
  }, []);

  const updateFormValue = (id: keyof ScenarioUrlState, value: number) => {
    if (!Number.isFinite(value)) {
      return;
    }

    setFormState((current) => ({
      ...current,
      [id]: clampScenarioFormValue(id, value),
    }));
  };

  const updateActiveView = (view: AppView) => {
    if (view === activeView) {
      return;
    }

    if (view === "historical") {
      lastScenarioSearch.current = serializeScenarioSearch(formState);
      pushUrl("", serializeAppViewHash("historical"));
      setActiveView("historical");
      return;
    }

    pushUrl(lastScenarioSearch.current);
    setActiveView("scenario");
    setFormState(parseScenarioUrlState(lastScenarioSearch.current));
  };

  return (
    <main className="min-h-screen bg-[#f7f6f1] px-4 py-8 text-[#17211c] dark:bg-[#111510] dark:text-[#eef2e9] sm:px-8 lg:px-12">
      <header className="mb-6 max-w-5xl">
        <p className="mb-2 text-xs font-bold tracking-[0.08em] text-[#68746d] uppercase dark:text-[#a8b2a8]">
          Oslo boligsimulator
        </p>
      </header>

      <AppTabs activeView={activeView} onChange={updateActiveView} />

      {activeView === "scenario" ? (
        <ScenarioWorkshopView
          formState={formState}
          updateFormValue={updateFormValue}
        />
      ) : (
        <HistoricalBacktestView />
      )}
    </main>
  );
}
