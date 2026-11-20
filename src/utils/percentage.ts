/**
 * Formats percentage value with optional sign (+/-) and custom precision
 */
export function fmtPct(val: number | undefined | null, includeSign = true, decimals = 2): string {
  if (val === undefined || val === null || isNaN(val)) return '0.00%';
  const sign = includeSign && val > 0 ? '+' : '';
  return `${sign}${val.toFixed(decimals)}%`;
}

/**
 * Returns Tailwind CSS color classes based on positive, negative or neutral gain
 */
export function getGainColorClass(val: number | undefined | null): string {
  if (!val || Math.abs(val) < 0.001) return 'text-slate-400 dark:text-slate-400';
  return val > 0 
    ? 'text-emerald-600 dark:text-emerald-400' 
    : 'text-rose-600 dark:text-rose-400';
}

/**
 * Returns badge background & text color classes for profit / loss
 */
export function getGainBadgeClass(val: number | undefined | null): string {
  if (!val || Math.abs(val) < 0.001) {
    return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700';
  }
  return val > 0
    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
}
