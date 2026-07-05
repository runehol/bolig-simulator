import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { App } from "./App";

describe("App", () => {
  it("renders the starter shell", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { name: "Scaffold klar" })
    ).toBeInTheDocument();
    expect(screen.getByText("React + TypeScript + Vite")).toBeInTheDocument();
  });
});
