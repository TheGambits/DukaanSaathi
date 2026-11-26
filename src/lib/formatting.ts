import type { Product } from '../types';

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function formatCurrency(amount: number): string {
  const rounded = round2(amount);
  const hasDecimals = Math.abs(rounded - Math.round(rounded)) > 0.001;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(rounded);
}

export function formatNumber(value: number): string {
  const rounded = round2(value);
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

export function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatShortDate(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function isToday(isoString: string): boolean {
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export function isLowStock(product: Pick<Product, 'stock' | 'reorderLevel'>): boolean {
  return product.stock <= product.reorderLevel;
}

export function formatUnitLabel(unit: string, qty: number): string {
  if (unit === 'litre') return qty === 1 ? 'litre' : 'litres';
  if (unit === 'packet') return qty === 1 ? 'packet' : 'packets';
  if (unit === 'piece') return qty === 1 ? 'piece' : 'pieces';
  return unit;
}
