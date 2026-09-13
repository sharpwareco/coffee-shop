/** Pulls an `error` string out of a parsed API response, falling back when absent. */
export const errorMessage = (data: unknown, fallback: string): string =>
  typeof data === "object" && data !== null && "error" in data && typeof (data as { error?: unknown }).error === "string"
    ? (data as { error: string }).error
    : fallback;
