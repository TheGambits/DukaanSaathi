import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Plus,
  Trash2,
  UserPlus,
  X,
} from 'lucide-react';
import type {
  Customer,
  ParsedTransaction,
  PaymentMode,
  Product,
  UnitType,
} from '../types';
import { calculateBillTotals, calculateLineItem } from '../lib/billing';
import { formatCurrency, formatNumber, round2 } from '../lib/formatting';

interface EditableRow {
  tempId: string;
  productId: string | null;
  rawProductName: string;
  quantity: number;
  unit: UnitType;
  isUnknown: boolean;
}

interface TransactionConfirmationProps {
  parsed: ParsedTransaction;
  products: Product[];
  customers: Customer[];
  onCancel: () => void;
  onAddCustomer: (name: string, phone?: string) => Customer;
  onConfirmSale: (payload: {
    items: Array<{ productId: string | null; quantity: number; unit: UnitType }>;
    customerId: string | null;
    paymentMode: PaymentMode;
    amountPaid: number;
    rawInput: string;
  }) => void;
  onConfirmPayment: (payload: {
    customerId: string;
    amount: number;
    mode: 'cash' | 'upi';
    note?: string;
  }) => void;
}

export function TransactionConfirmation({
  parsed,
  products,
  customers,
  onCancel,
  onAddCustomer,
  onConfirmSale,
  onConfirmPayment,
}: TransactionConfirmationProps) {
  // Sale state
  const [rows, setRows] = useState<EditableRow[]>(() =>
    parsed.items.length > 0
      ? parsed.items.map((item) => ({
          tempId: item.tempId,
          productId: item.productId,
          rawProductName: item.rawProductName,
          quantity: item.quantity,
          unit: item.unit,
          isUnknown: item.isUnknown,
        }))
      : products[0]
        ? [
            {
              tempId: `row-${Date.now()}`,
              productId: products[0].id,
              rawProductName: products[0].name,
              quantity: 1,
              unit: products[0].unit,
              isUnknown: false,
            },
          ]
        : []
  );

  const [customerId, setCustomerId] = useState<string>(parsed.matchedCustomerId ?? '');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>(parsed.paymentMode);

  // Compute initial total so Cash/UPI defaults to full payment and Udhaar defaults to 0
  const initialTotal = useMemo(() => {
    return parsed.items.reduce((sum, item) => {
      if (!item.productId) return sum;
      const p = products.find((pr) => pr.id === item.productId);
      if (!p) return sum;
      return round2(sum + p.price * item.quantity);
    }, 0);
  }, [parsed.items, products]);

  const [amountPaid, setAmountPaid] = useState<number>(() =>
    parsed.paymentMode === 'udhaar' ? 0 : initialTotal
  );
  const [paidManuallyEdited, setPaidManuallyEdited] = useState(false);

  // Payment-receipt state (e.g. "Ramesh se 500 rupaye mile")
  const [receiptAmount, setReceiptAmount] = useState<string>(
    parsed.paymentAmount ? String(parsed.paymentAmount) : ''
  );
  const [receiptMode, setReceiptMode] = useState<'cash' | 'upi'>(
    parsed.paymentMode === 'upi' ? 'upi' : 'cash'
  );

  // Inline quick customer creation
  const [showNewCustomer, setShowNewCustomer] = useState(
    Boolean(parsed.customerName && !parsed.matchedCustomerId)
  );
  const [newCustomerName, setNewCustomerName] = useState(parsed.customerName ?? '');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedCustomer = customers.find((c) => c.id === customerId) ?? null;

  // Live computed line items and GST breakdown
  const computedLines = useMemo(() => {
    return rows.map((row) => {
      const product = row.productId ? products.find((p) => p.id === row.productId) ?? null : null;
      const billItem = product ? calculateLineItem(product, row.quantity, row.unit) : null;
      return { row, product, billItem };
    });
  }, [rows, products]);

  const totals = useMemo(() => {
    const validItems = computedLines
      .map((l) => l.billItem)
      .filter((b): b is NonNullable<typeof b> => b !== null);
    return calculateBillTotals(validItems);
  }, [computedLines]);

  const effectivePaid = paidManuallyEdited
    ? amountPaid
    : paymentMode === 'udhaar'
      ? 0
      : totals.finalTotal;

  const billOutstanding = Math.max(0, round2(totals.finalTotal - effectivePaid));
  const previousBalance = selectedCustomer ? selectedCustomer.balance : 0;
  const projectedBalance = selectedCustomer
    ? round2(previousBalance + billOutstanding)
    : billOutstanding;

  const handlePaymentModeChange = (mode: PaymentMode) => {
    setPaymentMode(mode);
    setPaidManuallyEdited(false);
    setAmountPaid(mode === 'udhaar' ? 0 : totals.finalTotal);
    setError(null);
  };

  const handleCreateQuickCustomer = () => {
    try {
      setError(null);
      const created = onAddCustomer(newCustomerName, newCustomerPhone);
      setCustomerId(created.id);
      setShowNewCustomer(false);
      setNewCustomerName('');
      setNewCustomerPhone('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Customer add nahi ho saka.');
    }
  };

  const handleRowProductChange = (tempId: string, newProductId: string) => {
    const prod = products.find((p) => p.id === newProductId);
    setRows((prev) =>
      prev.map((r) =>
        r.tempId === tempId
          ? {
              ...r,
              productId: newProductId || null,
              unit: prod ? prod.unit : r.unit,
              isUnknown: !newProductId,
            }
          : r
      )
    );
    setError(null);
  };

  const handleRowQuantityChange = (tempId: string, qty: number) => {
    const safe = Number.isFinite(qty) ? Math.max(0, round2(qty)) : 0;
    setRows((prev) => prev.map((r) => (r.tempId === tempId ? { ...r, quantity: safe } : r)));
    setError(null);
  };

  const handleRemoveRow = (tempId: string) => {
    setRows((prev) => prev.filter((r) => r.tempId !== tempId));
    setError(null);
  };

  const handleAddEmptyRow = () => {
    const first = products[0];
    setRows((prev) => [
      ...prev,
      {
        tempId: `row-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        productId: first ? first.id : null,
        rawProductName: first ? first.name : '',
        quantity: 1,
        unit: first ? first.unit : 'piece',
        isUnknown: !first,
      },
    ]);
  };

  const handleSaveSale = () => {
    if (isSubmitting) return;
    setError(null);
    try {
      setIsSubmitting(true);
      onConfirmSale({
        items: rows.map((r) => ({
          productId: r.productId,
          quantity: r.quantity,
          unit: r.unit,
        })),
        customerId: customerId || null,
        paymentMode,
        amountPaid: effectivePaid,
        rawInput: parsed.rawInput,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bill save nahi ho saka.');
      setIsSubmitting(false);
    }
  };

  const handleSavePaymentReceipt = () => {
    if (isSubmitting) return;
    setError(null);
    try {
      if (!customerId) {
        throw new Error('Kripya customer select karein.');
      }
      const amt = Number.parseFloat(receiptAmount);
      if (!Number.isFinite(amt) || amt <= 0) {
        throw new Error('Sahi payment amount darj karein.');
      }
      setIsSubmitting(true);
      onConfirmPayment({
        customerId,
        amount: amt,
        mode: receiptMode,
        note: parsed.rawInput,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment save nahi ho saka.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 sm:items-center sm:p-3">
      <div className="max-h-[92vh] w-full max-w-[480px] overflow-y-auto rounded-t-3xl bg-[#F7F5F0] p-4 shadow-2xl sm:rounded-3xl sm:p-5">
        {/* Header */}
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-[#12332F]">
              {parsed.kind === 'payment' ? 'Payment Receipt Confirm Karein' : 'Bill Confirm Karein'}
            </h2>
            <p className="text-xs text-[#6B7280]">“{parsed.rawInput}”</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cancel"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#1F2937] shadow-sm"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Parser warnings */}
        {parsed.warnings.length > 0 && (
          <div className="mb-3 space-y-1 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
            {parsed.warnings.map((w, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                <span>{w}</span>
              </div>
            ))}
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div className="mb-3 flex items-start gap-2 rounded-xl border border-red-300 bg-red-50 p-3 text-xs font-semibold text-red-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Customer selector card */}
        <div className="mb-3 rounded-2xl border border-[#E5E0D5] bg-white p-3.5">
          <div className="flex items-center justify-between">
            <label htmlFor="confirm-customer" className="text-xs font-bold text-[#12332F]">
              Customer
            </label>
            <button
              type="button"
              onClick={() => setShowNewCustomer((v) => !v)}
              className="inline-flex items-center gap-1 text-xs font-bold text-[#0F766E]"
            >
              <UserPlus className="h-3.5 w-3.5" />
              {showNewCustomer ? 'Close' : '+ New Customer'}
            </button>
          </div>

          <select
            id="confirm-customer"
            value={customerId}
            onChange={(e) => {
              setCustomerId(e.target.value);
              setError(null);
            }}
            className="mt-1.5 min-h-[44px] w-full rounded-xl border border-[#D8D2C5] bg-[#FAF8F5] px-3 text-sm font-medium text-[#1F2937] focus:border-[#0F766E] focus:outline-none"
          >
            {parsed.kind === 'sale' && <option value="">Walk-in Customer (Cash/UPI)</option>}
            {parsed.kind === 'payment' && <option value="">Select Customer</option>}
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} (Baaki: {formatCurrency(c.balance)})
              </option>
            ))}
          </select>

          {showNewCustomer && (
            <div className="mt-2.5 space-y-2 rounded-xl bg-[#FAF8F5] p-2.5">
              <input
                type="text"
                placeholder="Customer Name"
                value={newCustomerName}
                onChange={(e) => setNewCustomerName(e.target.value)}
                className="min-h-[40px] w-full rounded-lg border border-[#D8D2C5] bg-white px-3 text-sm"
              />
              <div className="flex gap-2">
                <input
                  type="tel"
                  placeholder="Phone (optional)"
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                  className="min-h-[40px] flex-1 rounded-lg border border-[#D8D2C5] bg-white px-3 text-sm"
                />
                <button
                  type="button"
                  onClick={handleCreateQuickCustomer}
                  className="rounded-lg bg-[#0F766E] px-4 text-xs font-bold text-white"
                >
                  Add
                </button>
              </div>
            </div>
          )}
        </div>

        {/* PAYMENT RECEIPT MODE */}
        {parsed.kind === 'payment' ? (
          <div className="space-y-3">
            <div className="rounded-2xl border border-[#E5E0D5] bg-white p-3.5 space-y-3">
              <div>
                <label className="text-xs font-bold text-[#12332F]">Amount Received (₹)</label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={receiptAmount}
                  onChange={(e) => setReceiptAmount(e.target.value)}
                  className="mt-1 min-h-[46px] w-full rounded-xl border border-[#D8D2C5] bg-[#FAF8F5] px-3 text-lg font-extrabold text-[#12332F]"
                />
              </div>

              <div>
                <span className="text-xs font-bold text-[#12332F]">Payment Mode</span>
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                  {(['cash', 'upi'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setReceiptMode(m)}
                      className={`min-h-[44px] rounded-xl border text-sm font-bold uppercase ${
                        receiptMode === m
                          ? 'border-[#0F766E] bg-[#0F766E] text-white'
                          : 'border-[#D8D2C5] bg-white text-[#4B5563]'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {selectedCustomer && (
                <div className="rounded-xl bg-[#F7F5F0] p-3 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[#6B7280]">Current Udhaar:</span>
                    <span className="font-bold">{formatCurrency(selectedCustomer.balance)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-extrabold text-[#0F766E]">
                    <span>New Balance:</span>
                    <span>
                      {formatCurrency(
                        Math.max(
                          0,
                          selectedCustomer.balance - (Number.parseFloat(receiptAmount) || 0)
                        )
                      )}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={onCancel}
                className="min-h-[50px] rounded-2xl border border-[#D8D2C5] bg-white text-sm font-bold text-[#1F2937]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePaymentReceipt}
                disabled={isSubmitting}
                className="flex min-h-[50px] items-center justify-center gap-2 rounded-2xl bg-[#0F766E] text-sm font-bold text-white disabled:opacity-50"
              >
                <CheckCircle2 className="h-4 w-4" />
                Save Payment
              </button>
            </div>
          </div>
        ) : (
          /* SALE MODE */
          <div className="space-y-3">
            {/* Items */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold uppercase tracking-wide text-[#4B5563]">
                  Items ({rows.length})
                </span>
                <button
                  type="button"
                  onClick={handleAddEmptyRow}
                  className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-[#0F766E] shadow-sm"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Item
                </button>
              </div>

              {computedLines.map(({ row, product, billItem }) => {
                const isUnknown = !product;
                const insufficient = product ? row.quantity > product.stock : false;
                return (
                  <div
                    key={row.tempId}
                    className={`rounded-2xl border p-3 ${
                      isUnknown || insufficient
                        ? 'border-red-300 bg-red-50/70'
                        : 'border-[#E5E0D5] bg-white'
                    }`}
                  >
                    {isUnknown && (
                      <p className="mb-1.5 text-[11px] font-bold text-red-700">
                        Unknown item: “{row.rawProductName}” — kripya sahi product chunein ya remove karein
                      </p>
                    )}
                    {insufficient && product && (
                      <p className="mb-1.5 text-[11px] font-bold text-red-700">
                        Stock kam hai! Available: {formatNumber(product.stock)} {product.unit}
                      </p>
                    )}

                    <div className="flex items-center gap-2">
                      <select
                        value={row.productId ?? ''}
                        onChange={(e) => handleRowProductChange(row.tempId, e.target.value)}
                        className="min-h-[42px] flex-1 rounded-xl border border-[#D8D2C5] bg-[#FAF8F5] px-2.5 text-sm font-semibold text-[#1F2937]"
                      >
                        <option value="">-- Product chunein --</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.hindiName}) • {formatCurrency(p.price)}/{p.unit} [Stock: {formatNumber(p.stock)}]
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={() => handleRemoveRow(row.tempId)}
                        aria-label="Remove item"
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-red-200 bg-white text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            handleRowQuantityChange(row.tempId, Math.max(0.5, row.quantity - 0.5))
                          }
                          className="h-9 w-9 rounded-lg border border-[#D8D2C5] bg-white font-bold"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="0.1"
                          step="any"
                          value={row.quantity}
                          onChange={(e) =>
                            handleRowQuantityChange(row.tempId, Number.parseFloat(e.target.value) || 0)
                          }
                          className="h-9 w-16 rounded-lg border border-[#D8D2C5] bg-white text-center text-sm font-bold"
                        />
                        <button
                          type="button"
                          onClick={() => handleRowQuantityChange(row.tempId, row.quantity + 0.5)}
                          className="h-9 w-9 rounded-lg border border-[#D8D2C5] bg-white font-bold"
                        >
                          +
                        </button>
                        <span className="text-xs font-medium text-[#6B7280]">
                          {product ? product.unit : row.unit}
                        </span>
                      </div>

                      <div className="text-right">
                        {billItem ? (
                          <>
                            <p className="text-xs text-[#6B7280]">
                              {formatNumber(billItem.quantity)} × {formatCurrency(billItem.unitPrice)}
                            </p>
                            <p className="text-base font-extrabold text-[#12332F]">
                              {formatCurrency(billItem.lineTotal)}
                            </p>
                          </>
                        ) : (
                          <p className="text-xs font-semibold text-red-600">Select product</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Payment Mode & Amount Paid */}
            <div className="rounded-2xl border border-[#E5E0D5] bg-white p-3.5 space-y-3">
              <div>
                <span className="text-xs font-bold text-[#12332F]">Payment Mode</span>
                <div className="mt-1.5 grid grid-cols-3 gap-2">
                  {(['cash', 'upi', 'udhaar'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => handlePaymentModeChange(mode)}
                      className={`min-h-[42px] rounded-xl border text-xs font-bold uppercase transition-colors ${
                        paymentMode === mode
                          ? mode === 'udhaar'
                            ? 'border-[#F59E0B] bg-[#F59E0B] text-[#12332F]'
                            : 'border-[#0F766E] bg-[#0F766E] text-white'
                          : 'border-[#D8D2C5] bg-white text-[#4B5563]'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="amount-paid-input" className="text-xs font-bold text-[#12332F]">
                  Amount Paid (₹)
                </label>
                <input
                  id="amount-paid-input"
                  type="number"
                  min="0"
                  max={totals.finalTotal}
                  step="any"
                  value={effectivePaid}
                  onChange={(e) => {
                    setPaidManuallyEdited(true);
                    setAmountPaid(Number.parseFloat(e.target.value) || 0);
                    setError(null);
                  }}
                  className="mt-1 min-h-[44px] w-full rounded-xl border border-[#D8D2C5] bg-[#FAF8F5] px-3 text-base font-bold text-[#12332F]"
                />
              </div>
            </div>

            {/* Totals & GST Breakdown */}
            <div className="rounded-2xl border border-[#E5E0D5] bg-white p-3.5 space-y-1.5 text-xs">
              <div className="flex justify-between text-[#4B5563]">
                <span>Taxable Amount</span>
                <span>{formatCurrency(totals.taxableAmount)}</span>
              </div>
              <div className="flex justify-between text-[#4B5563]">
                <span>GST (Inclusive)</span>
                <span>{formatCurrency(totals.gstAmount)}</span>
              </div>
              <div className="flex justify-between border-t border-[#E5E7EB] pt-2 text-lg font-extrabold text-[#12332F]">
                <span>Final Total</span>
                <span>{formatCurrency(totals.finalTotal)}</span>
              </div>

              {(selectedCustomer || billOutstanding > 0) && (
                <div className="mt-2 space-y-1 rounded-xl bg-[#FAF8F5] p-2.5 text-xs">
                  {selectedCustomer && (
                    <div className="flex justify-between text-[#4B5563]">
                      <span>Existing {selectedCustomer.name} Balance:</span>
                      <span className="font-semibold">{formatCurrency(previousBalance)}</span>
                    </div>
                  )}
                  {billOutstanding > 0 && (
                    <div className="flex justify-between text-amber-800">
                      <span>Bill Udhaar:</span>
                      <span className="font-semibold">+{formatCurrency(billOutstanding)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-extrabold text-[#12332F]">
                    <span>New Balance:</span>
                    <span>{formatCurrency(projectedBalance)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2.5 pb-2">
              <button
                type="button"
                onClick={onCancel}
                className="min-h-[52px] rounded-2xl border border-[#D8D2C5] bg-white text-sm font-bold text-[#1F2937]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSale}
                disabled={isSubmitting || rows.length === 0}
                className="flex min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-[#0F766E] text-sm font-extrabold text-white shadow-md disabled:opacity-50"
              >
                <CheckCircle2 className="h-4 w-4" />
                Save Bill
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
