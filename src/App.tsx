import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Eye, Loader2, Share2 } from 'lucide-react';
import type {
  AppDatabase,
  Bill,
  NavTab,
  ParsedTransaction,
  PaymentMode,
  Product,
  ShopProfile,
  UnitType,
  VoiceLang,
} from './types';
import { useAuth } from './context/AuthContext';
import { loadDatabase, resetDemoDatabase } from './lib/storage';
import { parseTransaction } from './lib/parser';
import {
  addCustomerRecord,
  addExpenseRecord,
  adjustProductStock,
  recordCustomerPayment,
  saveBillTransaction,
  updateShopProfile,
  upsertProductRecord,
} from './lib/billing';
import { formatCurrency, formatNumber, formatUnitLabel, isLowStock } from './lib/formatting';
import { buildBillWhatsAppUrl } from './lib/whatsapp';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { BottomNav } from './components/BottomNav';
import { TransactionConfirmation } from './components/TransactionConfirmation';
import { InvoiceView } from './components/InvoiceView';
import { HomePage } from './pages/Home';
import { StockPage } from './pages/Stock';
import { BillsPage } from './pages/Bills';
import { UdhaarPage } from './pages/Udhaar';
import { DashboardPage } from './pages/Dashboard';
import { SettingsPage } from './pages/Settings';
import { LoginPage } from './pages/Login';
import { SignupPage } from './pages/Signup';
import { ForgotPasswordPage } from './pages/ForgotPassword';
import { ResetPasswordPage } from './pages/ResetPassword';

type AppRoute = '/' | '/login' | '/signup' | '/forgot-password' | '/reset-password';

interface BillSuccessState {
  bill: Bill;
  lowStockProducts: Product[];
}

function normalizeRoute(pathname: string): AppRoute {
  if (pathname === '/login') return '/login';
  if (pathname === '/signup') return '/signup';
  if (pathname === '/forgot-password') return '/forgot-password';
  if (pathname === '/reset-password') return '/reset-password';
  return '/';
}

const AUTH_PUBLIC_ROUTES: ReadonlySet<AppRoute> = new Set([
  '/login',
  '/signup',
  '/forgot-password',
]);

export function App() {
  const { user, session, loading, isRecoveryMode, signOut, clearRecoveryMode } = useAuth();
  const isAuthenticated = Boolean(user && session);

  const [route, setRoute] = useState<AppRoute>(() =>
    typeof window !== 'undefined' ? normalizeRoute(window.location.pathname) : '/'
  );

  const navigateRoute = useCallback((next: AppRoute, replace = false) => {
    setRoute(next);
    if (typeof window !== 'undefined' && window.location.pathname !== next) {
      if (replace) {
        window.history.replaceState(null, '', next);
      } else {
        window.history.pushState(null, '', next);
      }
    }
  }, []);

  useEffect(() => {
    const onPopState = () => {
      setRoute(normalizeRoute(window.location.pathname));
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Redirect authenticated users away from login/signup/forgot-password
  useEffect(() => {
    if (!loading && isAuthenticated && !isRecoveryMode && AUTH_PUBLIC_ROUTES.has(route)) {
      navigateRoute('/', true);
    }
  }, [loading, isAuthenticated, isRecoveryMode, route, navigateRoute]);

  // Redirect unauthenticated users from protected route to /login
  useEffect(() => {
    if (!loading && !isAuthenticated && !isRecoveryMode && route === '/') {
      navigateRoute('/login', true);
    }
  }, [loading, isAuthenticated, isRecoveryMode, route, navigateRoute]);

  const [db, setDb] = useState<AppDatabase>(() => loadDatabase());
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [stockLowOnlyOnOpen, setStockLowOnlyOnOpen] = useState(false);
  const [stockOpenAddOnOpen, setStockOpenAddOnOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  const [pendingParsed, setPendingParsed] = useState<ParsedTransaction | null>(null);
  const [billSuccess, setBillSuccess] = useState<BillSuccessState | null>(null);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    window.setTimeout(() => {
      setToastMsg((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } finally {
      setIsDrawerOpen(false);
      setPendingParsed(null);
      setBillSuccess(null);
      setSelectedBill(null);
      navigateRoute('/login', true);
    }
  };

  // Password recovery route takes precedence when user arrives via recovery email link
  if (isRecoveryMode || route === '/reset-password') {
    return (
      <ResetPasswordPage
        onResetComplete={() => {
          clearRecoveryMode();
          navigateRoute('/', true);
        }}
        onGoToLogin={() => {
          clearRecoveryMode();
          navigateRoute('/login', true);
        }}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F7F8F5] p-6 text-[#12332F]">
        <Loader2 className="h-9 w-9 animate-spin text-[#0F766E]" />
        <p className="mt-3 text-base font-bold">Dukaan Saathi load ho raha hai...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (route === '/signup') {
      return (
        <SignupPage
          onGoToLogin={() => navigateRoute('/login')}
          onSignupAuthenticated={() => navigateRoute('/', true)}
        />
      );
    }

    if (route === '/forgot-password') {
      return <ForgotPasswordPage onGoToLogin={() => navigateRoute('/login')} />;
    }

    return (
      <LoginPage
        onGoToSignup={() => navigateRoute('/signup')}
        onGoToForgotPassword={() => navigateRoute('/forgot-password')}
        onLoginSuccess={() => navigateRoute('/', true)}
      />
    );
  }

  const lowStockCount = db.products.filter(isLowStock).length;

  const handleChangeVoiceLang = (lang: VoiceLang) => {
    const { db: nextDb } = updateShopProfile({ ...db.shop, voiceLang: lang });
    setDb(nextDb);
  };

  const handleParseInput = (text: string) => {
    const parsed = parseTransaction(text, db.products, db.customers);
    setPendingParsed(parsed);
  };

  const handleOpenQuickNewBill = () => {
    const first = db.products[0];
    setPendingParsed({
      kind: 'sale',
      rawInput: 'Manual Bill Entry',
      customerName: null,
      matchedCustomerId: null,
      paymentMode: 'cash',
      paymentAmount: null,
      items: first
        ? [
            {
              tempId: `manual-${Date.now()}`,
              rawText: first.name,
              rawProductName: first.name,
              productId: first.id,
              productName: first.name,
              hindiName: first.hindiName,
              quantity: 1,
              unit: first.unit,
              unitPrice: first.price,
              gstRate: first.gstRate,
              isUnknown: false,
            },
          ]
        : [],
      warnings: [],
    });
  };

  const handleConfirmSale = (payload: {
    items: Array<{ productId: string | null; quantity: number; unit: UnitType }>;
    customerId: string | null;
    paymentMode: PaymentMode;
    amountPaid: number;
    rawInput: string;
  }) => {
    const { db: nextDb, result } = saveBillTransaction(payload);
    setDb(nextDb);
    setPendingParsed(null);
    setBillSuccess(result);
  };

  const handleConfirmPayment = (payload: {
    customerId: string;
    amount: number;
    mode: 'cash' | 'upi';
    note?: string;
  }) => {
    const { db: nextDb, result } = recordCustomerPayment(payload);
    setDb(nextDb);
    setPendingParsed(null);
    showToast(
      `Payment ${formatCurrency(result.amount)} save ho gaya. ${result.customerName} ka baaki: ${formatCurrency(result.newBalance)}`
    );
  };

  const handleAddCustomer = (name: string, phone?: string, openingBalance?: number) => {
    const { db: nextDb, result } = addCustomerRecord({ name, phone, openingBalance });
    setDb(nextDb);
    return result;
  };

  const handleAdjustStock = (productId: string, delta: number) => {
    const { db: nextDb } = adjustProductStock(productId, delta);
    setDb(nextDb);
  };

  const handleSaveProduct = (input: Omit<Product, 'id' | 'updatedAt'> & { id?: string }) => {
    const { db: nextDb } = upsertProductRecord(input);
    setDb(nextDb);
    showToast(`${input.name} inventory mein save ho gaya.`);
  };

  const handleRecordPaymentFromUdhaar = (payload: {
    customerId: string;
    amount: number;
    mode: 'cash' | 'upi';
    note?: string;
  }) => {
    const { db: nextDb, result } = recordCustomerPayment(payload);
    setDb(nextDb);
    showToast(
      `${result.customerName} se ${formatCurrency(result.amount)} receive hue. Baaki: ${formatCurrency(result.newBalance)}`
    );
  };

  const handleAddExpense = (payload: { title: string; amount: number; category?: string }) => {
    const { db: nextDb } = addExpenseRecord(payload);
    setDb(nextDb);
    showToast(`Expense ${formatCurrency(payload.amount)} save ho gaya.`);
  };

  const handleSaveShop = (shop: ShopProfile) => {
    const { db: nextDb } = updateShopProfile(shop);
    setDb(nextDb);
  };

  const handleResetDemo = () => {
    const fresh = resetDemoDatabase();
    setDb(fresh);
    setPendingParsed(null);
    setBillSuccess(null);
    setSelectedBill(null);
    showToast('Demo data reset ho gaya.');
  };

  const handleNavigate = (tab: NavTab) => {
    if (tab === 'stock') {
      setStockLowOnlyOnOpen(false);
      setStockOpenAddOnOpen(false);
    }
    setActiveTab(tab);
  };

  const openStockLowFilter = () => {
    setStockOpenAddOnOpen(false);
    setStockLowOnlyOnOpen(true);
    setActiveTab('stock');
  };

  const openStockAddProduct = () => {
    setStockLowOnlyOnOpen(false);
    setStockOpenAddOnOpen(true);
    setActiveTab('stock');
  };

  const handleGlobalSearchSubmit = (query: string) => {
    const q = query.trim().toLowerCase();
    if (!q) return;
    const matchesBill = db.bills.some(
      (b) =>
        b.invoiceNumber.toLowerCase().includes(q) ||
        b.customerName.toLowerCase().includes(q)
    );
    const matchesProduct = db.products.some(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.hindiName.toLowerCase().includes(q) ||
        p.aliases.some((a) => a.toLowerCase().includes(q))
    );
    if (matchesBill && !matchesProduct) {
      setActiveTab('bills');
    } else if (matchesProduct) {
      setActiveTab('stock');
    } else if (db.customers.some((c) => c.name.toLowerCase().includes(q))) {
      setActiveTab('udhaar');
    } else {
      setActiveTab('stock');
    }
  };

  return (
    <ProtectedRoute onRedirectToLogin={() => navigateRoute('/login', true)}>
      <div className="min-h-screen bg-[#F7F8F5] text-[#263238]">
        <Sidebar
          activeTab={activeTab}
          lowStockCount={lowStockCount}
          isMobileDrawerOpen={isDrawerOpen}
          onCloseDrawer={() => setIsDrawerOpen(false)}
          onNavigate={handleNavigate}
          onLogout={() => {
            void handleLogout();
          }}
        />

        {/* Full-Width Responsive App Shell */}
        <div className={`min-h-screen lg:pl-[240px] ${selectedBill ? 'no-print' : ''}`}>
          <TopHeader
            shop={db.shop}
            isOnline={isOnline}
            products={db.products}
            searchQuery={globalSearch}
            onSearchChange={setGlobalSearch}
            onSearchSubmit={handleGlobalSearchSubmit}
            userEmail={user?.email ?? null}
            onOpenDrawer={() => setIsDrawerOpen(true)}
            onNavigate={handleNavigate}
            onOpenLowStock={openStockLowFilter}
            onLogout={() => {
              void handleLogout();
            }}
          />

          <main className="mx-auto w-full max-w-[1440px] px-4 pb-24 pt-5 sm:px-6 lg:px-8 lg:pb-10">
            {toastMsg && (
              <div className="mb-4 flex items-center gap-2.5 rounded-2xl bg-[#12332F] px-4 py-3.5 text-sm font-bold text-white shadow-md">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-[#F59E0B]" />
                <span>{toastMsg}</span>
              </div>
            )}

            {activeTab === 'home' && (
              <HomePage
                shop={db.shop}
                products={db.products}
                customers={db.customers}
                bills={db.bills}
                payments={db.payments}
                onChangeVoiceLang={handleChangeVoiceLang}
                onParseInput={handleParseInput}
                onNavigate={handleNavigate}
                onOpenStockLowFilter={openStockLowFilter}
                onOpenAddProduct={openStockAddProduct}
                onOpenQuickNewBill={handleOpenQuickNewBill}
                onSelectBill={setSelectedBill}
              />
            )}

            {activeTab === 'stock' && (
              <StockPage
                key={`${stockLowOnlyOnOpen ? 'low' : 'all'}-${stockOpenAddOnOpen ? 'add' : 'view'}`}
                products={db.products}
                initialLowStockOnly={stockLowOnlyOnOpen}
                initialOpenAddModal={stockOpenAddOnOpen}
                externalSearch={globalSearch}
                onClearInitialFilter={() => setStockLowOnlyOnOpen(false)}
                onClearInitialAdd={() => setStockOpenAddOnOpen(false)}
                onAdjustStock={handleAdjustStock}
                onSaveProduct={handleSaveProduct}
              />
            )}

            {activeTab === 'bills' && (
              <BillsPage
                bills={db.bills}
                externalSearch={globalSearch}
                onSelectBill={setSelectedBill}
              />
            )}

            {activeTab === 'udhaar' && (
              <UdhaarPage
                customers={db.customers}
                bills={db.bills}
                payments={db.payments}
                shop={db.shop}
                onRecordPayment={handleRecordPaymentFromUdhaar}
                onAddCustomer={(name, phone, bal) => {
                  handleAddCustomer(name, phone, bal);
                  showToast(`Customer "${name}" add ho gaya.`);
                }}
              />
            )}

            {activeTab === 'dashboard' && (
              <DashboardPage
                bills={db.bills}
                customers={db.customers}
                products={db.products}
                expenses={db.expenses}
                payments={db.payments}
                onAddExpense={handleAddExpense}
                onSelectBill={setSelectedBill}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsPage
                db={db}
                onBack={() => setActiveTab('home')}
                onSaveShop={handleSaveShop}
                onResetDemo={handleResetDemo}
              />
            )}
          </main>

          <BottomNav
            activeTab={activeTab === 'settings' ? 'home' : activeTab}
            onChange={handleNavigate}
            lowStockCount={lowStockCount}
          />
        </div>

        {/* Editable Confirmation Sheet */}
        {pendingParsed && (
          <TransactionConfirmation
            parsed={pendingParsed}
            products={db.products}
            customers={db.customers}
            onCancel={() => setPendingParsed(null)}
            onAddCustomer={(name, phone) => handleAddCustomer(name, phone, 0)}
            onConfirmSale={handleConfirmSale}
            onConfirmPayment={handleConfirmPayment}
          />
        )}

        {/* Bill Saved Success Modal */}
        {billSuccess && (
          <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
            <div className="w-full max-w-[440px] rounded-3xl bg-white p-6 shadow-2xl">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#0F766E]/10 text-[#0F766E]">
                <CheckCircle2 className="h-8 w-8" />
              </div>

              <h2 className="mt-3 text-center text-xl font-extrabold text-[#12332F]">
                Bill {formatCurrency(billSuccess.bill.finalTotal)} ban gaya.
                {billSuccess.bill.customerId
                  ? ` ${billSuccess.bill.customerName} ka baaki: ${formatCurrency(
                      billSuccess.bill.newBalance
                    )}`
                  : ''}
              </h2>

              <p className="mt-1 text-center text-sm text-[#607D8B]">
                Invoice {billSuccess.bill.invoiceNumber} • Stock &amp; Udhaar updated
              </p>

              {/* Low-stock warnings triggered by this bill */}
              {billSuccess.lowStockProducts.length > 0 && (
                <div className="mt-4 space-y-1.5 rounded-2xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-900">
                  <div className="flex items-center gap-1.5 font-extrabold text-[#DC2626]">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>Low Stock Warning!</span>
                  </div>
                  {billSuccess.lowStockProducts.map((p) => (
                    <p key={p.id} className="font-semibold">
                      • {p.name} ({p.hindiName}): {formatNumber(p.stock)}{' '}
                      {formatUnitLabel(p.unit, p.stock)} left (Reorder level:{' '}
                      {formatNumber(p.reorderLevel)})
                    </p>
                  ))}
                </div>
              )}

              {/* Three working actions */}
              <div className="mt-5 space-y-2.5">
                <button
                  type="button"
                  onClick={() => {
                    const billToView = billSuccess.bill;
                    setBillSuccess(null);
                    setSelectedBill(billToView);
                  }}
                  className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl border border-[#12332F] bg-white text-base font-bold text-[#12332F]"
                >
                  <Eye className="h-4 w-4" />
                  View Bill
                </button>

                <a
                  href={buildBillWhatsAppUrl(billSuccess.bill, db.shop)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-[#0F766E] text-base font-bold text-white"
                >
                  <Share2 className="h-4 w-4" />
                  WhatsApp pe bhejein
                </a>

                <button
                  type="button"
                  onClick={() => setBillSuccess(null)}
                  className="min-h-[48px] w-full rounded-2xl bg-[#F59E0B] text-base font-extrabold text-[#12332F]"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Printable / Shareable Invoice Modal */}
        {selectedBill && (
          <InvoiceView
            bill={selectedBill}
            shop={db.shop}
            onClose={() => setSelectedBill(null)}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}

export default App;
