import { MarketPriceItem } from '@/types/market';

export interface ValidationResult {
  isValid: boolean;
  reason?: string;
}

export class ValidationEngine {
  static validate(item: Partial<MarketPriceItem> | null | undefined): ValidationResult {
    if (!item) {
      return { isValid: false, reason: 'Payload is null or undefined' };
    }

    if (item.price === undefined || item.price === null) {
      return { isValid: false, reason: 'Price field is missing' };
    }

    if (typeof item.price !== 'number' || isNaN(item.price) || !isFinite(item.price)) {
      return { isValid: false, reason: 'Price is not a valid finite number' };
    }

    if (item.price <= 0) {
      return { isValid: false, reason: 'Price must be strictly positive (> 0)' };
    }

    if (!item.currency) {
      return { isValid: false, reason: 'Currency symbol is missing' };
    }

    if (!item.timestamp) {
      return { isValid: false, reason: 'Timestamp is missing' };
    }

    return { isValid: true };
  }
}
