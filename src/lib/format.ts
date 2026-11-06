/** Formatação de números em português (vírgula decimal, sinal tipográfico). */
export function signed(n: number, digits = 1): string {
  const abs = Math.abs(n).toFixed(digits).replace(".", ",");
  if (n > 0) return `+${abs}`;
  if (n < 0) return `−${abs}`;
  return abs;
}

export function decimal(n: number, digits = 1): string {
  return n.toFixed(digits).replace(".", ",");
}

export function euros(n: number): string {
  return new Intl.NumberFormat("pt-PT", { maximumFractionDigits: 0 }).format(n) + " €";
}
