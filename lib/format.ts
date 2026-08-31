export const formatPrice = (cents: number) =>
  new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(cents / 100);
