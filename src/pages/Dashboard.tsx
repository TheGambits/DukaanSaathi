import { useMemo, useState } from 'react';
import {
  BookOpen,
  Plus,
  ReceiptText,
  TrendingUp,
  Wallet,
  X,
} from 'lucide-react';
import type { Bill, Customer, ExpenseRecord, PaymentRecord, Product } from '../types';
import { formatCurrency, formatNumber, formatShortDate, round2 } from '../lib/formatting';
import {
  buildPeriodBuckets,
  computeBestSellingProducts,
  computeEstimatedNetProfit,
  computeStockMovement,
  getPeriodDays,
  isWithinLastDays,
  type PeriodKind,
} from '../lib/analytics';
import {
  DualBarChart,
  HorizontalBarList,
  StockMovementBarList,
  TrendLineChart,
} from '../components/Charts';

interface DashboardPageProps {
  bills: Bill[];
  customers: Customer[];
  products: Product[];
  expenses: ExpenseRecord[];
  payments: PaymentRecord[];
  onAddExpense: (payload: { title: string; amount: number; category?: string }) => void;
  onSelectBill: (bill: Bill) => void;
}

export function DashboardPage({
  bills,
  customers,
  products,
  expenses,
  payments,
  onAddExpense,
  onSelectBill,
}: DashboardPageProps) {
  const [period, setPeriod] = useState<PeriodKind>('weekly');
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expTitle, setExpTitle] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expError, setExpError] = useState<string | null>(null);

  const days = getPeriodDays(period);

  const profitSummary = useMemo(
    () => computeEstimatedNetProfit(bills, products, expenses, days),
    [bills, products, expenses, days]
  );

  const currentUdhaar = round2(customers.reduce((sum, c) => sum + c.balance, 0));

  const buckets = useMemo(
    () => buildPeriodBuckets(period, bills, payments, expenses, customers),
    [period, bills, payments, expenses, customers]
  );

  const bestSelling = useMemo(
    () => computeBestSellingProducts(bills, products, days),
    [bills, products, days]
  );

  const stockMovement = useMemo(
    () => computeStockMovement(bills, products, days),
    [bills, products, days]
  );

  const creditActivity = useMemo(() => {
    const periodMap = new Map<string, { label: string; udhaar: number; paid: number }>();
    for (const c of customers) {
      periodMap.set(c.id, { label: c.name, udhaar: 0, paid: 0 });
    }
    for (const b of bills) {
      if (!b.customerId || !isWithinLastDays(b.createdAt, days)) continue;
      const entry = periodMap.get(b.customerId);
      if (entry) entry.udhaar = round2(entry.udhaar + b.outstandingAmount);
    }
    for (const p of payments) {
      if (!isWithinLastDays(p.createdAt, days)) continue;
      const entry = periodMap.get(p.customerId);
      if (entry) entry.paid = round2(entry.paid + p.amount);
    }
    return Array.from(periodMap.values()).slice(0, 6);
  }, [customers, bills, payments, days]);

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    setExpError(null);
    try {
      onAddExpense({
        title: expTitle,
        amount: Number.parseFloat(expAmount) || 0,
      });
      setExpTitle('');
      setExpAmount('');
      setShowExpenseForm(false);
    } catch (err) {
      setExpError(err instanceof Error ? err.message : 'Expense save nahi ho saka.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header + Period Switch + Add Expense */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-[#12332F]">Reports &amp; Analytics</h1>
          <p className="text-base text-[#546E7A]">
            Local sales, expenses, profit margin aur stock movement summary.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex rounded-xl border border-[#E5E7EB] bg-white p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setPeriod('weekly')}
              className={`min-h-[40px] rounded-lg px-4 text-sm font-extrabold transition-colors ${
                period === 'weekly'
                  ? 'bg-[#12332F] text-white'
                  : 'text-[#546E7A] hover:text-[#263238]'
              }`}
            >
              Weekly
            </button>
            <button
              type="button"
              onClick={() => setPeriod('monthly')}
              className={`min-h-[40px] rounded-lg px-4 text-sm font-extrabold transition-colors ${
                period === 'monthly'
                  ? 'bg-[#12332F] text-white'
                  : 'text-[#546E7A] hover:text-[#263238]'
              }`}
            >
              Monthly
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setExpError(null);
              setShowExpenseForm(true);
            }}
            className="flex min-h-[46px] items-center gap-1.5 rounded-xl bg-[#0F766E] px-4 text-sm font-bold text-white shadow-sm hover:bg-[#12332F]"
          >
            <Plus className="h-4 w-4" />
            Add Expense
          </button>
        </div>
      </div>

      {/* 4 KPI Cards: Sales, Expenses, Net Profit, Udhaar Outstanding */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-[#546E7A]">
              Sales ({period === 'weekly' ? '7d' : '30d'})
            </span>
            <TrendingUp className="h-5 w-5 text-[#0F766E]" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-[#12332F] sm:text-3xl">
            {formatCurrency(profitSummary.sales)}
          </p>
          <p className="mt-1 text-xs text-[#607D8B]">
            {bills.filter((b) => isWithinLastDays(b.createdAt, days)).length} invoices
          </p>
        </div>

        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-[#546E7A]">
              Expenses ({period === 'weekly' ? '7d' : '30d'})
            </span>
            <ReceiptText className="h-5 w-5 text-[#DC2626]" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-[#DC2626] sm:text-3xl">
            {formatCurrency(profitSummary.expensesTotal)}
          </p>
          <p className="mt-1 text-xs text-[#607D8B]">
            {expenses.filter((e) => isWithinLastDays(e.createdAt, days)).length} expense entries
          </p>
        </div>

        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-[#546E7A]">Net Profit (Est.)</span>
            <Wallet className="h-5 w-5 text-[#0F766E]" />
          </div>
          <p
            className={`mt-2 text-2xl font-extrabold sm:text-3xl ${
              profitSummary.netProfit >= 0 ? 'text-[#0F766E]' : 'text-[#DC2626]'
            }`}
          >
            {formatCurrency(profitSummary.netProfit)}
          </p>
          <p className="mt-1 text-xs text-[#607D8B]">
            Sales − Cost ({formatCurrency(profitSummary.cogs)}) − Exp
          </p>
        </div>

        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-[#546E7A]">Udhaar Outstanding</span>
            <BookOpen className="h-5 w-5 text-[#F59E0B]" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-amber-700 sm:text-3xl">
            {formatCurrency(currentUdhaar)}
          </p>
          <p className="mt-1 text-xs text-[#607D8B]">
            {customers.filter((c) => c.balance > 0).length} customers pending
          </p>
        </div>
      </div>

      {/* 4 Responsive Charts Grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-base font-extrabold text-[#12332F]">
            Sales Trend ({period === 'weekly' ? 'Previous 7 Days' : 'Previous 30 Days'})
          </h2>
          <TrendLineChart
            data={buckets.map((b) => ({ label: b.label, value: b.sales }))}
            strokeColor="#0F766E"
            emptyLabel="Is period mein abhi tak koi bikri darj nahi hui hai."
          />
        </div>

        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-base font-extrabold text-[#12332F]">Best-Selling Products</h2>
          <HorizontalBarList
            items={bestSelling.map((p) => ({
              label: p.name,
              subLabel: `${formatNumber(p.quantity)} ${p.unit}`,
              value: p.revenue,
            }))}
            barColor="#0F766E"
            emptyLabel="Best-selling items dekhne ke liye kam se kam 1 bill banayein."
          />
        </div>

        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-base font-extrabold text-[#12332F]">Stock Movement</h2>
          <StockMovementBarList items={stockMovement} />
        </div>

        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-base font-extrabold text-[#12332F]">
            Customer Credit Activity
          </h2>
          <DualBarChart
            data={creditActivity.map((c) => ({
              label: c.label,
              primary: c.udhaar,
              secondary: c.paid,
            }))}
            primaryLabel="Udhaar Given"
            secondaryLabel="Payment Received"
          />
        </div>
      </div>

      {/* Recent Bills & Expenses Bottom Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
          <h2 className="mb-2 text-base font-extrabold text-[#12332F]">Recent Bills</h2>
          {bills.length === 0 ? (
            <p className="py-4 text-sm text-[#607D8B]">Abhi tak koi bill nahi bana hai.</p>
          ) : (
            <div className="divide-y divide-[#F1F3F5]">
              {bills.slice(0, 5).map((bill) => (
                <button
                  key={bill.id}
                  type="button"
                  onClick={() => onSelectBill(bill)}
                  className="flex w-full items-center justify-between py-3 text-left"
                >
                  <div>
                    <p className="text-base font-bold text-[#263238]">
                      {bill.invoiceNumber} — {bill.customerName}
                    </p>
                    <p className="text-xs text-[#607D8B]">{formatShortDate(bill.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-extrabold text-[#12332F]">
                      {formatCurrency(bill.finalTotal)}
                    </p>
                    <p className="text-xs font-bold uppercase text-[#0F766E]">
                      {bill.paymentMode}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
          <h2 className="mb-2 text-base font-extrabold text-[#12332F]">Shop Expenses</h2>
          {expenses.length === 0 ? (
            <p className="py-4 text-sm text-[#607D8B]">
              Abhi tak koi kharch darj nahi hai. Upar &ldquo;Add Expense&rdquo; se jodein.
            </p>
          ) : (
            <div className="divide-y divide-[#F1F3F5]">
              {expenses.slice(0, 5).map((exp) => (
                <div key={exp.id} className="flex items-center justify-between py-3 text-base">
                  <div>
                    <p className="font-bold text-[#263238]">{exp.title}</p>
                    <p className="text-xs text-[#607D8B]">{formatShortDate(exp.createdAt)}</p>
                  </div>
                  <span className="font-extrabold text-[#DC2626]">
                    -{formatCurrency(exp.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Expense Modal */}
      {showExpenseForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-3">
          <form
            onSubmit={handleSaveExpense}
            className="w-full max-w-[440px] rounded-t-3xl bg-white p-6 shadow-xl sm:rounded-3xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-extrabold text-[#12332F]">Add Shop Expense</h2>
              <button
                type="button"
                onClick={() => setShowExpenseForm(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F7F8F5]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {expError && (
              <div className="mb-3 rounded-xl border border-red-300 bg-red-50 p-3 text-sm font-semibold text-[#DC2626]">
                {expError}
              </div>
            )}

            <div className="space-y-3.5 text-sm">
              <div>
                <label className="font-bold text-[#12332F]">Expense Details *</label>
                <input
                  type="text"
                  required
                  value={expTitle}
                  onChange={(e) => setExpTitle(e.target.value)}
                  placeholder="e.g. Bijli Bill / Transport"
                  className="mt-1 min-h-[44px] w-full rounded-xl border border-[#CFD8DC] px-3 text-base"
                />
              </div>
              <div>
                <label className="font-bold text-[#12332F]">Amount (₹) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  value={expAmount}
                  onChange={(e) => setExpAmount(e.target.value)}
                  className="mt-1 min-h-[44px] w-full rounded-xl border border-[#CFD8DC] px-3 text-base"
                />
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setShowExpenseForm(false)}
                className="min-h-[48px] rounded-xl border border-[#CFD8DC] text-base font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="min-h-[48px] rounded-xl bg-[#0F766E] text-base font-bold text-white"
              >
                Save Expense
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
