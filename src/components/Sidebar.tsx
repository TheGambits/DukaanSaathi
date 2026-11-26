import {
  BarChart3,
  BookOpen,
  Home,
  LogOut,
  Package,
  ReceiptText,
  Settings,
  Store,
  X,
} from 'lucide-react';
import type { NavTab } from '../types';

interface SidebarProps {
  activeTab: NavTab;
  lowStockCount: number;
  isMobileDrawerOpen: boolean;
  onCloseDrawer: () => void;
  onNavigate: (tab: NavTab) => void;
  onLogout: () => void;
}

const SIDEBAR_ITEMS: Array<{
  id: NavTab;
  label: string;
  subLabel: string;
  icon: typeof Home;
}> = [
    { id: 'home', label: 'Aaj ka Hisaab', subLabel: 'Home & Billing', icon: Home },
    { id: 'stock', label: 'Stock', subLabel: 'Inventory', icon: Package },
    { id: 'bills', label: 'Bills', subLabel: 'Invoices', icon: ReceiptText },
    { id: 'udhaar', label: 'Udhaar', subLabel: 'Customer Khata', icon: BookOpen },
    { id: 'dashboard', label: 'Reports', subLabel: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', subLabel: 'Shop Profile', icon: Settings },
  ];

export function Sidebar({
  activeTab,
  lowStockCount,
  isMobileDrawerOpen,
  onCloseDrawer,
  onNavigate,
  onLogout,
}: SidebarProps) {
  const navContent = (
    <div className="flex h-full flex-col bg-[#12332F] text-white">
      {/* Logo */}
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F59E0B] text-[#12332F]">
            <Store className="h-6 w-6" strokeWidth={2.3} />
          </div>
          <div>
            <p className="text-base font-extrabold tracking-wide text-white">DUKAAN SAATHI</p>
            <p className="text-[11px] text-emerald-100/75">Ab dukaan ka hisaab, sirf bolkar.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onCloseDrawer}
          aria-label="Close navigation"
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white lg:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation Links */}
      <nav aria-label="Sidebar Navigation" className="flex-1 space-y-1.5 px-3 py-4">
        {SIDEBAR_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onNavigate(item.id);
                onCloseDrawer();
              }}
              className={`flex min-h-[48px] w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left transition-colors ${isActive
                  ? 'bg-[#0F766E] text-white shadow-sm'
                  : 'text-emerald-50/80 hover:bg-white/10 hover:text-white'
                }`}
            >
              <div className="flex items-center gap-3">
                <Icon className="h-5 w-5 shrink-0" />
                <div>
                  <p className="text-sm font-bold leading-tight">{item.label}</p>
                  <p className="text-[11px] text-emerald-100/65">{item.subLabel}</p>
                </div>
              </div>
              {item.id === 'stock' && lowStockCount > 0 && (
                <span className="rounded-full bg-[#DC2626] px-2 py-0.5 text-xs font-bold text-white">
                  {lowStockCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Logout button */}
      <div className="border-t border-white/10 p-3">
        <button
          type="button"
          onClick={onLogout}
          className="flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3.5 py-2 text-sm font-semibold text-emerald-100/80 transition-colors hover:bg-white/10 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Persistent Desktop Sidebar (lg+) */}
      <aside className="no-print fixed inset-y-0 left-0 z-30 hidden w-[240px] lg:block">
        {navContent}
      </aside>

      {/* Collapsible Tablet/Mobile Drawer */}
      {isMobileDrawerOpen && (
        <div className="no-print fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={onCloseDrawer}
            aria-hidden="true"
          />
          <aside className="relative z-10 w-[260px] max-w-[82vw] shadow-2xl">
            {navContent}
          </aside>
        </div>
      )}
    </>
  );
}
