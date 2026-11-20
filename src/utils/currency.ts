/**
 * Formats a number into Indian Rupee (INR) currency format with standard commas (e.g., ₹12,55,421.00)
 */
export function fmtINR(val: number | string | undefined | null, decimals = 2): string {
  if (val === undefined || val === null || isNaN(Number(val))) return '0.00';
  const num = Number(val);
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals === 0 ? 0 : decimals,
  }).format(num);
}

/**
 * Formats large amounts compactly (e.g. ₹1.25 Cr, ₹45.2 L, ₹12.5 K)
 */
export function fmtCompactINR(val: number | undefined | null): string {
  if (!val || isNaN(val)) return '₹0';
  const abs = Math.abs(val);
  const sign = val < 0 ? '-' : '';

  if (abs >= 10000000) {
    return `${sign}₹${(abs / 10000000).toFixed(2)} Cr`;
  }
  if (abs >= 100000) {
    return `${sign}₹${(abs / 100000).toFixed(2)} L`;
  }
  if (abs >= 1000) {
    return `${sign}₹${(abs / 1000).toFixed(1)} K`;
  }
  return `${sign}₹${abs.toFixed(2)}`;
}
