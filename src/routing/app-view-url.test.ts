import { describe, expect, it } from "vitest";

import { parseAppView, serializeAppViewSearch } from "./app-view-url";

describe("app view URL routing", () => {
  it("keeps the simulator view implicit", () => {
    expect(parseAppView("")).toBe("scenario");
    expect(serializeAppViewSearch("scenario")).toBe("");
  });

  it("represents historical testing as a separate view", () => {
    expect(parseAppView("?vis=historisk")).toBe("historical");
    expect(serializeAppViewSearch("historical")).toBe("?vis=historisk");
  });

  it("does not treat scenario parameters as historical testing", () => {
    expect(parseAppView("?kjop=1500&rente=5.5")).toBe("scenario");
  });
});
