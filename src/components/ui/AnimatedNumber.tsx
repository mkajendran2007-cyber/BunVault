"use client";

import React, { useEffect, useState } from 'react';
import { fmtINR } from '@/utils/currency';
import { fmtPct } from '@/utils/percentage';

interface AnimatedNumberProps {
  value: number;
  type?: 'currency' | 'percent' | 'number';
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}

export function AnimatedNumber({
  value,
  type = 'currency',
  prefix = '₹',
  suffix = '',
  decimals = 2,
  className = '',
}: AnimatedNumberProps) {
  const [displayVal, setDisplayVal] = useState(value);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const duration = 400; // ms
    const initialVal = displayVal;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const current = initialVal + (value - initialVal) * progress;
      setDisplayVal(current);

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    requestAnimationFrame(step);
  }, [value]);

  const formatted = React.useMemo(() => {
    if (type === 'currency') {
      return `${prefix}${fmtINR(displayVal, decimals)}${suffix}`;
    }
    if (type === 'percent') {
      return fmtPct(displayVal, true, decimals);
    }
    return `${prefix}${displayVal.toFixed(decimals)}${suffix}`;
  }, [displayVal, type, prefix, suffix, decimals]);

  return <span className={`transition-colors duration-200 ${className}`}>{formatted}</span>;
}
