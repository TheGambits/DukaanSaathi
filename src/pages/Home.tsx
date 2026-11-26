import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  IndianRupee,
  Package,
  PlusCircle,
  ReceiptText,
  Wallet,
} from 'lucide-react';
import type {
  Bill,
  Customer,
  NavTab,
  PaymentRecord,
  Product,
  ShopProfile,
  VoiceLang,
} from '../types';
import {
  formatCurrency,
  formatNumber,
  formatShortDate,
  formatUnitLabel,
  isLowStock,
  isToday,
} from '../lib/formatting';
import { VoiceInput } from '../components/VoiceInput';

interface HomePageProps {
  shop: ShopProfile;
  products: Product[];
  customers: Customer[];
  bills: Bill[];
  payments: PaymentRecord[];
  onChangeVoiceLang: (lang: VoiceLang) => void;
  onParseInput: (text: string) => void;
  onNavigate: (tab: NavTab) => void;
  onOpenStockLowFilter: () => void;
  onOpenAddProduct: () => void;
  onOpenQuickNewBill: () => void;
  onSelectBill: (bill: Bill) => void;
}

export function HomePage({
  shop,
  products,
  customers,
  bills,
  payments,
  onChangeVoiceLang,
  onParseInput,
  onNavigate,
  onOpenStockLowFilter,
  onOpenAddProduct,
  onOpenQuickNewBill,
  onSelectBill,
}: HomePageProps) {
  const firstName = shop.owner.split(' ')[0] || shop.owner;

  const todaysSales = bills
    .filter((b) => isToday(b.createdAt))
    .reduce((sum, b) => sum + b.finalTotal, 0);

  const totalUdhaar = customers.reduce((sum, c) => sum + c.balance, 0);
  const lowStockProducts = products.filter(isLowStock);

  return (
    <div className="space-y-6">
      {/* Greeting Banner */}
      <section className="flex flex-col justify-between gap-4 rounded-2xl bg-[#12332F] p-5 text-white shadow-sm sm:flex-row sm:items-center sm:p-6">
        <div>
          <h1 className="text-2xl font-extrabold sm:text-3xl">Namaste, {firstName} ji</h1>
          <p className="mt-1 text-base font-medium text-emerald-100/90">
            {shop.name} • {shop.location}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onOpenQuickNewBill}
            className="flex min-h-[46px] items-center gap-2 rounded-xl bg-[#F59E0B] px-4 py-2.5 text-sm font-extrabold text-[#12332F] hover:bg-[#F59E0B]/90"
          >
            <PlusCircle className="h-4 w-4" />
            Naya Bill
          </button>
          <button
            type="button"
            onClick={() => onNavigate('udhaar')}
            className="flex min-h-[46px] items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-bold text-white hover:bg-white/20"
          >
            <Wallet className="h-4 w-4" />
            Payment Mili
          </button>
        </div>
      </section>

      {/* Top 4 Summary Cards */}
      <section aria-label="Shop Summary" className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <button
          type="button"
          onClick={() => onNavigate('bills')}
          className="rounded-2xl border border-[#E5E7EB] bg-white p-4 text-left shadow-sm transition-colors hover:border-[#0F766E]"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-[#546E7A]">Aaj ki Bikri</span>
            <IndianRupee className="h-5 w-5 text-[#0F766E]" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-[#12332F] sm:text-3xl">
            {formatCurrency(todaysSales)}
          </p>
          <p className="mt-1 text-xs text-[#607D8B]">
            {bills.filter((b) => isToday(b.createdAt)).length} bills today
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('udhaar')}
          className="rounded-2xl border border-[#E5E7EB] bg-white p-4 text-left shadow-sm transition-colors hover:border-[#F59E0B]"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-[#546E7A]">Total Udhaar</span>
            <BookOpen className="h-5 w-5 text-[#F59E0B]" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-amber-700 sm:text-3xl">
            {formatCurrency(totalUdhaar)}
          </p>
          <p className="mt-1 text-xs text-[#607D8B]">
            {customers.filter((c) => c.balance > 0).length} customers pending
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('stock')}
          className="rounded-2xl border border-[#E5E7EB] bg-white p-4 text-left shadow-sm transition-colors hover:border-[#0F766E]"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-[#546E7A]">Total Products</span>
            <Package className="h-5 w-5 text-[#0F766E]" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-[#12332F] sm:text-3xl">
            {products.length}
          </p>
          <p className="mt-1 text-xs text-[#607D8B]">Active inventory items</p>
        </button>

        <button
          type="button"
          onClick={onOpenStockLowFilter}
          className={`rounded-2xl border p-4 text-left shadow-sm transition-colors ${
            lowStockProducts.length > 0
              ? 'border-red-300 bg-red-50/70 hover:border-[#DC2626]'
              : 'border-[#E5E7EB] bg-white hover:border-[#0F766E]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-[#546E7A]">Kam Stock</span>
            <AlertTriangle
              className={`h-5 w-5 ${
                lowStockProducts.length > 0 ? 'text-[#DC2626]' : 'text-[#0F766E]'
              }`}
            />
          </div>
          <p
            className={`mt-2 text-2xl font-extrabold sm:text-3xl ${
              lowStockProducts.length > 0 ? 'text-[#DC2626]' : 'text-[#12332F]'
            }`}
          >
            {lowStockProducts.length}
          </p>
          <p className="mt-1 text-xs text-[#607D8B]">Items at or below reorder</p>
        </button>
      </section>

      {/* Main Voice + Text Billing Card */}
      <VoiceInput
        voiceLang={shop.voiceLang}
        onChangeVoiceLang={onChangeVoiceLang}
        onSubmitText={onParseInput}
      />

      {/* Quick Actions Strip */}
      <section aria-label="Quick Actions">
        <h2 className="mb-3 text-base font-extrabold text-[#12332F]">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <button
            type="button"
            onClick={onOpenQuickNewBill}
            className="flex min-h-[56px] items-center justify-center gap-2 rounded-2xl border border-[#E5E7EB] bg-white px-4 py-3 text-base font-bold text-[#12332F] shadow-sm hover:border-[#0F766E]"
          >
            <ReceiptText className="h-5 w-5 text-[#0F766E]" />
            Naya Bill
          </button>
          <button
            type="button"
            onClick={onOpenAddProduct}
            className="flex min-h-[56px] items-center justify-center gap-2 rounded-2xl border border-[#E5E7EB] bg-white px-4 py-3 text-base font-bold text-[#12332F] shadow-sm hover:border-[#0F766E]"
          >
            <PlusCircle className="h-5 w-5 text-[#0F766E]" />
            Samaan Jodein
          </button>
          <button
            type="button"
            onClick={() => onNavigate('udhaar')}
            className="flex min-h-[56px] items-center justify-center gap-2 rounded-2xl border border-[#E5E7EB] bg-white px-4 py-3 text-base font-bold text-[#12332F] shadow-sm hover:border-[#F59E0B]"
          >
            <IndianRupee className="h-5 w-5 text-[#F59E0B]" />
            Payment Mili
          </button>
          <button
            type="button"
            onClick={() => onNavigate('stock')}
            className="flex min-h-[56px] items-center justify-center gap-2 rounded-2xl border border-[#E5E7EB] bg-white px-4 py-3 text-base font-bold text-[#12332F] shadow-sm hover:border-[#0F766E]"
          >
            <Package className="h-5 w-5 text-[#0F766E]" />
            Stock Dekhein
          </button>
        </div>
      </section>

      {/* Bottom 3-Column Operational Feed (Desktop) / Stacked (Mobile) */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {/* Recent Bills */}
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-extrabold text-[#12332F]">Recent Bills</h3>
            <button
              type="button"
              onClick={() => onNavigate('bills')}
              className="inline-flex items-center gap-1 text-sm font-bold text-[#0F766E]"
            >
              View All <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {bills.length === 0 ? (
            <div className="rounded-xl bg-[#F7F8F5] p-5 text-center text-sm text-[#607D8B]">
              Abhi tak koi bill nahi bana hai. Upar bolkar ya type karke pehla bill banayein.
            </div>
          ) : (
            <div className="divide-y divide-[#F1F3F5]">
              {bills.slice(0, 4).map((bill) => (
                <button
                  key={bill.id}
                  type="button"
                  onClick={() => onSelectBill(bill)}
                  className="flex w-full items-center justify-between py-3 text-left hover:bg-[#F7F8F5]/60"
                >
                  <div className="min-w-0 pr-2">
                    <p className="truncate text-base font-bold text-[#263238]">
                      {bill.invoiceNumber} • {bill.customerName}
                    </p>
                    <p className="text-xs text-[#607D8B]">{formatShortDate(bill.createdAt)}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-base font-extrabold text-[#12332F]">
                      {formatCurrency(bill.finalTotal)}
                    </p>
                    <span className="text-xs font-bold uppercase text-[#0F766E]">
                      {bill.paymentMode}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Low Stock Alerts */}
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-extrabold text-[#12332F]">Low Stock Alerts</h3>
            <button
              type="button"
              onClick={onOpenStockLowFilter}
              className="inline-flex items-center gap-1 text-sm font-bold text-[#DC2626]"
            >
              Manage Stock <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {lowStockProducts.length === 0 ? (
            <div className="rounded-xl bg-[#F7F8F5] p-5 text-center text-sm text-[#0F766E]">
              Sabhi items ka stock paryapt hai.
            </div>
          ) : (
            <div className="space-y-2.5">
              {lowStockProducts.slice(0, 4).map((prod) => (
                <button
                  key={prod.id}
                  type="button"
                  onClick={onOpenStockLowFilter}
                  className="flex w-full items-center justify-between rounded-xl border border-red-200 bg-red-50/70 px-3.5 py-2.5 text-left"
                >
                  <div>
                    <p className="text-base font-bold text-[#263238]">
                      {prod.name}{' '}
                      <span className="text-sm font-medium text-[#546E7A]">({prod.hindiName})</span>
                    </p>
                    <p className="text-xs text-[#607D8B]">
                      Reorder level: {formatNumber(prod.reorderLevel)} {prod.unit}
                    </p>
                  </div>
                  <span className="rounded-lg bg-[#DC2626] px-2.5 py-1 text-xs font-bold text-white">
                    {formatNumber(prod.stock)} {formatUnitLabel(prod.unit, prod.stock)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Recent Payments */}
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm md:col-span-2 xl:col-span-1">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-extrabold text-[#12332F]">Recent Payments</h3>
            <button
              type="button"
              onClick={() => onNavigate('udhaar')}
              className="inline-flex items-center gap-1 text-sm font-bold text-[#0F766E]"
            >
              Udhaar Khata <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {payments.length === 0 ? (
            <div className="rounded-xl bg-[#F7F8F5] p-5 text-center text-sm text-[#607D8B]">
              Abhi tak koi Udhaar payment receive record nahi hua hai.
            </div>
          ) : (
            <div className="divide-y divide-[#F1F3F5]">
              {payments.slice(0, 4).map((pay) => (
                <div key={pay.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-base font-bold text-[#263238]">{pay.customerName}</p>
                    <p className="text-xs text-[#607D8B]">
                      {formatShortDate(pay.createdAt)} • {pay.mode.toUpperCase()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-extrabold text-[#0F766E]">
                      +{formatCurrency(pay.amount)}
                    </p>
                    <p className="text-xs text-[#607D8B]">
                      Baaki: {formatCurrency(pay.newBalance)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
