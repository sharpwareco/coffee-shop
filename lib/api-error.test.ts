import { describe, expect, it } from "vitest";
import { errorMessage } from "@/lib/api-error";

describe("errorMessage", () => {
  it("extracts a string error field", () => {
    expect(errorMessage({ error: "Cart is empty" }, "fallback")).toBe("Cart is empty");
  });

  it("falls back when the payload is not a usable object", () => {
    expect(errorMessage(null, "fallback")).toBe("fallback");
    expect(errorMessage(undefined, "fallback")).toBe("fallback");
    expect(errorMessage("plain string", "fallback")).toBe("fallback");
    expect(errorMessage(42, "fallback")).toBe("fallback");
  });

  it("falls back when error is missing or not a string", () => {
    expect(errorMessage({}, "fallback")).toBe("fallback");
    expect(errorMessage({ error: 500 }, "fallback")).toBe("fallback");
    expect(errorMessage({ error: null }, "fallback")).toBe("fallback");
    expect(errorMessage({ message: "wrong key" }, "fallback")).toBe("fallback");
  });
});
