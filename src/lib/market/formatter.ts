/**
 * Normalizes input asset symbols into canonical market symbols.
 * Examples:
 *  NIFTY 50 -> ^NSEI
 *  SENSEX -> ^BSESN
 *  BANK NIFTY -> ^NSEBANK
 *  RELIANCE -> RELIANCE.NS
 *  BTC -> BTC-INR
 *  ETH -> ETH-INR
 *  GOLD / Gold 24K -> GOLD_INR_1G
 *  SILVER / Silver 999 -> SILVER_INR_1G
 */
export function normalizeSymbol(symbol: string, type?: string): string {
  if (!symbol) return '';
  const clean = symbol.trim().toUpperCase();

  // Benchmark Indices
  if (clean === 'NIFTY' || clean === 'NIFTY 50' || clean === 'NIFTY50' || clean === '^NSEI') {
    return '^NSEI';
  }
  if (clean === 'SENSEX' || clean === 'BSE SENSEX' || clean === '^BSESN') {
    return '^BSESN';
  }
  if (clean === 'BANK NIFTY' || clean === 'BANKNIFTY' || clean === '^NSEBANK') {
    return '^NSEBANK';
  }

  // Bullion / Metals
  if (
    clean === 'GOLD' ||
    clean === 'GOLD_INR' ||
    clean === 'GOLD_INR_1G' ||
    clean.includes('GOLD 24K') ||
    clean.includes('PHYSICAL GOLD')
  ) {
    return 'GOLD_INR_1G';
  }
  if (
    clean === 'SILVER' ||
    clean === 'SILVER_INR' ||
    clean === 'SILVER_INR_1G' ||
    clean.includes('SILVER BULLION')
  ) {
    return 'SILVER_INR_1G';
  }

  // Crypto pairs (BTC-INR, ETH-INR, SOL-INR)
  if (type === 'Crypto' || clean.includes('-INR') || clean.includes('-USD') || clean === 'BTC' || clean === 'ETH' || clean === 'SOL' || clean === 'DOGE') {
    if (clean.endsWith('-INR') || clean.endsWith('-USD')) {
      return clean;
    }
    return `${clean}-INR`;
  }

  // Mutual Funds (AMFI Scheme Code 5 or 6 digits e.g. 122639)
  if (/^\d{5,6}$/.test(clean)) {
    return clean;
  }

  // Debt / FD
  if (clean.startsWith('FDRD_')) {
    return clean;
  }

  // Indian Stocks (Append .NS if no suffix provided)
  if (type === 'Equity' || !clean.includes('.')) {
    if (clean.endsWith('.NS') || clean.endsWith('.BO') || clean.endsWith('.X') || clean.startsWith('^') || clean.endsWith('-INR') || clean.endsWith('-USD')) {
      return clean;
    }
    return `${clean}.NS`;
  }

  return clean;
}
