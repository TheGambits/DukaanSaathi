import type { AppDatabase, Customer, Product, ShopProfile } from '../types';

export const STORAGE_KEY = 'dukaan_saathi_db_v1';
const DB_VERSION = 1;

export function createDemoDatabase(nowIso = new Date().toISOString()): AppDatabase {
  const shop: ShopProfile = {
    name: 'Sharma General Store',
    owner: 'Rajesh Sharma',
    location: 'Dadri, Uttar Pradesh',
    voiceLang: 'hi-IN',
  };

  // Exactly 3 low-stock products initially: Sugar (1<=2), Salt (1<=3), Maggi (2<=5).
  // Oil is 3 litres with reorderLevel 2 -> NOT low-stock initially.
  const products: Product[] = [
    {
      id: 'prod-rice',
      name: 'Rice',
      hindiName: 'Chawal',
      aliases: ['chawal', 'rice', 'चावल'],
      price: 60,
      cost: 45,
      unit: 'kg',
      stock: 10,
      reorderLevel: 3,
      gstRate: 5,
      updatedAt: nowIso,
    },
    {
      id: 'prod-oil',
      name: 'Oil',
      hindiName: 'Tel',
      aliases: ['tel', 'oil', 'तेल'],
      price: 200,
      cost: 170,
      unit: 'litre',
      stock: 3,
      reorderLevel: 2,
      gstRate: 5,
      updatedAt: nowIso,
    },
    {
      id: 'prod-sugar',
      name: 'Sugar',
      hindiName: 'Cheeni',
      aliases: ['cheeni', 'chini', 'sugar', 'चीनी', 'शक्कर'],
      price: 45,
      cost: 38,
      unit: 'kg',
      stock: 1,
      reorderLevel: 2,
      gstRate: 0,
      updatedAt: nowIso,
    },
    {
      id: 'prod-salt',
      name: 'Salt',
      hindiName: 'Namak',
      aliases: ['namak', 'salt', 'नमक'],
      price: 25,
      cost: 18,
      unit: 'packet',
      stock: 1,
      reorderLevel: 3,
      gstRate: 0,
      updatedAt: nowIso,
    },
    {
      id: 'prod-maggi',
      name: 'Maggi',
      hindiName: 'Maggi',
      aliases: ['maggi', 'maggie', 'मैगी'],
      price: 14,
      cost: 11,
      unit: 'packet',
      stock: 2,
      reorderLevel: 5,
      gstRate: 12,
      updatedAt: nowIso,
    },
    {
      id: 'prod-tea',
      name: 'Tea',
      hindiName: 'Chai Patti',
      aliases: ['chai patti', 'chaipatti', 'chai', 'tea', 'चाय पत्ती', 'चाय'],
      price: 120,
      cost: 95,
      unit: 'packet',
      stock: 15,
      reorderLevel: 3,
      gstRate: 5,
      updatedAt: nowIso,
    },
  ];

  const customers: Customer[] = [
    {
      id: 'cust-ramesh',
      name: 'Ramesh',
      phone: '919999999999',
      balance: 820,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
  ];

  return {
    version: DB_VERSION,
    initialized: true,
    invoiceCounter: 0,
    shop,
    products,
    customers,
    bills: [],
    payments: [],
    expenses: [],
  };
}

function isValidDatabase(data: unknown): data is AppDatabase {
  if (!data || typeof data !== 'object') return false;
  const db = data as Partial<AppDatabase>;
  return (
    db.initialized === true &&
    typeof db.shop === 'object' &&
    db.shop !== null &&
    Array.isArray(db.products) &&
    Array.isArray(db.customers) &&
    Array.isArray(db.bills) &&
    Array.isArray(db.payments) &&
    Array.isArray(db.expenses)
  );
}

export function loadDatabase(storage: Storage = window.localStorage): AppDatabase {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (isValidDatabase(parsed)) {
        return parsed;
      }
    }
  } catch {
    // Fall back to fresh demo initialization if storage was corrupted or unreadable
  }

  const fresh = createDemoDatabase();
  saveDatabase(fresh, storage);
  return fresh;
}

export function saveDatabase(db: AppDatabase, storage: Storage = window.localStorage): AppDatabase {
  try {
    const serialized = JSON.stringify(db);
    storage.setItem(STORAGE_KEY, serialized);
    return db;
  } catch (err) {
    throw new Error(
      err instanceof Error
        ? `Local storage save failed: ${err.message}`
        : 'Local storage save failed'
    );
  }
}

export function resetDemoDatabase(storage: Storage = window.localStorage): AppDatabase {
  const fresh = createDemoDatabase();
  return saveDatabase(fresh, storage);
}

/**
 * Runs an atomic read-validate-transform-write against localStorage.
 * If transformer throws, storage remains untouched.
 */
export function runStorageTransaction<T>(
  transformer: (draft: AppDatabase) => { nextDb: AppDatabase; result: T },
  storage: Storage = window.localStorage
): { db: AppDatabase; result: T } {
  const current = loadDatabase(storage);
  const cloned = JSON.parse(JSON.stringify(current)) as AppDatabase;
  const { nextDb, result } = transformer(cloned);
  saveDatabase(nextDb, storage);
  return { db: nextDb, result };
}
