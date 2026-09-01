/**
 * Renders an ISO timestamp as DD.MM.YYYY HH:MM for the admin tables.
 *
 * Two caveats, both pinned by tests and filed in docs/coverage-findings.md:
 * - THROWS on any string without a "T" (#2). Called during render of the admin
 *   orders table, so one bad row takes down the whole page.
 * - Does no timezone conversion (#8). It string-slices the literal ISO fields,
 *   so "...T14:30:00Z" and "...T14:30:00+03:00" both render as 14:30.
 */
export const formatDate = (iso: string): string => {
  const [date, time] = iso.split("T");
  const [year, month, day] = date.split("-");
  return `${day}.${month}.${year} ${time.slice(0, 5)}`;
};
