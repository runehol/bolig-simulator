import { useEffect, useRef, useState } from "react";

import {
  parseAppView,
  serializeAppViewSearch,
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

  return parseAppView(window.location.search);
};

const replaceSearch = (search: string) => {
  window.history.replaceState(
    null,
    "",
    `${window.location.pathname}${search}${window.location.hash}`,
  );
};

const pushSearch = (search: string) => {
  window.history.pushState(
    null,
    "",
    `${window.location.pathname}${search}${window.location.hash}`,
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

    if (nextSearch === window.location.search) {
      return;
    }

    replaceSearch(nextSearch);
  }, [activeView, formState]);

  useEffect(() => {
    const onPopState = () => {
      const nextView = parseAppView(window.location.search);
      setActiveView(nextView);

      if (nextView === "scenario") {
        const nextFormState = parseScenarioUrlState(window.location.search);
        lastScenarioSearch.current = serializeScenarioSearch(nextFormState);
        setFormState(nextFormState);
      }
    };

    window.addEventListener("popstate", onPopState);

    return () => window.removeEventListener("popstate", onPopState);
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
      pushSearch(serializeAppViewSearch("historical"));
      setActiveView("historical");
      return;
    }

    pushSearch(lastScenarioSearch.current);
    setActiveView("scenario");
    setFormState(parseScenarioUrlState(lastScenarioSearch.current));
  };

  return (
    <main className="min-h-screen px-4 py-8 sm:px-8 lg:px-12">
      <header className="mb-6 max-w-5xl">
        <p className="mb-2 text-xs font-bold tracking-[0.08em] text-[#68746d] uppercase">
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
