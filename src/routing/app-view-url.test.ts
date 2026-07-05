import { describe, expect, it } from "vitest";

import { parseAppView, serializeAppViewHash } from "./app-view-url";

describe("app view URL routing", () => {
  it("keeps the simulator view implicit", () => {
    expect(parseAppView("")).toBe("scenario");
    expect(serializeAppViewHash("scenario")).toBe("");
  });

  it("represents historical testing as a separate view", () => {
    expect(parseAppView("#/historisk")).toBe("historical");
    expect(serializeAppViewHash("historical")).toBe("#/historisk");
  });

  it("ignores unknown hash routes", () => {
    expect(parseAppView("#/ukjent")).toBe("scenario");
  });
});
