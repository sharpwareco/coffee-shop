/** Input mask for a card expiry field: turns raw keystrokes into MM/YY. */
export const formatExpiry = (raw: string): string => {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  if (digits.length === 0) return "";

  const hadSlash = raw.includes("/");
  const singleDigitMonth = digits[0] >= "2" && digits[0] <= "9";

  if (digits.length === 1) {
    return hadSlash ? `0${digits}/` : digits;
  }

  if (singleDigitMonth) {
    return `0${digits[0]}/${digits.slice(1, 3)}`;
  }

  const month = digits.slice(0, 2);
  const year = digits.slice(2, 4);
  if (digits.length === 2) {
    return hadSlash ? `${month}/` : month;
  }
  return `${month}/${year}`;
};
