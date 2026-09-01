export const formatPrice = (cents: number) =>
  new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(cents / 100);

/** Cents -> a plain editable lira string for form inputs (no currency symbol). */
export const centsToLira = (cents: number) => (cents / 100).toFixed(2);

/**
 * Lira typed into a form -> integer cents.
 *
 * Returns NaN for unparseable input like "abc", but NOT for blank input:
 * Number("") and Number(" ") are both 0, so a blank field converts to a free
 * product. Callers cannot use Number.isFinite alone to reject an empty price.
 * Number() also accepts exponent and hex forms ("1e3" -> 100000 cents).
 * See docs/coverage-findings.md #3.
 */
export const liraToCents = (input: string) => Math.round(Number(input.replace(",", ".")) * 100);
