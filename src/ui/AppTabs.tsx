import type { AppView } from "../routing/app-view-url";

export function AppTabs({
  activeView,
  onChange,
}: {
  activeView: AppView;
  onChange: (view: AppView) => void;
}) {
  return (
    <nav aria-label="Hovedvisning" className="mb-8 border-b border-[#ddd8cd]">
      <div className="flex gap-2" role="tablist">
        {[
          { id: "scenario" as const, label: "Scenarioverksted" },
          { id: "historical" as const, label: "Historisk test" },
        ].map((tab) => (
          <button
            aria-selected={activeView === tab.id}
            className={`border-b-2 px-4 py-3 text-sm font-semibold ${
              activeView === tab.id
                ? "border-[#b13f2d] text-[#17211c]"
                : "border-transparent text-[#68746d]"
            }`}
            key={tab.id}
            onClick={() => onChange(tab.id)}
            role="tab"
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
