import { nonNeg } from './math';

// The only place where numbers get rounded (SPEC §5.2).

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const hours = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 });
const multiple = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Money can be negative (year-1 net); anything non-finite shows as $0. */
export function formatMoney(n: number): string {
  return money.format(Number.isFinite(n) ? n : 0);
}

export function formatHours(n: number): string {
  return hours.format(nonNeg(n));
}

export function formatMultiple(n: number): string {
  return `${multiple.format(nonNeg(n))}×`;
}
