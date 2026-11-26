import { useState } from 'react';
import {
  AlertTriangle,
  Bell,
  Menu,
  Search,
  Settings,
  User,
  Wifi,
  WifiOff,
} from 'lucide-react';
import type { NavTab, Product, ShopProfile } from '../types';
import { formatNumber, formatUnitLabel, isLowStock } from '../lib/formatting';

interface TopHeaderProps {
  shop: ShopProfile;
  isOnline: boolean;
  products: Product[];
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: (value: string) => void;
  userEmail?: string | null;
  onOpenDrawer: () => void;
  onNavigate: (tab: NavTab) => void;
  onOpenLowStock: () => void;
  onLogout: () => void;
}

export function TopHeader({
  shop,
  isOnline,
  products,
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  userEmail,
  onOpenDrawer,
  onNavigate,
  onOpenLowStock,
  onLogout,
}: TopHeaderProps) {
  const [showNotif, setShowNotif] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const lowStockItems = products.filter(isLowStock);

  const handleSearchFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchSubmit(searchQuery);
  };

  return (
    <header className="no-print sticky top-0 z-20 border-b border-[#E5E7EB] bg-white px-4 py-3 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-3">
        {/* Left: Drawer button (tablet) + Shop Name */}
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onOpenDrawer}
            aria-label="Open menu"
            className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#E5E7EB] bg-[#F7F8F5] text-[#263238] md:flex lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate text-base font-extrabold text-[#12332F]">{shop.name}</p>
              <span
                className={`hidden items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold sm:inline-flex ${
                  isOnline
                    ? 'bg-[#0F766E]/10 text-[#0F766E]'
                    : 'bg-[#F59E0B]/20 text-[#12332F]'
                }`}
              >
                {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                {isOnline ? 'Local Ready' : 'Offline Mode'}
              </span>
            </div>
            <p className="truncate text-xs text-[#607D8B]">{shop.location}</p>
          </div>
        </div>

        {/* Center: Search (desktop & tablet) */}
        <form
          onSubmit={handleSearchFormSubmit}
          className="relative hidden max-w-md flex-1 md:block"
        >
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#607D8B]" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Stock, bill ya customer search karein..."
            className="min-h-[42px] w-full rounded-xl border border-[#DCE1E5] bg-[#F7F8F5] pl-10 pr-4 text-sm text-[#263238] placeholder:text-[#78909C] focus:border-[#0F766E] focus:bg-white focus:outline-none"
          />
        </form>

        {/* Right: Notifications, Mobile Settings, Profile */}
        <div className="flex items-center gap-2">
          {/* Notification Bell */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowNotif((v) => !v);
                setShowProfile(false);
              }}
              aria-label="Notifications"
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[#E5E7EB] bg-[#F7F8F5] text-[#263238] hover:bg-[#ECEFF1]"
            >
              <Bell className="h-5 w-5" />
              {lowStockItems.length > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#DC2626] px-1 text-[11px] font-bold text-white">
                  {lowStockItems.length}
                </span>
              )}
            </button>

            {showNotif && (
              <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-[#E5E7EB] bg-white p-3.5 shadow-xl">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-extrabold text-[#12332F]">Stock Alerts</p>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNotif(false);
                      onOpenLowStock();
                    }}
                    className="text-xs font-bold text-[#0F766E]"
                  >
                    View Stock →
                  </button>
                </div>
                {lowStockItems.length === 0 ? (
                  <p className="py-3 text-sm text-[#607D8B]">Sabhi products stock mein hain.</p>
                ) : (
                  <div className="space-y-2">
                    {lowStockItems.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setShowNotif(false);
                          onOpenLowStock();
                        }}
                        className="flex w-full items-center justify-between rounded-xl bg-red-50 px-3 py-2 text-left text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 shrink-0 text-[#DC2626]" />
                          <span className="font-semibold text-[#263238]">
                            {item.name} ({item.hindiName})
                          </span>
                        </div>
                        <span className="font-bold text-[#DC2626]">
                          {formatNumber(item.stock)} {formatUnitLabel(item.unit, item.stock)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile quick Settings button */}
          <button
            type="button"
            onClick={() => onNavigate('settings')}
            aria-label="Settings"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#E5E7EB] bg-[#F7F8F5] text-[#263238] md:hidden"
          >
            <Settings className="h-5 w-5" />
          </button>

          {/* Profile Section */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowProfile((v) => !v);
                setShowNotif(false);
              }}
              className="flex min-h-[40px] items-center gap-2 rounded-xl border border-[#E5E7EB] bg-[#F7F8F5] px-2.5 py-1.5 text-left hover:bg-[#ECEFF1]"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0F766E] text-white">
                <User className="h-4 w-4" />
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-bold leading-tight text-[#263238]">{shop.owner}</p>
                <p className="max-w-[140px] truncate text-[11px] leading-tight text-[#607D8B]">
                  {userEmail ?? 'Shop Owner'}
                </p>
              </div>
            </button>

            {showProfile && (
              <div className="absolute right-0 mt-2 w-60 rounded-2xl border border-[#E5E7EB] bg-white p-2 shadow-xl">
                <div className="border-b border-[#F3F4F6] px-3 py-2">
                  <p className="text-sm font-bold text-[#12332F]">{shop.owner}</p>
                  <p className="truncate text-xs text-[#607D8B]">{userEmail ?? shop.name}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowProfile(false);
                    onNavigate('settings');
                  }}
                  className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-[#263238] hover:bg-[#F7F8F5]"
                >
                  <Settings className="h-4 w-4 text-[#0F766E]" />
                  Shop Settings
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowProfile(false);
                    onLogout();
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-[#DC2626] hover:bg-red-50"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
