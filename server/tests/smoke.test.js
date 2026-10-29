import { describe, it, expect } from "vitest";
import { escapeCsv, safeCsvText } from "../src/controllers/exportController.js";
import { monthRange } from "../src/services/analyticsService.js";

describe("SpendWise utility smoke tests", function () {
  it("formats CSV formula prefixes safely", function () {
    expect(safeCsvText("=SUM(A1:A2)")).toBe("'=SUM(A1:A2)");
  });

  it("escapes CSV quotes and commas", function () {
    expect(escapeCsv("Food, home")).toBe('"Food, home"');
    expect(escapeCsv('A "quoted" item')).toBe('"A ""quoted"" item"');
  });

  it("creates UTC month boundaries without local timezone shifts", function () {
    const range = monthRange("2026-10");
    expect(range.start.toISOString()).toBe("2026-10-01T00:00:00.000Z");
    expect(range.end.toISOString()).toBe("2026-11-01T00:00:00.000Z");
  });
});
