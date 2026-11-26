import type {
  AppDatabase,
  Bill,
  BillItem,
  Customer,
  ExpenseRecord,
  PaymentMode,
  PaymentRecord,
  Product,
  ShopProfile,
  UnitType,
} from '../types';
import { formatCurrency, isLowStock, round2 } from './formatting';
import { runStorageTransaction } from './storage';

export interface EditableBillLine {
  productId: string | null;
  quantity: number;
  unit?: UnitType;
}

export interface SaveBillInput {
  items: EditableBillLine[];
  customerId: string | null;
  paymentMode: PaymentMode;
  amountPaid: number;
  rawInput?: string;
}

export interface SaveBillResult {
  bill: Bill;
  lowStockProducts: Product[];
}

export function calculateLineItem(product: Product, quantity: number, unit?: UnitType): BillItem {
  const safeQty = Math.max(0, round2(quantity));
  const lineTotal = round2(product.price * safeQty);
  const taxableAmount =
    product.gstRate > 0 ? round2(lineTotal / (1 + product.gstRate / 100)) : lineTotal;
  const gstAmount = round2(lineTotal - taxableAmount);

  return {
    productId: product.id,
    productName: product.name,
    hindiName: product.hindiName,
    quantity: safeQty,
    unit: unit ?? product.unit,
    unitPrice: product.price,
    gstRate: product.gstRate,
    taxableAmount,
    gstAmount,
    lineTotal,
  };
}

export function calculateBillTotals(items: BillItem[]): {
  taxableAmount: number;
  gstAmount: number;
  finalTotal: number;
} {
  const finalTotal = round2(items.reduce((sum, item) => sum + item.lineTotal, 0));
  const taxableAmount = round2(items.reduce((sum, item) => sum + item.taxableAmount, 0));
  const gstAmount = round2(finalTotal - taxableAmount);
  return { taxableAmount, gstAmount, finalTotal };
}

export function saveBillTransaction(
  input: SaveBillInput,
  storage: Storage = window.localStorage
): { db: AppDatabase; result: SaveBillResult } {
  if (!input.items || input.items.length === 0) {
    throw new Error('Bill mein kam se kam ek item hona chahiye.');
  }

  return runStorageTransaction((draft) => {
    const nowIso = new Date().toISOString();
    const resolvedItems: BillItem[] = [];
    const qtyByProduct = new Map<string, number>();

    for (const line of input.items) {
      if (!line.productId) {
        throw new Error('Unknown product ko pehle list se select karein ya remove karein.');
      }
      if (!Number.isFinite(line.quantity) || line.quantity <= 0) {
        throw new Error('Har item ki quantity 0 se zyada honi chahiye.');
      }

      const product = draft.products.find((p) => p.id === line.productId);
      if (!product) {
        throw new Error('Selected product inventory mein nahi mila.');
      }

      const prevRequested = qtyByProduct.get(product.id) ?? 0;
      qtyByProduct.set(product.id, round2(prevRequested + line.quantity));

      resolvedItems.push(calculateLineItem(product, line.quantity, line.unit));
    }

    // Validate stock sufficiency across aggregated quantities
    for (const [productId, requestedQty] of qtyByProduct.entries()) {
      const product = draft.products.find((p) => p.id === productId)!;
      if (product.stock < requestedQty) {
        throw new Error(
          `Insufficient stock for ${product.name} (${product.hindiName}): available ${product.stock} ${product.unit}, requested ${requestedQty} ${product.unit}.`
        );
      }
    }

    const { taxableAmount, gstAmount, finalTotal } = calculateBillTotals(resolvedItems);
    const amountPaid = round2(input.amountPaid);

    if (!Number.isFinite(amountPaid) || amountPaid < 0) {
      throw new Error('Amount paid 0 se kam nahi ho sakta.');
    }
    if (amountPaid > finalTotal) {
      throw new Error(`Amount paid (${formatCurrency(amountPaid)}) bill total (${formatCurrency(finalTotal)}) se zyada nahi ho sakta.`);
    }

    const outstandingAmount = round2(finalTotal - amountPaid);

    let customer: Customer | undefined;
    if (input.customerId) {
      customer = draft.customers.find((c) => c.id === input.customerId);
      if (!customer) {
        throw new Error('Selected customer nahi mila.');
      }
    }

    if (outstandingAmount > 0 && !customer) {
      throw new Error('Udhaar bill ke liye customer select karna zaroori hai.');
    }

    // Deduct stock and detect low-stock products impacted by this bill
    const lowStockProducts: Product[] = [];
    for (const [productId, requestedQty] of qtyByProduct.entries()) {
      const product = draft.products.find((p) => p.id === productId)!;
      product.stock = round2(product.stock - requestedQty);
      product.updatedAt = nowIso;
      if (isLowStock(product)) {
        lowStockProducts.push({ ...product });
      }
    }

    const previousBalance = customer ? customer.balance : 0;
    const newBalance = customer ? round2(previousBalance + outstandingAmount) : 0;
    if (customer) {
      customer.balance = newBalance;
      customer.updatedAt = nowIso;
    }

    draft.invoiceCounter += 1;
    const invoiceNumber = `INV-${String(draft.invoiceCounter).padStart(4, '0')}`;

    const bill: Bill = {
      id: `bill-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      invoiceNumber,
      customerId: customer ? customer.id : null,
      customerName: customer ? customer.name : 'Walk-in Customer',
      items: resolvedItems,
      taxableAmount,
      gstAmount,
      finalTotal,
      paymentMode: input.paymentMode,
      amountPaid,
      outstandingAmount,
      previousBalance,
      newBalance,
      rawInput: input.rawInput,
      createdAt: nowIso,
    };

    draft.bills.unshift(bill);

    return {
      nextDb: draft,
      result: { bill, lowStockProducts },
    };
  }, storage);
}

export function recordCustomerPayment(
  input: {
    customerId: string;
    amount: number;
    mode: 'cash' | 'upi';
    note?: string;
  },
  storage: Storage = window.localStorage
): { db: AppDatabase; result: PaymentRecord } {
  const amount = round2(input.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Payment amount 0 se zyada hona chahiye.');
  }

  return runStorageTransaction((draft) => {
    const customer = draft.customers.find((c) => c.id === input.customerId);
    if (!customer) {
      throw new Error('Customer nahi mila.');
    }
    if (customer.balance <= 0) {
      throw new Error(`${customer.name} ka koi baaki Udhaar nahi hai.`);
    }
    if (amount > customer.balance) {
      throw new Error(
        `Payment (${formatCurrency(amount)}) baaki balance (${formatCurrency(customer.balance)}) se zyada nahi ho sakta.`
      );
    }

    const nowIso = new Date().toISOString();
    const previousBalance = customer.balance;
    const newBalance = round2(previousBalance - amount);
    customer.balance = newBalance;
    customer.updatedAt = nowIso;

    const payment: PaymentRecord = {
      id: `pay-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      customerId: customer.id,
      customerName: customer.name,
      amount,
      mode: input.mode,
      previousBalance,
      newBalance,
      note: input.note?.trim() || undefined,
      createdAt: nowIso,
    };

    draft.payments.unshift(payment);

    return { nextDb: draft, result: payment };
  }, storage);
}

export function addCustomerRecord(
  input: { name: string; phone?: string; openingBalance?: number },
  storage: Storage = window.localStorage
): { db: AppDatabase; result: Customer } {
  const name = input.name.trim();
  if (!name) {
    throw new Error('Customer ka naam zaroori hai.');
  }
  const balance = round2(input.openingBalance ?? 0);
  if (!Number.isFinite(balance) || balance < 0) {
    throw new Error('Opening balance negative nahi ho sakta.');
  }

  return runStorageTransaction((draft) => {
    const duplicate = draft.customers.find(
      (c) => c.name.trim().toLowerCase() === name.toLowerCase()
    );
    if (duplicate) {
      throw new Error(`"${duplicate.name}" pehle se customer list mein maujood hai.`);
    }

    const nowIso = new Date().toISOString();
    const customer: Customer = {
      id: `cust-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name,
      phone: (input.phone ?? '').replace(/\s+/g, ''),
      balance,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    draft.customers.push(customer);
    return { nextDb: draft, result: customer };
  }, storage);
}

export function upsertProductRecord(
  input: Omit<Product, 'id' | 'updatedAt'> & { id?: string },
  storage: Storage = window.localStorage
): { db: AppDatabase; result: Product } {
  const name = input.name.trim();
  if (!name) throw new Error('Product ka naam zaroori hai.');
  if (!Number.isFinite(input.price) || input.price <= 0) {
    throw new Error('Selling price 0 se zyada honi chahiye.');
  }
  if (!Number.isFinite(input.stock) || input.stock < 0) {
    throw new Error('Stock 0 ya usse zyada hona chahiye.');
  }
  if (!Number.isFinite(input.reorderLevel) || input.reorderLevel < 0) {
    throw new Error('Reorder level negative nahi ho sakta.');
  }

  return runStorageTransaction((draft) => {
    const nowIso = new Date().toISOString();
    if (input.id) {
      const existing = draft.products.find((p) => p.id === input.id);
      if (!existing) throw new Error('Product nahi mila.');
      existing.name = name;
      existing.hindiName = input.hindiName.trim() || name;
      existing.aliases = input.aliases
        .map((a) => a.trim().toLowerCase())
        .filter(Boolean);
      existing.price = round2(input.price);
      existing.cost = round2(Math.max(0, input.cost));
      existing.unit = input.unit;
      existing.stock = round2(input.stock);
      existing.reorderLevel = round2(input.reorderLevel);
      existing.gstRate = round2(Math.max(0, input.gstRate));
      existing.updatedAt = nowIso;
      return { nextDb: draft, result: { ...existing } };
    }

    const created: Product = {
      id: `prod-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name,
      hindiName: input.hindiName.trim() || name,
      aliases: input.aliases
        .map((a) => a.trim().toLowerCase())
        .filter(Boolean),
      price: round2(input.price),
      cost: round2(Math.max(0, input.cost)),
      unit: input.unit,
      stock: round2(input.stock),
      reorderLevel: round2(input.reorderLevel),
      gstRate: round2(Math.max(0, input.gstRate)),
      updatedAt: nowIso,
    };
    draft.products.push(created);
    return { nextDb: draft, result: created };
  }, storage);
}

export function adjustProductStock(
  productId: string,
  delta: number,
  storage: Storage = window.localStorage
): { db: AppDatabase; result: Product } {
  return runStorageTransaction((draft) => {
    const product = draft.products.find((p) => p.id === productId);
    if (!product) throw new Error('Product nahi mila.');
    const nextStock = round2(product.stock + delta);
    if (nextStock < 0) {
      throw new Error(`${product.name} ka stock 0 se kam nahi ho sakta.`);
    }
    product.stock = nextStock;
    product.updatedAt = new Date().toISOString();
    return { nextDb: draft, result: { ...product } };
  }, storage);
}

export function addExpenseRecord(
  input: { title: string; amount: number; category?: string },
  storage: Storage = window.localStorage
): { db: AppDatabase; result: ExpenseRecord } {
  const title = input.title.trim();
  const amount = round2(input.amount);
  if (!title) throw new Error('Kharch ka vivran zaroori hai.');
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Expense amount 0 se zyada hona chahiye.');
  }

  return runStorageTransaction((draft) => {
    const expense: ExpenseRecord = {
      id: `exp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title,
      amount,
      category: input.category?.trim() || 'Shop Expense',
      createdAt: new Date().toISOString(),
    };
    draft.expenses.unshift(expense);
    return { nextDb: draft, result: expense };
  }, storage);
}

export function updateShopProfile(
  shop: ShopProfile,
  storage: Storage = window.localStorage
): { db: AppDatabase; result: ShopProfile } {
  if (!shop.name.trim() || !shop.owner.trim()) {
    throw new Error('Shop name aur owner name zaroori hai.');
  }

  return runStorageTransaction((draft) => {
    draft.shop = {
      name: shop.name.trim(),
      owner: shop.owner.trim(),
      location: shop.location.trim(),
      voiceLang: shop.voiceLang,
    };
    return { nextDb: draft, result: { ...draft.shop } };
  }, storage);
}
