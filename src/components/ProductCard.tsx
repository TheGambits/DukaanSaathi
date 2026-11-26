import { Minus, Plus, Pencil, AlertTriangle } from 'lucide-react';
import type { Product } from '../types';
import { formatCurrency, formatNumber, formatUnitLabel, isLowStock } from '../lib/formatting';

interface ProductCardProps {
  product: Product;
  onAdjustStock: (productId: string, delta: number) => void;
  onEdit: (product: Product) => void;
}

export function ProductCard({ product, onAdjustStock, onEdit }: ProductCardProps) {
  const low = isLowStock(product);
  const out = product.stock <= 0;

  return (
    <div
      className={`rounded-2xl border p-4 shadow-sm transition-colors ${
        low ? 'border-red-300 bg-red-50/70' : 'border-[#E5E7EB] bg-white'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold text-[#263238]">{product.name}</h3>
            {product.hindiName && product.hindiName.toLowerCase() !== product.name.toLowerCase() && (
              <span className="rounded-lg bg-[#F7F8F5] px-2.5 py-0.5 text-sm font-medium text-[#12332F]">
                {product.hindiName}
              </span>
            )}
            {out ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#DC2626] px-2.5 py-0.5 text-xs font-bold text-white">
                Out of Stock
              </span>
            ) : low ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#DC2626] px-2.5 py-0.5 text-xs font-bold text-white">
                <AlertTriangle className="h-3.5 w-3.5" />
                Low Stock
              </span>
            ) : (
              <span className="rounded-full bg-[#0F766E]/10 px-2.5 py-0.5 text-xs font-bold text-[#0F766E]">
                In Stock
              </span>
            )}
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span className="font-bold text-[#12332F]">
              Sell: {formatCurrency(product.price)} / {product.unit}
            </span>
            <span className="text-[#546E7A]">Cost: {formatCurrency(product.cost)}</span>
            <span className="text-xs text-[#607D8B]">GST {product.gstRate}%</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onEdit(product)}
          aria-label={`Edit ${product.name}`}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#CFD8DC] bg-white text-[#12332F] hover:bg-[#F7F8F5]"
        >
          <Pencil className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-black/5 pt-3">
        <div>
          <p className="text-xs text-[#607D8B]">
            Available Stock (Min: {formatNumber(product.reorderLevel)})
          </p>
          <p className={`text-lg font-extrabold ${low ? 'text-[#DC2626]' : 'text-[#263238]'}`}>
            {formatNumber(product.stock)} {formatUnitLabel(product.unit, product.stock)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onAdjustStock(product.id, -1)}
            disabled={product.stock <= 0}
            aria-label={`Decrease ${product.name} stock`}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#CFD8DC] bg-white text-[#263238] active:scale-95 disabled:opacity-40"
          >
            <Minus className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => onAdjustStock(product.id, 1)}
            aria-label={`Increase ${product.name} stock`}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0F766E] text-white active:scale-95"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
