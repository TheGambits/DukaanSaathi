import type { Bill, Customer, ExpenseRecord, PaymentRecord, Product } from '../types';
import { round2 } from './formatting';

export type PeriodKind = 'weekly' | 'monthly';

export interface DailyBucket {
  dateKey: string; // YYYY-MM-DD
  label: string;
  sales: number;
  expenses: number;
  udhaarGiven: number;
  paymentReceived: number;
  endingBalance: number;
}

function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDayLabel(d: Date, daysCount: number): string {
  if (daysCount <= 7) {
    return new Intl.DateTimeFormat('en-IN', { weekday: 'short' }).format(d);
  }
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short' }).format(d);
}

export function getPeriodDays(period: PeriodKind): number {
  return period === 'weekly' ? 7 : 30;
}

export function isWithinLastDays(iso: string, days: number, now = new Date()): boolean {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));
  return d.getTime() >= start.getTime();
}

export function buildPeriodBuckets(
  period: PeriodKind,
  bills: Bill[],
  payments: PaymentRecord[],
  expenses: ExpenseRecord[],
  customers: Customer[],
  now = new Date()
): DailyBucket[] {
  const daysCount = getPeriodDays(period);
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (daysCount - 1));

  const buckets: DailyBucket[] = [];
  const map = new Map<string, DailyBucket>();

  for (let i = 0; i < daysCount; i += 1) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = toDateKey(d);
    const bucket: DailyBucket = {
      dateKey: key,
      label: formatDayLabel(d, daysCount),
      sales: 0,
      expenses: 0,
      udhaarGiven: 0,
      paymentReceived: 0,
      endingBalance: 0,
    };
    buckets.push(bucket);
    map.set(key, bucket);
  }

  for (const bill of bills) {
    const d = new Date(bill.createdAt);
    if (Number.isNaN(d.getTime())) continue;
    const b = map.get(toDateKey(d));
    if (b) {
      b.sales = round2(b.sales + bill.finalTotal);
      b.udhaarGiven = round2(b.udhaarGiven + bill.outstandingAmount);
    }
  }

  for (const pay of payments) {
    const d = new Date(pay.createdAt);
    if (Number.isNaN(d.getTime())) continue;
    const b = map.get(toDateKey(d));
    if (b) {
      b.paymentReceived = round2(b.paymentReceived + pay.amount);
    }
  }

  for (const exp of expenses) {
    const d = new Date(exp.createdAt);
    if (Number.isNaN(d.getTime())) continue;
    const b = map.get(toDateKey(d));
    if (b) {
      b.expenses = round2(b.expenses + exp.amount);
    }
  }

  // Reconstruct daily ending outstanding balance backwards from current total outstanding
  const currentTotalOutstanding = round2(customers.reduce((sum, c) => sum + c.balance, 0));
  let runningEnd = currentTotalOutstanding;
  for (let i = buckets.length - 1; i >= 0; i -= 1) {
    buckets[i].endingBalance = Math.max(0, round2(runningEnd));
    runningEnd = round2(runningEnd - buckets[i].udhaarGiven + buckets[i].paymentReceived);
  }

  return buckets;
}

export function computeBestSellingProducts(
  bills: Bill[],
  products: Product[],
  days: number
): Array<{ name: string; hindiName: string; revenue: number; quantity: number; unit: string }> {
  const agg = new Map<
    string,
    { name: string; hindiName: string; revenue: number; quantity: number; unit: string }
  >();

  for (const bill of bills) {
    if (!isWithinLastDays(bill.createdAt, days)) continue;
    for (const item of bill.items) {
      const existing = agg.get(item.productId) ?? {
        name: item.productName,
        hindiName: item.hindiName,
        revenue: 0,
        quantity: 0,
        unit: item.unit,
      };
      existing.revenue = round2(existing.revenue + item.lineTotal);
      existing.quantity = round2(existing.quantity + item.quantity);
      agg.set(item.productId, existing);
    }
  }

  if (agg.size === 0) {
    return products.slice(0, 5).map((p) => ({
      name: p.name,
      hindiName: p.hindiName,
      revenue: 0,
      quantity: 0,
      unit: p.unit,
    }));
  }

  return Array.from(agg.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);
}

export function computeStockMovement(
  bills: Bill[],
  products: Product[],
  days: number
): Array<{ name: string; soldQty: number; currentStock: number; unit: string }> {
  const soldByProduct = new Map<string, number>();
  for (const bill of bills) {
    if (!isWithinLastDays(bill.createdAt, days)) continue;
    for (const item of bill.items) {
      soldByProduct.set(
        item.productId,
        round2((soldByProduct.get(item.productId) ?? 0) + item.quantity)
      );
    }
  }

  return products.slice(0, 6).map((p) => ({
    name: p.name,
    soldQty: soldByProduct.get(p.id) ?? 0,
    currentStock: p.stock,
    unit: p.unit,
  }));
}

export function computeEstimatedNetProfit(
  bills: Bill[],
  products: Product[],
  expenses: ExpenseRecord[],
  days: number
): { sales: number; cogs: number; expensesTotal: number; netProfit: number } {
  const costMap = new Map(products.map((p) => [p.id, p.cost]));
  let sales = 0;
  let cogs = 0;

  for (const bill of bills) {
    if (!isWithinLastDays(bill.createdAt, days)) continue;
    sales = round2(sales + bill.finalTotal);
    for (const item of bill.items) {
      const unitCost = costMap.get(item.productId) ?? 0;
      cogs = round2(cogs + unitCost * item.quantity);
    }
  }

  const expensesTotal = round2(
    expenses
      .filter((e) => isWithinLastDays(e.createdAt, days))
      .reduce((sum, e) => sum + e.amount, 0)
  );

  const netProfit = round2(sales - cogs - expensesTotal);
  return { sales, cogs, expensesTotal, netProfit };
}
