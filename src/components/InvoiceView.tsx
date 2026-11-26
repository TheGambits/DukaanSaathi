import { Printer, Share2, X } from 'lucide-react';
import type { Bill, ShopProfile } from '../types';
import { formatCurrency, formatDateTime, formatNumber, formatUnitLabel } from '../lib/formatting';
import { buildBillWhatsAppUrl } from '../lib/whatsapp';

interface InvoiceViewProps {
  bill: Bill;
  shop: ShopProfile;
  onClose: () => void;
}

export function InvoiceView({ bill, shop, onClose }: InvoiceViewProps) {
  const whatsappUrl = buildBillWhatsAppUrl(bill, shop);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-3 sm:items-center sm:p-6">
      <div className="print-only-container w-full max-w-[560px] rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-xl">
        {/* Top bar (hidden when printing) */}
        <div className="no-print mb-4 flex items-center justify-between border-b border-[#E5E7EB] pb-3">
          <div>
            <h2 className="text-lg font-extrabold text-[#12332F]">Invoice Details</h2>
            <p className="text-xs text-[#607D8B]">{bill.invoiceNumber}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close invoice"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F7F8F5] text-[#263238] hover:bg-[#ECEFF1]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Printable Invoice Content */}
        <div className="space-y-4 text-base text-[#263238]">
          <div className="border-b border-dashed border-[#CFD8DC] pb-4 text-center">
            <h3 className="text-xl font-extrabold tracking-wide text-[#12332F]">
              {shop.name.toUpperCase()}
            </h3>
            <p className="mt-0.5 text-sm text-[#546E7A]">
              Prop: {shop.owner} • {shop.location}
            </p>
            <span className="mt-2 inline-block rounded-full bg-[#0F766E]/10 px-3 py-0.5 text-xs font-bold text-[#0F766E]">
              TAX INVOICE (GST Inclusive)
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 rounded-xl bg-[#F7F8F5] p-3.5 text-sm">
            <div>
              <p className="text-xs text-[#607D8B]">Invoice No.</p>
              <p className="font-extrabold text-[#12332F]">{bill.invoiceNumber}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-[#607D8B]">Date &amp; Time</p>
              <p className="font-semibold">{formatDateTime(bill.createdAt)}</p>
            </div>
            <div>
              <p className="text-xs text-[#607D8B]">Customer</p>
              <p className="font-bold">{bill.customerName}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-[#607D8B]">Payment Mode</p>
              <p className="font-extrabold uppercase text-[#0F766E]">{bill.paymentMode}</p>
            </div>
          </div>

          <div>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#E5E7EB] text-xs font-bold uppercase text-[#607D8B]">
                  <th className="py-2.5">Item</th>
                  <th className="py-2.5 text-right">Qty</th>
                  <th className="py-2.5 text-right">Rate</th>
                  <th className="py-2.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F3F5]">
                {bill.items.map((item, idx) => (
                  <tr key={`${item.productId}-${idx}`}>
                    <td className="py-2.5 pr-2">
                      <p className="font-bold text-[#263238]">{item.productName}</p>
                      <p className="text-xs text-[#607D8B]">
                        {item.hindiName} • GST {item.gstRate}%
                      </p>
                    </td>
                    <td className="py-2.5 text-right whitespace-nowrap">
                      {formatNumber(item.quantity)} {formatUnitLabel(item.unit, item.quantity)}
                    </td>
                    <td className="py-2.5 text-right whitespace-nowrap">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="py-2.5 text-right font-extrabold text-[#12332F] whitespace-nowrap">
                      {formatCurrency(item.lineTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-1.5 border-t border-dashed border-[#CFD8DC] pt-3.5 text-sm">
            <div className="flex justify-between text-[#546E7A]">
              <span>Taxable Amount</span>
              <span>{formatCurrency(bill.taxableAmount)}</span>
            </div>
            <div className="flex justify-between text-[#546E7A]">
              <span>GST (Included in price)</span>
              <span>{formatCurrency(bill.gstAmount)}</span>
            </div>
            <div className="flex justify-between border-t border-[#E5E7EB] pt-2.5 text-xl font-extrabold text-[#12332F]">
              <span>Final Total</span>
              <span>{formatCurrency(bill.finalTotal)}</span>
            </div>
            <div className="flex justify-between text-[#263238]">
              <span>Paid Amount</span>
              <span className="font-bold text-[#0F766E]">{formatCurrency(bill.amountPaid)}</span>
            </div>
            {bill.outstandingAmount > 0 && (
              <div className="flex justify-between font-bold text-amber-700">
                <span>Added to Udhaar</span>
                <span>{formatCurrency(bill.outstandingAmount)}</span>
              </div>
            )}
            {bill.customerId && (
              <div className="flex justify-between rounded-xl bg-[#F7F8F5] px-3 py-2 font-extrabold text-[#12332F]">
                <span>{bill.customerName} Total Balance</span>
                <span>{formatCurrency(bill.newBalance)}</span>
              </div>
            )}
          </div>

          <p className="pt-2 text-center text-xs text-[#607D8B]">
            Thank you for shopping with us! — Dukaan Saathi
          </p>
        </div>

        {/* Actions (hidden when printing) */}
        <div className="no-print mt-5 space-y-2 border-t border-[#E5E7EB] pt-4">
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#0F766E] px-4 py-2.5 text-base font-bold text-white hover:bg-[#12332F]"
            >
              <Share2 className="h-4 w-4" />
              WhatsApp pe bhejein
            </a>
            <button
              type="button"
              onClick={handlePrint}
              className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-[#12332F] bg-white px-4 py-2.5 text-base font-bold text-[#12332F] hover:bg-[#F7F8F5]"
            >
              <Printer className="h-4 w-4" />
              Print / Save PDF
            </button>
          </div>
          <p className="text-center text-xs text-[#607D8B]">
            WhatsApp khulne par message check karke Send dabayein.
          </p>
        </div>
      </div>
    </div>
  );
}
