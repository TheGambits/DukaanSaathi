import { Home, Package, ReceiptText, BookOpen, BarChart3 } from 'lucide-react';
import type { NavTab } from '../types';

interface BottomNavProps {
  activeTab: NavTab;
  onChange: (tab: NavTab) => void;
  lowStockCount: number;
}

const NAV_ITEMS: Array<{
  id: NavTab;
  label: string;
  icon: typeof Home;
}> = [
  { id: 'home', label: 'Hisaab', icon: Home },
  { id: 'stock', label: 'Stock', icon: Package },
  { id: 'bills', label: 'Bills', icon: ReceiptText },
  { id: 'udhaar', label: 'Udhaar', icon: BookOpen },
  { id: 'dashboard', label: 'Reports', icon: BarChart3 },
];

export function BottomNav({ activeTab, onChange, lowStockCount }: BottomNavProps) {
  return (
    <nav
      aria-label="Mobile Navigation"
      className="no-print fixed bottom-0 left-0 right-0 z-30 border-t border-[#E5E7EB] bg-white px-1 pb-1 pt-1 shadow-[0_-2px_10px_rgba(18,51,47,0.06)] md:hidden"
    >
      <div className="grid grid-cols-5 gap-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              className={`relative flex min-h-[56px] flex-col items-center justify-center rounded-xl px-1 py-1.5 text-xs font-bold transition-colors ${
                isActive
                  ? 'bg-[#0F766E]/10 text-[#0F766E]'
                  : 'text-[#455A64] hover:bg-[#F7F8F5]'
              }`}
            >
              <div className="relative">
                <Icon className="h-5 w-5" strokeWidth={isActive ? 2.4 : 2} />
                {item.id === 'stock' && lowStockCount > 0 && (
                  <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#DC2626] px-1 text-[10px] font-bold text-white">
                    {lowStockCount}
                  </span>
                )}
              </div>
              <span className="mt-1 leading-none">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
