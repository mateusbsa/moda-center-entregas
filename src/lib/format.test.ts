import { describe, expect, it } from "vitest";
import { hojeAs } from "./format";

describe("hojeAs", () => {
  it("fills the deadline with the carrier's departure time on the same day", () => {
    expect(hojeAs("17:00:00", new Date(2026, 10, 16, 9, 30))).toBe("2026-11-16T17:00");
  });
  it("returns empty when carrier has no departure time", () => {
    expect(hojeAs(null)).toBe("");
  });
});
