/** The single place where Line totals, the Subtotal, the Discount and the Total are computed. */

export type PricedLine = { unitPrice: number; quantity: number };

export type Totals = { subtotal: number; discount: number; total: number };

export const lineTotal = ({ unitPrice, quantity }: PricedLine) => unitPrice * quantity;

export function priceOrder(lines: PricedLine[]): Totals {
  const subtotal = lines.reduce((sum, line) => sum + lineTotal(line), 0);
  const discount = 0;
  return { subtotal, discount, total: subtotal - discount };
}
