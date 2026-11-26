import { useState } from 'react';
import { ChevronRight, Eye, ReceiptText, Search } from 'lucide-react';
import type { Bill, PaymentMode } from '../types';
import { formatCurrency, formatDateTime, isToday } from '../lib/formatting';
import { isWithinLastDays } from '../lib/analytics';

interface BillsPageProps {
  bills: Bill[];
  externalSearch?: string;
  onSelectBill: (bill: Bill) => void;
}

type DateFilter = 'all' | 'today' | '7d' | '30d';
type PaymentFilter = 'all' | PaymentMode;

export function BillsPage({ bills, externalSearch = '', onSelectBill }: BillsPageProps) {
  const [search, setSearch] = useState(externalSearch);
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('all');

  const todaysBills = bills.filter((b) => isToday(b.createdAt));
  const todaysTotal = todaysBills.reduce((s, b) => s + b.finalTotal, 0);
  const todaysUdhaar = todaysBills.reduce((s, b) => s + b.outstandingAmount, 0);

  const q = (search || externalSearch).trim().toLowerCase();

  const filteredBills = [...bills]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .filter((bill) => {
      if (dateFilter === 'today' && !isToday(bill.createdAt)) return false;
      if (dateFilter === '7d' && !isWithinLastDays(bill.createdAt, 7)) return false;
      if (dateFilter === '30d' && !isWithinLastDays(bill.createdAt, 30)) return false;
      if (paymentFilter !== 'all' && bill.paymentMode !== paymentFilter) return false;
      if (!q) return true;
      return (
        bill.invoiceNumber.toLowerCase().includes(q) ||
        bill.customerName.toLowerCase().includes(q) ||
        bill.items.some((i) => i.productName.toLowerCase().includes(q))
      );
    });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#12332F]">Bills &amp; Invoices</h1>
        <p className="text-base text-[#546E7A]">
          Saved invoices dekhein, WhatsApp par share karein ya print/PDF nikalein.
        </p>
      </div>

      {/* Today's Bill Summary Banner */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
          <p className="text-sm font-bold text-[#546E7A]">Today&apos;s Bills</p>
          <p className="mt-1 text-2xl font-extrabold text-[#12332F]">{todaysBills.length}</p>
        </div>
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
          <p className="text-sm font-bold text-[#546E7A]">Today&apos;s Billing Total</p>
          <p className="mt-1 text-2xl font-extrabold text-[#0F766E]">
            {formatCurrency(todaysTotal)}
          </p>
        </div>
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
          <p className="text-sm font-bold text-[#546E7A]">Today&apos;s Udhaar Billed</p>
          <p className="mt-1 text-2xl font-extrabold text-amber-700">
            {formatCurrency(todaysUdhaar)}
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1 lg:max-w-sm">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#607D8B]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoice no., customer or item..."
            className="min-h-[46px] w-full rounded-xl border border-[#CFD8DC] bg-[#F7F8F5] pl-10 pr-3 text-base focus:border-[#0F766E] focus:bg-white focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            aria-label="Date filter"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as DateFilter)}
            className="min-h-[44px] rounded-xl border border-[#CFD8DC] bg-[#F7F8F5] px-3 text-sm font-bold text-[#263238]"
          >
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>

          <select
            aria-label="Payment filter"
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value as PaymentFilter)}
            className="min-h-[44px] rounded-xl border border-[#CFD8DC] bg-[#F7F8F5] px-3 text-sm font-bold text-[#263238]"
          >
            <option value="all">All Payments</option>
            <option value="cash">Cash</option>
            <option value="upi">UPI</option>
            <option value="udhaar">Udhaar</option>
          </select>
        </div>
      </div>

      {filteredBills.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#CFD8DC] bg-white p-10 text-center">
          <ReceiptText className="mx-auto h-11 w-11 text-[#90A4AE]" />
          <p className="mt-3 text-base font-bold text-[#12332F]">
            {bills.length === 0 ? 'Abhi tak koi bill nahi bana' : 'Filter se koi bill match nahi hua'}
          </p>
          <p className="mt-1 text-sm text-[#607D8B]">
            {bills.length === 0
              ? 'Aaj ka Hisaab par bolkar ya type karke apna pehla bill banayein.'
              : 'Search ya filter reset karke dekhein.'}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Invoice Table */}
          <div className="hidden overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-sm md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[#E5E7EB] bg-[#F7F8F5] text-xs font-extrabold uppercase tracking-wider text-[#546E7A]">
                    <th className="px-5 py-3.5">Invoice No.</th>
                    <th className="px-4 py-3.5">Customer</th>
                    <th className="px-4 py-3.5">Date &amp; Time</th>
                    <th className="px-4 py-3.5">Items</th>
                    <th className="px-4 py-3.5">Payment</th>
                    <th className="px-4 py-3.5 text-right">Amount</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F3F5] text-base">
                  {filteredBills.map((bill) => (
                    <tr
                      key={bill.id}
                      onClick={() => onSelectBill(bill)}
                      className="cursor-pointer transition-colors hover:bg-[#F7F8F5]"
                    >
                      <td className="px-5 py-4 font-extrabold text-[#12332F]">
                        {bill.invoiceNumber}
                      </td>
                      <td className="px-4 py-4 font-semibold text-[#263238]">
                        {bill.customerName}
                      </td>
                      <td className="px-4 py-4 text-sm text-[#546E7A]">
                        {formatDateTime(bill.createdAt)}
                      </td>
                      <td className="px-4 py-4 text-sm text-[#455A64]">
                        {bill.items.map((i) => i.productName).join(', ')}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase ${
                            bill.paymentMode === 'udhaar'
                              ? 'bg-[#F59E0B]/20 text-[#12332F]'
                              : 'bg-[#0F766E]/10 text-[#0F766E]'
                          }`}
                        >
                          {bill.paymentMode}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <p className="text-lg font-extrabold text-[#12332F]">
                          {formatCurrency(bill.finalTotal)}
                        </p>
                        {bill.outstandingAmount > 0 && (
                          <p className="text-xs font-semibold text-amber-700">
                            Baaki: {formatCurrency(bill.outstandingAmount)}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectBill(bill);
                          }}
                          className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-[#CFD8DC] bg-white px-3.5 text-sm font-bold text-[#12332F] hover:border-[#0F766E]"
                        >
                          <Eye className="h-4 w-4 text-[#0F766E]" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Invoice Cards */}
          <div className="space-y-3 md:hidden">
            {filteredBills.map((bill) => (
              <button
                key={bill.id}
                type="button"
                onClick={() => onSelectBill(bill)}
                className="flex w-full items-center justify-between gap-3 rounded-2xl border border-[#E5E7EB] bg-white p-4 text-left shadow-sm active:scale-[0.99]"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-extrabold text-[#12332F]">
                      {bill.invoiceNumber}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${
                        bill.paymentMode === 'udhaar'
                          ? 'bg-[#F59E0B]/20 text-[#12332F]'
                          : 'bg-[#0F766E]/10 text-[#0F766E]'
                      }`}
                    >
                      {bill.paymentMode}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-base font-semibold text-[#263238]">
                    {bill.customerName}
                  </p>
                  <p className="text-xs text-[#607D8B]">
                    {formatDateTime(bill.createdAt)} • {bill.items.length} items
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="text-lg font-extrabold text-[#12332F]">
                      {formatCurrency(bill.finalTotal)}
                    </p>
                    {bill.outstandingAmount > 0 && (
                      <p className="text-xs font-semibold text-amber-700">
                        Baaki: {formatCurrency(bill.outstandingAmount)}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="h-5 w-5 text-[#90A4AE]" />
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
