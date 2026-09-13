import { describe, expect, it } from "vitest";
import { formatExpiry } from "@/lib/expiry";

describe("formatExpiry", () => {
  it("returns empty for input with no digits", () => {
    expect(formatExpiry("")).toBe("");
    expect(formatExpiry("abc")).toBe("");
    expect(formatExpiry("/")).toBe("");
  });

  it("leaves a lone leading digit alone so it stays editable", () => {
    expect(formatExpiry("1")).toBe("1");
    // Intended behavior, not a deferred bug: the length===1 branch is checked
    // BEFORE the single-digit-month branch, so a bare "2" is NOT yet padded to
    // "02/". Padding mid-keystroke would fight the user's typing; it happens
    // once a second character arrives.
    expect(formatExpiry("2")).toBe("2");
    expect(formatExpiry("9")).toBe("9");
  });

  it("pads a single digit once the user types a slash", () => {
    expect(formatExpiry("1/")).toBe("01/");
    expect(formatExpiry("2/")).toBe("02/");
  });

  it("auto-pads a month that cannot be a two-digit month", () => {
    // 2-9 cannot start a valid MM, so the digit is treated as the whole month.
    expect(formatExpiry("25")).toBe("02/5");
    expect(formatExpiry("95")).toBe("09/5");
    expect(formatExpiry("312")).toBe("03/12");
  });

  it("keeps a two-digit month unseparated until a year is typed", () => {
    expect(formatExpiry("12")).toBe("12");
    expect(formatExpiry("10")).toBe("10");
  });

  it("adds the separator when the user typed one", () => {
    expect(formatExpiry("12/")).toBe("12/");
  });

  it("formats a full month and year", () => {
    expect(formatExpiry("1225")).toBe("12/25");
    expect(formatExpiry("12/25")).toBe("12/25");
    expect(formatExpiry("0130")).toBe("01/30");
  });

  it("strips non-digits and truncates beyond four digits", () => {
    expect(formatExpiry("1a2b/2c5d")).toBe("12/25");
    expect(formatExpiry("123456789")).toBe("12/34");
  });
});
