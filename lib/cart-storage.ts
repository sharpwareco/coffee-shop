export type CartItem = { productId: string; quantity: number };

export const STORAGE_KEY = "midnight-coffee-cart";

/**
 * Parses persisted cart JSON, dropping anything that is not a usable line item.
 *
 * Silently returns [] for unreadable storage as well as empty storage, so a
 * corrupt cart is discarded with no signal to the caller or the user. Callers
 * cannot distinguish "nothing saved" from "saved but unreadable".
 * See docs/coverage-findings.md #11.
 */
export const parseStored = (raw: string | null): CartItem[] => {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (entry): entry is CartItem =>
        typeof entry === "object" &&
        entry !== null &&
        typeof (entry as CartItem).productId === "string" &&
        Number.isInteger((entry as CartItem).quantity) &&
        (entry as CartItem).quantity > 0
    );
  } catch {
    return [];
  }
};
