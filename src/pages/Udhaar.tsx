import { useMemo, useState } from 'react';
import {
  BookOpen,
  History,
  IndianRupee,
  MessageCircle,
  Plus,
  Users,
  X,
} from 'lucide-react';
import type { Bill, Customer, PaymentRecord, ShopProfile } from '../types';
import { formatCurrency, formatDateTime, formatShortDate, round2 } from '../lib/formatting';
import { buildUdhaarReminderUrl } from '../lib/whatsapp';
import {
  buildPeriodBuckets,
  getPeriodDays,
  isWithinLastDays,
  type PeriodKind,
} from '../lib/analytics';
import { DualBarChart, HorizontalBarList, TrendLineChart } from '../components/Charts';

interface UdhaarPageProps {
  customers: Customer[];
  bills: Bill[];
  payments: PaymentRecord[];
  shop: ShopProfile;
  onRecordPayment: (payload: {
    customerId: string;
    amount: number;
    mode: 'cash' | 'upi';
    note?: string;
  }) => void;
  onAddCustomer: (name: string, phone?: string, openingBalance?: number) => void;
}

export function UdhaarPage({
  customers,
  bills,
  payments,
  shop,
  onRecordPayment,
  onAddCustomer,
}: UdhaarPageProps) {
  const [period, setPeriod] = useState<PeriodKind>('weekly');
  const [payingCustomer, setPayingCustomer] = useState<Customer | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMode, setPayMode] = useState<'cash' | 'upi'>('cash');
  const [payError, setPayError] = useState<string | null>(null);

  const [historyCustomer, setHistoryCustomer] = useState<Customer | null>(null);

  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newBalance, setNewBalance] = useState('0');
  const [addError, setAddError] = useState<string | null>(null);

  const days = getPeriodDays(period);

  const totalOutstanding = round2(customers.reduce((sum, c) => sum + c.balance, 0));
  const pendingCustomersCount = customers.filter((c) => c.balance > 0).length;

  const newUdhaarInPeriod = round2(
    bills
      .filter((b) => isWithinLastDays(b.createdAt, days))
      .reduce((sum, b) => sum + b.outstandingAmount, 0)
  );

  const paymentsInPeriod = round2(
    payments
      .filter((p) => isWithinLastDays(p.createdAt, days))
      .reduce((sum, p) => sum + p.amount, 0)
  );

  const buckets = useMemo(
    () => buildPeriodBuckets(period, bills, payments, [], customers),
    [period, bills, payments, customers]
  );

  const topCustomers = useMemo(
    () =>
      [...customers]
        .filter((c) => c.balance > 0)
        .sort((a, b) => b.balance - a.balance)
        .slice(0, 5)
        .map((c) => ({
          label: c.name,
          subLabel: c.phone ? `+${c.phone}` : 'No phone',
          value: c.balance,
        })),
    [customers]
  );

  const customerSummaries = useMemo(() => {
    return [...customers]
      .map((c) => {
        const custBills = bills.filter((b) => b.customerId === c.id);
        const custPays = payments.filter((p) => p.customerId === c.id);
        const totalUdhaarBilled = round2(
          custBills.reduce((s, b) => s + b.outstandingAmount, 0)
        );
        const totalPaid = round2(custPays.reduce((s, p) => s + p.amount, 0));

        const dates = [
          ...custBills.map((b) => b.createdAt),
          ...custPays.map((p) => p.createdAt),
        ].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

        return {
          customer: c,
          totalUdhaarBilled,
          totalPaid,
          lastTxnDate: dates[0] ?? null,
        };
      })
      .sort((a, b) => b.customer.balance - a.customer.balance);
  }, [customers, bills, payments]);

  const openPaymentModal = (customer: Customer) => {
    setPayingCustomer(customer);
    setPayAmount(customer.balance > 0 ? String(customer.balance) : '');
    setPayMode('cash');
    setPayError(null);
  };

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingCustomer) return;
    setPayError(null);

    try {
      const amount = Number.parseFloat(payAmount);
      onRecordPayment({
        customerId: payingCustomer.id,
        amount,
        mode: payMode,
      });
      setPayingCustomer(null);
    } catch (err) {
      setPayError(err instanceof Error ? err.message : 'Payment save nahi ho saka.');
    }
  };

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    try {
      onAddCustomer(newName, newPhone, Number.parseFloat(newBalance) || 0);
      setNewName('');
      setNewPhone('');
      setNewBalance('0');
      setShowAddCustomer(false);
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Customer add nahi ho saka.');
    }
  };

  const getCustomerHistory = (customerId: string) => {
    const custBills = bills
      .filter((b) => b.customerId === customerId)
      .map((b) => ({
        id: b.id,
        kind: 'bill' as const,
        date: b.createdAt,
        title: `${b.invoiceNumber} (${b.items.length} items)`,
        amount: b.outstandingAmount > 0 ? b.outstandingAmount : b.finalTotal,
        subLabel:
          b.outstandingAmount > 0
            ? `Udhaar: +${formatCurrency(b.outstandingAmount)}`
            : `Paid via ${b.paymentMode.toUpperCase()}`,
      }));

    const custPayments = payments
      .filter((p) => p.customerId === customerId)
      .map((p) => ({
        id: p.id,
        kind: 'payment' as const,
        date: p.createdAt,
        title: `Payment Received (${p.mode.toUpperCase()})`,
        amount: p.amount,
        subLabel: `Baaki: ${formatCurrency(p.newBalance)}`,
      }));

    return [...custBills, ...custPayments].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  };

  return (
    <div className="space-y-6">
      {/* Header + Period Tabs + Add Customer */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-[#12332F]">Udhaar Khata</h1>
          <p className="text-base text-[#546E7A]">
            Grahakon ka baaki hisaab, weekly/monthly analytics aur WhatsApp reminders.
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
              WEEKLY
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
              MONTHLY
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setAddError(null);
              setShowAddCustomer(true);
            }}
            className="flex min-h-[46px] items-center gap-1.5 rounded-xl bg-[#0F766E] px-4 text-sm font-bold text-white shadow-sm hover:bg-[#12332F]"
          >
            <Plus className="h-4 w-4" />
            Add Customer
          </button>
        </div>
      </div>

      {/* Top 4 Financial Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <div className="rounded-2xl bg-[#12332F] p-4 text-white shadow-sm">
          <p className="text-sm font-semibold text-emerald-100/80">Total Outstanding</p>
          <p className="mt-2 text-2xl font-extrabold text-[#F59E0B] sm:text-3xl">
            {formatCurrency(totalOutstanding)}
          </p>
          <p className="mt-1 text-xs text-emerald-100/75">Current total baaki</p>
        </div>

        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
          <p className="text-sm font-bold text-[#546E7A]">
            New Udhaar ({period === 'weekly' ? '7d' : '30d'})
          </p>
          <p className="mt-2 text-2xl font-extrabold text-amber-700 sm:text-3xl">
            {formatCurrency(newUdhaarInPeriod)}
          </p>
          <p className="mt-1 text-xs text-[#607D8B]">Previous {days} days</p>
        </div>

        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
          <p className="text-sm font-bold text-[#546E7A]">
            Payment Received ({period === 'weekly' ? '7d' : '30d'})
          </p>
          <p className="mt-2 text-2xl font-extrabold text-[#0F766E] sm:text-3xl">
            {formatCurrency(paymentsInPeriod)}
          </p>
          <p className="mt-1 text-xs text-[#607D8B]">Previous {days} days</p>
        </div>

        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-[#546E7A]">Pending Customers</span>
            <Users className="h-5 w-5 text-[#0F766E]" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-[#12332F] sm:text-3xl">
            {pendingCustomersCount}
          </p>
          <p className="mt-1 text-xs text-[#607D8B]">Out of {customers.length} total</p>
        </div>
      </div>

      {/* 3 Analytics Charts (from actual saved data) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-base font-extrabold text-[#12332F]">
            Udhaar Given vs Payment Received
          </h2>
          <DualBarChart
            data={buckets.map((b) => ({
              label: b.label,
              primary: b.udhaarGiven,
              secondary: b.paymentReceived,
            }))}
            primaryLabel="Udhaar Given"
            secondaryLabel="Payment Received"
          />
        </div>

        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-base font-extrabold text-[#12332F]">
            Outstanding Balance Trend
          </h2>
          <TrendLineChart
            data={buckets.map((b) => ({
              label: b.label,
              value: b.endingBalance,
            }))}
            strokeColor="#F59E0B"
            emptyLabel="Abhi tak koi outstanding balance nahi hai."
          />
        </div>

        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-base font-extrabold text-[#12332F]">
            Top 5 Customers by Balance
          </h2>
          <HorizontalBarList
            items={topCustomers}
            barColor="#F59E0B"
            emptyLabel="Sabhi customers ka hisaab clear hai."
          />
        </div>
      </div>

      {/* Customer Table (Desktop) + Cards (Mobile) */}
      {customerSummaries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#CFD8DC] bg-white p-10 text-center">
          <BookOpen className="mx-auto h-10 w-10 text-[#90A4AE]" />
          <p className="mt-3 text-base font-bold text-[#12332F]">Koi customer nahi hai</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-sm md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[#E5E7EB] bg-[#F7F8F5] text-xs font-extrabold uppercase tracking-wider text-[#546E7A]">
                    <th className="px-5 py-3.5">Customer Name</th>
                    <th className="px-4 py-3.5">Phone</th>
                    <th className="px-4 py-3.5 text-right">Total Udhaar</th>
                    <th className="px-4 py-3.5 text-right">Payments Received</th>
                    <th className="px-4 py-3.5 text-right">Current Balance</th>
                    <th className="px-4 py-3.5">Last Transaction</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F3F5] text-base">
                  {customerSummaries.map(
                    ({ customer, totalUdhaarBilled, totalPaid, lastTxnDate }) => (
                      <tr key={customer.id} className="hover:bg-[#F7F8F5]/70">
                        <td className="px-5 py-4 font-bold text-[#12332F]">{customer.name}</td>
                        <td className="px-4 py-4 text-sm text-[#546E7A]">
                          {customer.phone ? `+${customer.phone}` : '—'}
                        </td>
                        <td className="px-4 py-4 text-right font-semibold text-[#263238]">
                          {formatCurrency(totalUdhaarBilled)}
                        </td>
                        <td className="px-4 py-4 text-right font-semibold text-[#0F766E]">
                          {formatCurrency(totalPaid)}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <span
                            className={`text-lg font-extrabold ${
                              customer.balance > 0 ? 'text-amber-700' : 'text-[#0F766E]'
                            }`}
                          >
                            {formatCurrency(customer.balance)}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-[#607D8B]">
                          {lastTxnDate ? formatShortDate(lastTxnDate) : 'Opening Balance'}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openPaymentModal(customer)}
                              disabled={customer.balance <= 0}
                              className="inline-flex min-h-[40px] items-center gap-1 rounded-xl bg-[#0F766E] px-3 text-sm font-bold text-white disabled:opacity-40"
                            >
                              <IndianRupee className="h-4 w-4" />
                              Pay
                            </button>
                            <button
                              type="button"
                              onClick={() => setHistoryCustomer(customer)}
                              aria-label={`History for ${customer.name}`}
                              className="inline-flex min-h-[40px] items-center gap-1 rounded-xl border border-[#CFD8DC] bg-white px-3 text-sm font-bold text-[#12332F]"
                            >
                              <History className="h-4 w-4" />
                            </button>
                            {customer.phone && customer.balance > 0 && (
                              <a
                                href={buildUdhaarReminderUrl(customer, shop)}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={`WhatsApp reminder to ${customer.name}`}
                                className="inline-flex min-h-[40px] items-center gap-1 rounded-xl bg-[#F59E0B] px-3 text-sm font-bold text-[#12332F]"
                              >
                                <MessageCircle className="h-4 w-4" />
                                Remind
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="space-y-3 md:hidden">
            {customerSummaries.map(({ customer, lastTxnDate }) => (
              <div
                key={customer.id}
                className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-extrabold text-[#12332F]">{customer.name}</h3>
                    <p className="text-xs text-[#607D8B]">
                      {customer.phone ? `+${customer.phone}` : 'No phone'} •{' '}
                      {lastTxnDate ? formatShortDate(lastTxnDate) : 'Opening Balance'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-[#607D8B]">Current Balance</p>
                    <p
                      className={`text-xl font-extrabold ${
                        customer.balance > 0 ? 'text-amber-700' : 'text-[#0F766E]'
                      }`}
                    >
                      {formatCurrency(customer.balance)}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2 border-t border-[#F1F3F5] pt-3">
                  <button
                    type="button"
                    onClick={() => openPaymentModal(customer)}
                    disabled={customer.balance <= 0}
                    className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#0F766E] px-3 text-sm font-bold text-white disabled:opacity-40"
                  >
                    <IndianRupee className="h-4 w-4" />
                    Record Payment
                  </button>

                  <button
                    type="button"
                    onClick={() => setHistoryCustomer(customer)}
                    className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-[#CFD8DC] bg-white px-3 text-sm font-bold text-[#12332F]"
                  >
                    <History className="h-4 w-4" />
                    History
                  </button>

                  {customer.phone && customer.balance > 0 && (
                    <a
                      href={buildUdhaarReminderUrl(customer, shop)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-[#F59E0B] px-3 text-sm font-bold text-[#12332F]"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Reminder
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Record Payment Modal */}
      {payingCustomer && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-3">
          <form
            onSubmit={handleSavePayment}
            className="w-full max-w-[440px] rounded-t-3xl bg-white p-6 shadow-xl sm:rounded-3xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-[#12332F]">Record Payment</h2>
                <p className="text-sm text-[#546E7A]">
                  {payingCustomer.name} • Baaki: {formatCurrency(payingCustomer.balance)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPayingCustomer(null)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F7F8F5]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {payError && (
              <div className="mb-3 rounded-xl border border-red-300 bg-red-50 p-3 text-sm font-semibold text-[#DC2626]">
                {payError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-sm font-bold text-[#12332F]">Amount (₹)</label>
                <input
                  type="number"
                  required
                  min="1"
                  max={payingCustomer.balance}
                  step="any"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="mt-1 min-h-[48px] w-full rounded-xl border border-[#CFD8DC] px-3 text-lg font-extrabold text-[#12332F]"
                />
              </div>

              <div>
                <span className="text-sm font-bold text-[#12332F]">Mode</span>
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                  {(['cash', 'upi'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPayMode(m)}
                      className={`min-h-[46px] rounded-xl border text-sm font-bold uppercase ${
                        payMode === m
                          ? 'border-[#0F766E] bg-[#0F766E] text-white'
                          : 'border-[#CFD8DC] bg-white text-[#455A64]'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPayingCustomer(null)}
                className="min-h-[48px] rounded-xl border border-[#CFD8DC] text-base font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="min-h-[48px] rounded-xl bg-[#0F766E] text-base font-bold text-white"
              >
                Save Payment
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Customer History Modal */}
      {historyCustomer && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-3">
          <div className="max-h-[85vh] w-full max-w-[480px] overflow-y-auto rounded-t-3xl bg-white p-6 shadow-xl sm:rounded-3xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-[#12332F]">
                  {historyCustomer.name} — History
                </h2>
                <p className="text-sm text-[#546E7A]">
                  Current Balance: {formatCurrency(historyCustomer.balance)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setHistoryCustomer(null)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F7F8F5]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {(() => {
              const entries = getCustomerHistory(historyCustomer.id);
              if (entries.length === 0) {
                return (
                  <p className="py-8 text-center text-sm text-[#607D8B]">
                    Opening balance {formatCurrency(historyCustomer.balance)} ke baad abhi tak koi
                    naya bill ya payment record nahi hai.
                  </p>
                );
              }
              return (
                <div className="divide-y divide-[#F1F3F5]">
                  {entries.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between py-3">
                      <div>
                        <p className="text-base font-bold text-[#263238]">{entry.title}</p>
                        <p className="text-xs text-[#607D8B]">{formatDateTime(entry.date)}</p>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-base font-extrabold ${
                            entry.kind === 'payment' ? 'text-[#0F766E]' : 'text-amber-700'
                          }`}
                        >
                          {entry.kind === 'payment' ? '-' : '+'}
                          {formatCurrency(entry.amount)}
                        </p>
                        <p className="text-xs text-[#607D8B]">{entry.subLabel}</p>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {showAddCustomer && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-3">
          <form
            onSubmit={handleCreateCustomer}
            className="w-full max-w-[440px] rounded-t-3xl bg-white p-6 shadow-xl sm:rounded-3xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-extrabold text-[#12332F]">Add New Customer</h2>
              <button
                type="button"
                onClick={() => setShowAddCustomer(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F7F8F5]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {addError && (
              <div className="mb-3 rounded-xl border border-red-300 bg-red-50 p-3 text-sm font-semibold text-[#DC2626]">
                {addError}
              </div>
            )}

            <div className="space-y-3.5 text-sm">
              <div>
                <label className="font-bold text-[#12332F]">Name *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Suresh"
                  className="mt-1 min-h-[44px] w-full rounded-xl border border-[#CFD8DC] px-3 text-base"
                />
              </div>
              <div>
                <label className="font-bold text-[#12332F]">Phone (with 91)</label>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="e.g. 919876543210"
                  className="mt-1 min-h-[44px] w-full rounded-xl border border-[#CFD8DC] px-3 text-base"
                />
              </div>
              <div>
                <label className="font-bold text-[#12332F]">Opening Balance (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={newBalance}
                  onChange={(e) => setNewBalance(e.target.value)}
                  className="mt-1 min-h-[44px] w-full rounded-xl border border-[#CFD8DC] px-3 text-base"
                />
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setShowAddCustomer(false)}
                className="min-h-[48px] rounded-xl border border-[#CFD8DC] text-base font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="min-h-[48px] rounded-xl bg-[#0F766E] text-base font-bold text-white"
              >
                Save Customer
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
