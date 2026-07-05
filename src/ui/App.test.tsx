import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { App } from "./App";

describe("App", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/bolig-simulator/");
  });

  it("renders the scenario workshop", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { name: "Scenarioverksted" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", {
        name: "Indeksert utvikling for scenarioet",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "Kommunal" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Oslo-kommunale grep")).toBeInTheDocument();
    expect(screen.getByText("Statlige grep")).toBeInTheDocument();
    expect(
      screen.getByText("Eksterne makroforutsetninger"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Kommunalt disponerte boliger/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Grafen viser relativ utvikling/),
    ).toBeInTheDocument();
  });

  it("updates municipal stock when purchases change", async () => {
    const user = userEvent.setup();

    render(<App />);

    const summary = screen.getByText("Kommunale boliger").closest("div");
    expect(summary).not.toBeNull();
    const initialText = summary?.textContent ?? "";

    await user.clear(screen.getByLabelText("Kommunale kjøp per år"));
    await user.type(screen.getByLabelText("Kommunale kjøp per år"), "1500");

    expect(summary?.textContent).not.toBe(initialText);
  });

  it("reads scenario values from the URL", () => {
    window.history.replaceState(null, "", "/bolig-simulator/?kjop=900");

    render(<App />);

    expect(screen.getByLabelText("Kommunale kjøp per år")).toHaveValue(900);
  });

  it("writes only changed scenario values to the URL", async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.clear(screen.getByLabelText("Kommunale kjøp per år"));
    await user.type(screen.getByLabelText("Kommunale kjøp per år"), "1500");

    expect(window.location.search).toBe("?kjop=1500");
  });

  it("updates non-commercial stock when the new-build share changes", async () => {
    const user = userEvent.setup();

    render(<App />);

    const summary = screen.getByText("Ikke-kommersielle").closest("div");
    expect(summary).not.toBeNull();
    const initialText = summary?.textContent ?? "";

    await user.clear(screen.getByLabelText("Ikke-kommersiell andel av nybygg"));
    await user.type(
      screen.getByLabelText("Ikke-kommersiell andel av nybygg"),
      "40",
    );

    expect(summary?.textContent).not.toBe(initialText);
  });

  it("updates the year table when sales change", async () => {
    const user = userEvent.setup();

    render(<App />);

    const table = screen.getByRole("table");
    const rowBefore = within(table).getByRole("row", {
      name: /2027/,
    }).textContent;

    await user.clear(screen.getByLabelText("Kommunale salg per år"));
    await user.type(screen.getByLabelText("Kommunale salg per år"), "500");

    const rowAfter = within(table).getByRole("row", {
      name: /2027/,
    }).textContent;

    expect(rowAfter).not.toBe(rowBefore);
  });
});
