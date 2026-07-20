import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a number in Indian locale (en-IN) consistently on both server and client
 * to prevent React hydration mismatches from locale-dependent toLocaleString().
 */
export function fmtINR(value: number, options?: Intl.NumberFormatOptions): string {
  return value.toLocaleString('en-IN', options)
}
