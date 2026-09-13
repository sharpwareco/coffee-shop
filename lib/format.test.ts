import { describe, expect, it } from "vitest";
import { centsToLira, formatPrice, liraToCents } from "@/lib/format";

describe("formatPrice", () => {
  it("renders integer cents as Turkish lira", () => {
    // Espresso is 12000 in data/products.json.
    expect(formatPrice(12000)).toBe("₺120,00");
  });

  it("renders zero", () => {
    expect(formatPrice(0)).toBe("₺0,00");
  });

  it("renders a non-round amount", () => {
    expect(formatPrice(18500)).toBe("₺185,00");
    expect(formatPrice(12050)).toBe("₺120,50");
  });
});

describe("centsToLira", () => {
  it("renders cents as a plain editable decimal", () => {
    expect(centsToLira(12000)).toBe("120.00");
    expect(centsToLira(12050)).toBe("120.50");
    expect(centsToLira(0)).toBe("0.00");
    expect(centsToLira(5)).toBe("0.05");
  });
});

describe("liraToCents", () => {
  it("converts a decimal string to integer cents", () => {
    expect(liraToCents("120.00")).toBe(12000);
    expect(liraToCents("120.5")).toBe(12050);
    expect(liraToCents("0")).toBe(0);
  });

  it("accepts a comma decimal separator", () => {
    expect(liraToCents("120,50")).toBe(12050);
  });

  it("rounds to the nearest cent", () => {
    expect(liraToCents("120.005")).toBe(12001);
    expect(liraToCents("120.004")).toBe(12000);
  });

  it("returns NaN for non-numeric input", () => {
    expect(liraToCents("abc")).toBeNaN();
    expect(liraToCents("12.34.56")).toBeNaN();
  });

  it.each(["", " ", "\t", "\n"])("treats blank input %j as zero, not NaN", (input) => {
    // NOTE: current behavior, pinned deliberately. Number("") and Number(" ")
    // are 0, so ProductsAdmin's `!Number.isFinite(cents) || cents < 0` guard
    // lets a blank price through as a free product. The whitespace cases are
    // the reachable ones — the `required` attribute blocks a truly empty field
    // but not a single space. See docs/coverage-findings.md #3.
    expect(liraToCents(input)).toBe(0);
  });

  it("accepts exponent and hex notation as prices", () => {
    // NOTE: current behavior, pinned deliberately. Number() is far more
    // permissive than a decimal parser, so these reach the store as real
    // prices. See docs/coverage-findings.md #3.
    expect(liraToCents("1e3")).toBe(100000);
    expect(liraToCents("0x10")).toBe(1600);
  });
});
