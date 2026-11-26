import type { Bill, Customer, ShopProfile } from '../types';
import { formatCurrency, formatNumber, formatUnitLabel } from './formatting';

export function buildBillWhatsAppMessage(bill: Bill, shop: ShopProfile): string {
  const lines: string[] = [
    shop.name.toUpperCase(),
    '',
    `Invoice: ${bill.invoiceNumber}`,
  ];

  if (bill.customerName && bill.customerName !== 'Walk-in Customer') {
    lines.push(`Customer: ${bill.customerName}`);
  }

  lines.push('');

  for (const item of bill.items) {
    const qtyText = `${formatNumber(item.quantity)} ${formatUnitLabel(item.unit, item.quantity)}`;
    lines.push(`${item.productName}: ${qtyText} × ${formatCurrency(item.unitPrice)}`);
  }

  lines.push('');
  lines.push(`Total: ${formatCurrency(bill.finalTotal)}`);

  const modeLabel =
    bill.paymentMode === 'udhaar'
      ? 'Udhaar'
      : bill.paymentMode === 'upi'
        ? 'UPI'
        : 'Cash';
  lines.push(`Payment: ${modeLabel}`);

  if (bill.outstandingAmount > 0 && bill.newBalance > 0) {
    lines.push(`Baaki Balance: ${formatCurrency(bill.newBalance)}`);
  }

  lines.push('');
  lines.push('Thank you for shopping with us!');

  return lines.join('\n');
}

export function buildBillWhatsAppUrl(bill: Bill, shop: ShopProfile): string {
  const message = buildBillWhatsAppMessage(bill, shop);
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

export function buildUdhaarReminderUrl(customer: Customer, shop: ShopProfile): string {
  const cleanPhone = customer.phone.replace(/\D/g, '');
  const message = [
    `Namaste ${customer.name} ji,`,
    '',
    `${shop.name} mein aapka kul baaki Udhaar ${formatCurrency(customer.balance)} hai.`,
    'Kripya suvidha anusar payment kar dein.',
    '',
    'Dhanyavaad!',
    `${shop.owner} (${shop.name})`,
  ].join('\n');

  if (cleanPhone.length >= 10) {
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  }
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}
