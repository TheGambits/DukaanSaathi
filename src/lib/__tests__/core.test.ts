import { describe, expect, it } from 'vitest';
import { createDemoDatabase, loadDatabase, resetDemoDatabase } from '../storage';
import { parseTransaction } from '../parser';
import { recordCustomerPayment, saveBillTransaction } from '../billing';
import { isLowStock } from '../formatting';

function createMemoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
  };
}

describe('Demo database initialization', () => {
  it('initializes with exactly 3 low-stock products and Oil NOT low-stock', () => {
    const db = createDemoDatabase();
    const lowStock = db.products.filter(isLowStock);
    expect(lowStock.map((p) => p.name)).toEqual(['Sugar', 'Salt', 'Maggi']);
    const oil = db.products.find((p) => p.name === 'Oil')!;
    expect(isLowStock(oil)).toBe(false);
    expect(oil.stock).toBe(3);
    expect(oil.reorderLevel).toBe(2);
    expect(db.customers[0].name).toBe('Ramesh');
    expect(db.customers[0].balance).toBe(820);
  });

  it('does not duplicate demo records on subsequent loads', () => {
    const storage = createMemoryStorage();
    const first = loadDatabase(storage);
    const second = loadDatabase(storage);
    expect(first.products.length).toBe(6);
    expect(second.products.length).toBe(6);
    expect(second.customers.length).toBe(1);
  });
});

describe('Local Hindi/Hinglish Parser', () => {
  const db = createDemoDatabase();

  it('parses "2 kilo chawal aur 1 tel, Ramesh ko udhaar"', () => {
    const parsed = parseTransaction(
      '2 kilo chawal aur 1 tel, Ramesh ko udhaar',
      db.products,
      db.customers
    );
    expect(parsed.kind).toBe('sale');
    expect(parsed.paymentMode).toBe('udhaar');
    expect(parsed.matchedCustomerId).toBe('cust-ramesh');
    expect(parsed.customerName).toBe('Ramesh');
    expect(parsed.items).toHaveLength(2);
    expect(parsed.items[0]).toMatchObject({
      productName: 'Rice',
      quantity: 2,
      unit: 'kg',
      unitPrice: 60,
      isUnknown: false,
    });
    expect(parsed.items[1]).toMatchObject({
      productName: 'Oil',
      quantity: 1,
      unit: 'litre',
      unitPrice: 200,
      isUnknown: false,
    });
  });

  it('parses "aadha kilo cheeni cash"', () => {
    const parsed = parseTransaction('aadha kilo cheeni cash', db.products, db.customers);
    expect(parsed.kind).toBe('sale');
    expect(parsed.paymentMode).toBe('cash');
    expect(parsed.items).toHaveLength(1);
    expect(parsed.items[0]).toMatchObject({
      productName: 'Sugar',
      quantity: 0.5,
      unit: 'kg',
      isUnknown: false,
    });
  });

  it('parses "teen packet Maggi UPI"', () => {
    const parsed = parseTransaction('teen packet Maggi UPI', db.products, db.customers);
    expect(parsed.kind).toBe('sale');
    expect(parsed.paymentMode).toBe('upi');
    expect(parsed.items).toHaveLength(1);
    expect(parsed.items[0]).toMatchObject({
      productName: 'Maggi',
      quantity: 3,
      unit: 'packet',
      isUnknown: false,
    });
  });

  it('parses "dedh kilo chawal Ramesh ko udhaar"', () => {
    const parsed = parseTransaction('dedh kilo chawal Ramesh ko udhaar', db.products, db.customers);
    expect(parsed.kind).toBe('sale');
    expect(parsed.paymentMode).toBe('udhaar');
    expect(parsed.matchedCustomerId).toBe('cust-ramesh');
    expect(parsed.items).toHaveLength(1);
    expect(parsed.items[0]).toMatchObject({
      productName: 'Rice',
      quantity: 1.5,
      unit: 'kg',
      isUnknown: false,
    });
  });

  it('parses "Ramesh se 500 rupaye mile" as payment receipt', () => {
    const parsed = parseTransaction('Ramesh se 500 rupaye mile', db.products, db.customers);
    expect(parsed.kind).toBe('payment');
    expect(parsed.matchedCustomerId).toBe('cust-ramesh');
    expect(parsed.customerName).toBe('Ramesh');
    expect(parsed.paymentAmount).toBe(500);
  });

  it('visibly marks unknown products without silently matching unrelated items', () => {
    const parsed = parseTransaction('2 kilo atta aur 1 chawal', db.products, db.customers);
    expect(parsed.items).toHaveLength(2);
    expect(parsed.items[0]).toMatchObject({
      productId: null,
      rawProductName: 'atta',
      quantity: 2,
      unit: 'kg',
      isUnknown: true,
    });
    expect(parsed.items[1]).toMatchObject({
      productName: 'Rice',
      quantity: 1,
      isUnknown: false,
    });
  });
});

describe('Core ₹320 Bill + Stock Deduction + Udhaar Flow', () => {
  it('saves ₹320 bill, deducts Rice & Oil stock, updates Ramesh to ₹1,140, triggers Oil low-stock', () => {
    const storage = createMemoryStorage();
    resetDemoDatabase(storage);

    const { db, result } = saveBillTransaction(
      {
        items: [
          { productId: 'prod-rice', quantity: 2, unit: 'kg' },
          { productId: 'prod-oil', quantity: 1, unit: 'litre' },
        ],
        customerId: 'cust-ramesh',
        paymentMode: 'udhaar',
        amountPaid: 0,
      },
      storage
    );

    expect(result.bill.invoiceNumber).toBe('INV-0001');
    expect(result.bill.finalTotal).toBe(320);
    // Inclusive GST check: 304.77 + 15.23 = 320
    expect(result.bill.taxableAmount + result.bill.gstAmount).toBeCloseTo(320, 2);
    expect(result.bill.previousBalance).toBe(820);
    expect(result.bill.newBalance).toBe(1140);

    const rice = db.products.find((p) => p.id === 'prod-rice')!;
    const oil = db.products.find((p) => p.id === 'prod-oil')!;
    const ramesh = db.customers.find((c) => c.id === 'cust-ramesh')!;

    expect(rice.stock).toBe(8);
    expect(oil.stock).toBe(2);
    expect(isLowStock(oil)).toBe(true);
    expect(result.lowStockProducts.map((p) => p.name)).toEqual(['Oil']);
    expect(ramesh.balance).toBe(1140);

    // Record ₹500 payment from Ramesh -> ₹640
    const afterPay = recordCustomerPayment(
      { customerId: 'cust-ramesh', amount: 500, mode: 'cash' },
      storage
    );
    expect(afterPay.result.newBalance).toBe(640);

    // Prevent negative balance
    expect(() =>
      recordCustomerPayment({ customerId: 'cust-ramesh', amount: 700, mode: 'cash' }, storage)
    ).toThrow();
  });

  it('rejects insufficient stock without mutating database', () => {
    const storage = createMemoryStorage();
    resetDemoDatabase(storage);

    expect(() =>
      saveBillTransaction(
        {
          items: [{ productId: 'prod-oil', quantity: 5, unit: 'litre' }],
          customerId: null,
          paymentMode: 'cash',
          amountPaid: 1000,
        },
        storage
      )
    ).toThrow(/Insufficient stock/);

    const dbAfter = loadDatabase(storage);
    expect(dbAfter.bills).toHaveLength(0);
    expect(dbAfter.products.find((p) => p.id === 'prod-oil')!.stock).toBe(3);
  });
});
