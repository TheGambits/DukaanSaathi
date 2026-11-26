import { useState } from 'react';
import {
  AlertTriangle,
  IndianRupee,
  Minus,
  Package,
  PackageX,
  Pencil,
  Plus,
  Search,
  X,
} from 'lucide-react';
import type { Product, UnitType } from '../types';
import {
  formatCurrency,
  formatNumber,
  formatUnitLabel,
  isLowStock,
  round2,
} from '../lib/formatting';
import { ProductCard } from '../components/ProductCard';

interface StockPageProps {
  products: Product[];
  initialLowStockOnly: boolean;
  initialOpenAddModal?: boolean;
  externalSearch?: string;
  onClearInitialFilter: () => void;
  onClearInitialAdd?: () => void;
  onAdjustStock: (productId: string, delta: number) => void;
  onSaveProduct: (
    input: Omit<Product, 'id' | 'updatedAt'> & { id?: string }
  ) => void;
}

interface ProductFormState {
  id?: string;
  name: string;
  hindiName: string;
  aliasesText: string;
  price: string;
  cost: string;
  unit: UnitType;
  stock: string;
  reorderLevel: string;
  gstRate: string;
}

const EMPTY_FORM: ProductFormState = {
  name: '',
  hindiName: '',
  aliasesText: '',
  price: '',
  cost: '',
  unit: 'kg',
  stock: '',
  reorderLevel: '2',
  gstRate: '5',
};

export function StockPage({
  products,
  initialLowStockOnly,
  initialOpenAddModal = false,
  externalSearch = '',
  onClearInitialFilter,
  onClearInitialAdd,
  onAdjustStock,
  onSaveProduct,
}: StockPageProps) {
  const [search, setSearch] = useState(externalSearch);
  const [unitFilter, setUnitFilter] = useState<'all' | UnitType>('all');
  const [lowStockOnly, setLowStockOnly] = useState(initialLowStockOnly);
  const [editingForm, setEditingForm] = useState<ProductFormState | null>(() =>
    initialOpenAddModal ? { ...EMPTY_FORM } : null
  );
  const [error, setError] = useState<string | null>(null);

  const lowStockCount = products.filter(isLowStock).length;
  const outOfStockCount = products.filter((p) => p.stock <= 0).length;
  const inventoryValue = round2(
    products.reduce((sum, p) => sum + p.price * p.stock, 0)
  );

  const effectiveSearch = (search || externalSearch).trim().toLowerCase();

  const filteredProducts = products.filter((p) => {
    if (lowStockOnly && !isLowStock(p)) return false;
    if (unitFilter !== 'all' && p.unit !== unitFilter) return false;
    if (!effectiveSearch) return true;
    return (
      p.name.toLowerCase().includes(effectiveSearch) ||
      p.hindiName.toLowerCase().includes(effectiveSearch) ||
      p.aliases.some((a) => a.toLowerCase().includes(effectiveSearch))
    );
  });

  const openAddModal = () => {
    setError(null);
    setEditingForm({ ...EMPTY_FORM });
  };

  const openEditModal = (product: Product) => {
    setError(null);
    setEditingForm({
      id: product.id,
      name: product.name,
      hindiName: product.hindiName,
      aliasesText: product.aliases.join(', '),
      price: String(product.price),
      cost: String(product.cost),
      unit: product.unit,
      stock: String(product.stock),
      reorderLevel: String(product.reorderLevel),
      gstRate: String(product.gstRate),
    });
  };

  const closeModal = () => {
    setEditingForm(null);
    onClearInitialAdd?.();
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingForm) return;
    setError(null);

    try {
      const aliases = editingForm.aliasesText
        .split(',')
        .map((a) => a.trim().toLowerCase())
        .filter(Boolean);

      if (editingForm.name.trim()) {
        const lowerName = editingForm.name.trim().toLowerCase();
        if (!aliases.includes(lowerName)) aliases.push(lowerName);
      }
      if (editingForm.hindiName.trim()) {
        const lowerHindi = editingForm.hindiName.trim().toLowerCase();
        if (!aliases.includes(lowerHindi)) aliases.push(lowerHindi);
      }

      onSaveProduct({
        id: editingForm.id,
        name: editingForm.name,
        hindiName: editingForm.hindiName || editingForm.name,
        aliases,
        price: Number.parseFloat(editingForm.price) || 0,
        cost: Number.parseFloat(editingForm.cost) || 0,
        unit: editingForm.unit,
        stock: Number.parseFloat(editingForm.stock) || 0,
        reorderLevel: Number.parseFloat(editingForm.reorderLevel) || 0,
        gstRate: Number.parseFloat(editingForm.gstRate) || 0,
      });
      closeModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Product save nahi ho saka.');
    }
  };

  const handleActionError = (fn: () => void) => {
    try {
      setError(null);
      fn();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Stock update fail hua.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Heading */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-[#12332F]">Stock &amp; Inventory</h1>
          <p className="text-base text-[#546E7A]">
            Apne sabhi samaan ka stock, price aur reorder level manage karein.
          </p>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="flex min-h-[48px] items-center gap-2 rounded-xl bg-[#0F766E] px-5 py-2.5 text-base font-bold text-white shadow-sm hover:bg-[#12332F] active:scale-[0.99]"
        >
          <Plus className="h-5 w-5" />
          Add Product
        </button>
      </div>

      {/* Top 4 Inventory Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-[#546E7A]">Total Products</span>
            <Package className="h-5 w-5 text-[#0F766E]" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-[#12332F]">{products.length}</p>
        </div>

        <div
          className={`rounded-2xl border p-4 shadow-sm ${
            lowStockCount > 0 ? 'border-red-300 bg-red-50/70' : 'border-[#E5E7EB] bg-white'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-[#546E7A]">Low Stock</span>
            <AlertTriangle
              className={`h-5 w-5 ${lowStockCount > 0 ? 'text-[#DC2626]' : 'text-[#0F766E]'}`}
            />
          </div>
          <p
            className={`mt-2 text-2xl font-extrabold ${
              lowStockCount > 0 ? 'text-[#DC2626]' : 'text-[#12332F]'
            }`}
          >
            {lowStockCount}
          </p>
        </div>

        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-[#546E7A]">Out of Stock</span>
            <PackageX className="h-5 w-5 text-[#546E7A]" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-[#263238]">{outOfStockCount}</p>
        </div>

        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-[#546E7A]">Inventory Value</span>
            <IndianRupee className="h-5 w-5 text-[#F59E0B]" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-[#12332F]">
            {formatCurrency(inventoryValue)}
          </p>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 md:max-w-sm">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#607D8B]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search item (e.g. Chawal, Oil, Maggi)..."
            className="min-h-[46px] w-full rounded-xl border border-[#CFD8DC] bg-[#F7F8F5] pl-10 pr-3 text-base focus:border-[#0F766E] focus:bg-white focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Filter by unit"
            value={unitFilter}
            onChange={(e) => setUnitFilter(e.target.value as 'all' | UnitType)}
            className="min-h-[44px] rounded-xl border border-[#CFD8DC] bg-[#F7F8F5] px-3 text-sm font-bold text-[#263238]"
          >
            <option value="all">All Units</option>
            <option value="kg">kg</option>
            <option value="litre">litre</option>
            <option value="packet">packet</option>
            <option value="piece">piece</option>
          </select>

          <button
            type="button"
            onClick={() => {
              setLowStockOnly(false);
              onClearInitialFilter();
            }}
            className={`min-h-[44px] rounded-xl px-4 text-sm font-bold transition-colors ${
              !lowStockOnly
                ? 'bg-[#12332F] text-white'
                : 'border border-[#CFD8DC] bg-white text-[#455A64]'
            }`}
          >
            All ({products.length})
          </button>

          <button
            type="button"
            onClick={() => setLowStockOnly(true)}
            className={`min-h-[44px] rounded-xl px-4 text-sm font-bold transition-colors ${
              lowStockOnly
                ? 'bg-[#DC2626] text-white'
                : 'border border-red-200 bg-red-50 text-[#DC2626]'
            }`}
          >
            Low Stock ({lowStockCount})
          </button>
        </div>
      </div>

      {error && !editingForm && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-3.5 text-sm font-semibold text-[#DC2626]">
          {error}
        </div>
      )}

      {filteredProducts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#CFD8DC] bg-white p-10 text-center">
          <p className="text-base font-bold text-[#12332F]">Koi product nahi mila</p>
          <p className="mt-1 text-sm text-[#607D8B]">
            Search clear karein ya naya product add karein.
          </p>
        </div>
      ) : (
        <>
          {/* Clean Desktop Table */}
          <div className="hidden overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-sm md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[#E5E7EB] bg-[#F7F8F5] text-xs font-extrabold uppercase tracking-wider text-[#546E7A]">
                    <th className="px-5 py-3.5">Product</th>
                    <th className="px-4 py-3.5">Available Stock</th>
                    <th className="px-4 py-3.5">Unit</th>
                    <th className="px-4 py-3.5">Selling Price</th>
                    <th className="px-4 py-3.5">Cost Price</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F3F5] text-base">
                  {filteredProducts.map((product) => {
                    const low = isLowStock(product);
                    const out = product.stock <= 0;
                    return (
                      <tr
                        key={product.id}
                        className={low ? 'bg-red-50/40' : 'hover:bg-[#F7F8F5]/60'}
                      >
                        <td className="px-5 py-4">
                          <p className="font-bold text-[#12332F]">{product.name}</p>
                          <p className="text-sm text-[#607D8B]">
                            {product.hindiName} • GST {product.gstRate}%
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`text-lg font-extrabold ${
                              low ? 'text-[#DC2626]' : 'text-[#263238]'
                            }`}
                          >
                            {formatNumber(product.stock)}
                          </span>
                          <p className="text-xs text-[#607D8B]">
                            Min: {formatNumber(product.reorderLevel)}
                          </p>
                        </td>
                        <td className="px-4 py-4 font-medium text-[#455A64]">
                          {formatUnitLabel(product.unit, product.stock)}
                        </td>
                        <td className="px-4 py-4 font-bold text-[#12332F]">
                          {formatCurrency(product.price)}
                        </td>
                        <td className="px-4 py-4 text-[#546E7A]">
                          {formatCurrency(product.cost)}
                        </td>
                        <td className="px-4 py-4">
                          {out ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#DC2626] px-3 py-1 text-xs font-bold text-white">
                              Out of Stock
                            </span>
                          ) : low ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#DC2626] px-3 py-1 text-xs font-bold text-white">
                              <AlertTriangle className="h-3.5 w-3.5" />
                              Low Stock
                            </span>
                          ) : (
                            <span className="inline-flex rounded-full bg-[#0F766E]/10 px-3 py-1 text-xs font-bold text-[#0F766E]">
                              In Stock
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                handleActionError(() => onAdjustStock(product.id, -1))
                              }
                              disabled={product.stock <= 0}
                              aria-label={`Decrease ${product.name} stock`}
                              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#CFD8DC] bg-white text-[#263238] hover:bg-[#F7F8F5] disabled:opacity-40"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleActionError(() => onAdjustStock(product.id, 1))
                              }
                              aria-label={`Increase ${product.name} stock`}
                              className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0F766E] text-white hover:bg-[#12332F]"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditModal(product)}
                              aria-label={`Edit ${product.name}`}
                              className="flex h-10 items-center gap-1.5 rounded-xl border border-[#CFD8DC] bg-white px-3 text-sm font-bold text-[#12332F] hover:bg-[#F7F8F5]"
                            >
                              <Pencil className="h-4 w-4" />
                              Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="space-y-3 md:hidden">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAdjustStock={(id, delta) => handleActionError(() => onAdjustStock(id, delta))}
                onEdit={openEditModal}
              />
            ))}
          </div>
        </>
      )}

      {/* Add / Edit Product Modal */}
      {editingForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-3">
          <form
            onSubmit={handleFormSubmit}
            className="max-h-[90vh] w-full max-w-[480px] overflow-y-auto rounded-t-3xl bg-white p-6 shadow-xl sm:rounded-3xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-extrabold text-[#12332F]">
                {editingForm.id ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                aria-label="Close modal"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F7F8F5]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <div className="mb-3 rounded-xl border border-red-300 bg-red-50 p-3 text-sm font-semibold text-[#DC2626]">
                {error}
              </div>
            )}

            <div className="space-y-3.5 text-sm">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="font-bold text-[#12332F]">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={editingForm.name}
                    onChange={(e) => setEditingForm({ ...editingForm, name: e.target.value })}
                    placeholder="e.g. Atta"
                    className="mt-1 min-h-[44px] w-full rounded-xl border border-[#CFD8DC] px-3 text-base"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#12332F]">Hindi Name</label>
                  <input
                    type="text"
                    value={editingForm.hindiName}
                    onChange={(e) =>
                      setEditingForm({ ...editingForm, hindiName: e.target.value })
                    }
                    placeholder="e.g. Gehu Atta"
                    className="mt-1 min-h-[44px] w-full rounded-xl border border-[#CFD8DC] px-3 text-base"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="font-bold text-[#12332F]">Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min="0.1"
                    step="any"
                    value={editingForm.price}
                    onChange={(e) => setEditingForm({ ...editingForm, price: e.target.value })}
                    className="mt-1 min-h-[44px] w-full rounded-xl border border-[#CFD8DC] px-3 text-base"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#12332F]">Cost (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={editingForm.cost}
                    onChange={(e) => setEditingForm({ ...editingForm, cost: e.target.value })}
                    className="mt-1 min-h-[44px] w-full rounded-xl border border-[#CFD8DC] px-3 text-base"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#12332F]">Unit *</label>
                  <select
                    value={editingForm.unit}
                    onChange={(e) =>
                      setEditingForm({ ...editingForm, unit: e.target.value as UnitType })
                    }
                    className="mt-1 min-h-[44px] w-full rounded-xl border border-[#CFD8DC] bg-white px-2 text-base"
                  >
                    <option value="kg">kg</option>
                    <option value="litre">litre</option>
                    <option value="packet">packet</option>
                    <option value="piece">piece</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="font-bold text-[#12332F]">Stock *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="any"
                    value={editingForm.stock}
                    onChange={(e) => setEditingForm({ ...editingForm, stock: e.target.value })}
                    className="mt-1 min-h-[44px] w-full rounded-xl border border-[#CFD8DC] px-3 text-base"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#12332F]">Reorder Level</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={editingForm.reorderLevel}
                    onChange={(e) =>
                      setEditingForm({ ...editingForm, reorderLevel: e.target.value })
                    }
                    className="mt-1 min-h-[44px] w-full rounded-xl border border-[#CFD8DC] px-3 text-base"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#12332F]">GST (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="28"
                    step="any"
                    value={editingForm.gstRate}
                    onChange={(e) =>
                      setEditingForm({ ...editingForm, gstRate: e.target.value })
                    }
                    className="mt-1 min-h-[44px] w-full rounded-xl border border-[#CFD8DC] px-3 text-base"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-[#12332F]">
                  Voice Aliases (comma separated)
                </label>
                <input
                  type="text"
                  value={editingForm.aliasesText}
                  onChange={(e) =>
                    setEditingForm({ ...editingForm, aliasesText: e.target.value })
                  }
                  placeholder="e.g. atta, aata, flour"
                  className="mt-1 min-h-[44px] w-full rounded-xl border border-[#CFD8DC] px-3 text-base"
                />
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="min-h-[48px] rounded-xl border border-[#CFD8DC] text-base font-bold text-[#263238]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="min-h-[48px] rounded-xl bg-[#0F766E] text-base font-bold text-white"
              >
                Save Product
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
