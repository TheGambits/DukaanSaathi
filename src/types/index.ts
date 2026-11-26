export type UnitType = 'kg' | 'litre' | 'packet' | 'piece';

export type PaymentMode = 'cash' | 'upi' | 'udhaar';

export type VoiceLang = 'hi-IN' | 'en-IN';

export type NavTab = 'home' | 'stock' | 'bills' | 'udhaar' | 'dashboard' | 'settings';

export interface ShopProfile {
  name: string;
  owner: string;
  location: string;
  voiceLang: VoiceLang;
}

export interface Product {
  id: string;
  name: string;
  hindiName: string;
  aliases: string[];
  price: number;
  cost: number;
  unit: UnitType;
  stock: number;
  reorderLevel: number;
  gstRate: number; // percentage, e.g. 5 for 5% (inclusive in price)
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  balance: number;
  createdAt: string;
  updatedAt: string;
}

export interface BillItem {
  productId: string;
  productName: string;
  hindiName: string;
  quantity: number;
  unit: UnitType;
  unitPrice: number;
  gstRate: number;
  taxableAmount: number;
  gstAmount: number;
  lineTotal: number;
}

export interface Bill {
  id: string;
  invoiceNumber: string;
  customerId: string | null;
  customerName: string;
  items: BillItem[];
  taxableAmount: number;
  gstAmount: number;
  finalTotal: number;
  paymentMode: PaymentMode;
  amountPaid: number;
  outstandingAmount: number;
  previousBalance: number;
  newBalance: number;
  rawInput?: string;
  createdAt: string;
}

export interface PaymentRecord {
  id: string;
  customerId: string;
  customerName: string;
  amount: number;
  mode: 'cash' | 'upi';
  previousBalance: number;
  newBalance: number;
  note?: string;
  createdAt: string;
}

export interface ExpenseRecord {
  id: string;
  title: string;
  amount: number;
  category: string;
  createdAt: string;
}

export interface AppDatabase {
  version: number;
  initialized: boolean;
  invoiceCounter: number;
  shop: ShopProfile;
  products: Product[];
  customers: Customer[];
  bills: Bill[];
  payments: PaymentRecord[];
  expenses: ExpenseRecord[];
}

export interface ParsedLineItem {
  tempId: string;
  rawText: string;
  rawProductName: string;
  productId: string | null;
  productName: string;
  hindiName: string;
  quantity: number;
  unit: UnitType;
  unitPrice: number;
  gstRate: number;
  isUnknown: boolean;
}

export interface ParsedTransaction {
  kind: 'sale' | 'payment';
  rawInput: string;
  customerName: string | null;
  matchedCustomerId: string | null;
  paymentMode: PaymentMode;
  paymentAmount: number | null;
  items: ParsedLineItem[];
  warnings: string[];
}
