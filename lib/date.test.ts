import { describe, expect, it } from "vitest";
import { formatDate } from "@/lib/date";

describe("formatDate", () => {
  it("renders an ISO timestamp as DD.MM.YYYY HH:MM", () => {
    expect(formatDate("2026-08-31T14:30:00.000Z")).toBe("31.08.2026 14:30");
    expect(formatDate("2026-01-05T09:07:00.000Z")).toBe("05.01.2026 09:07");
  });

  it("truncates seconds and the timezone suffix", () => {
    expect(formatDate("2026-12-25T23:59:59.999Z")).toBe("25.12.2026 23:59");
  });

  it("throws on a string with no time component", () => {
    // NOTE: current behavior, pinned deliberately. `iso.split("T")` yields no
    // second element, so `time.slice(0, 5)` throws and takes down the admin
    // orders table. See docs/coverage-findings.md #2.
    expect(() => formatDate("2026-08-31")).toThrow();
    expect(() => formatDate("")).toThrow();
  });
});
