import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Check,
  X,
  AlertTriangle,
  Upload,
  RefreshCw,
  SlidersHorizontal,
  Image as ImageIcon
} from 'lucide-react';
import { Product, ProductColor } from '../../types';
import { adminFetch } from '../../utils/adminAuth';

const CATEGORIES = ['SHIRT', 'PANT', 'JEANS', 'JACKET', 'BLAZER', 'SHOES', 'WATCHES', 'GOGGLES', 'COMBO', 'CAPS'];

export const AdminProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const res = await adminFetch('/api/admin/products');
      const json = await res.json();
      if (res.ok && json.success) {
        setProducts(json.data || []);
      }
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const showNotification = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(''), 4000);
  };

  const handleOpenAddModal = () => {
    setIsCreating(true);
    setEditingProduct({
      id: `gc-${Date.now()}`,
      name: '',
      category: 'SHIRT',
      price: 9500,
      originalPrice: 12500,
      description: '',
      fabric: '100% Egyptian Giza Cotton',
      details: ['Hand-stitched in Surat atelier', 'Mother of Pearl buttons'],
      sizes: ['38', '40', '42', '44'],
      colors: [
        {
          name: 'Imperial Obsidian',
          hex: '#0A0A0C',
          accent: '#D4AF37',
          glow: 'rgba(212, 175, 55, 0.35)',
          bgGlow: 'rgba(212, 175, 55, 0.06)',
        },
      ],
      images: {
        front: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=1000&auto=format&fit=crop',
        back: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=1000&auto=format&fit=crop',
        detail: 'https://images.unsplash.com/photo-1620012253295-c15c429f66bf?q=80&w=1000&auto=format&fit=crop',
        model: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1000&auto=format&fit=crop',
      },
      rotation360Images: [],
      rating: 4.9,
      reviewsCount: 12,
      inStock: true,
      stockCount: 25,
      tagline: 'Atelier Tailored Excellence',
    });
    setIsEditModalOpen(true);
  };

  const handleOpenEditModal = (p: Product) => {
    setIsCreating(false);
    setEditingProduct({ ...p });
    setIsEditModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !editingProduct.name) return;

    setIsSaving(true);
    try {
      if (isCreating) {
        const res = await adminFetch('/api/admin/products', {
          method: 'POST',
          body: JSON.stringify(editingProduct),
        });
        const json = await res.json();
        if (res.ok && json.success) {
          showNotification(`Created product "${editingProduct.name}" successfully.`);
          setIsEditModalOpen(false);
          loadProducts();
        }
      } else {
        const res = await adminFetch(`/api/admin/products/${editingProduct.id}`, {
          method: 'PUT',
          body: JSON.stringify(editingProduct),
        });
        const json = await res.json();
        if (res.ok && json.success) {
          showNotification(`Updated product "${editingProduct.name}" successfully.`);
          setIsEditModalOpen(false);
          loadProducts();
        }
      }
    } catch (err: any) {
      showNotification(`Save failed: ${err?.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      const res = await adminFetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        showNotification('Product deleted from atelier archive.');
        setIsDeletingId(null);
        loadProducts();
      }
    } catch (err: any) {
      showNotification(`Delete failed: ${err?.message}`);
    }
  };

  const handleToggleStockStatus = async (p: Product) => {
    const nextInStock = !p.inStock;
    try {
      const res = await adminFetch(`/api/admin/products/${p.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ inStock: nextInStock, stockCount: nextInStock ? (p.stockCount > 0 ? p.stockCount : 10) : 0 }),
      });
      if (res.ok) {
        setProducts((prev) =>
          prev.map((item) =>
            item.id === p.id
              ? { ...item, inStock: nextInStock, stockCount: nextInStock ? (item.stockCount > 0 ? item.stockCount : 10) : 0 }
              : item
          )
        );
        showNotification(`Marked "${p.name}" as ${nextInStock ? 'Active (In Stock)' : 'Inactive (Out of Stock)'}.`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const matchesQuery =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.category || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;
    return matchesQuery && matchesCategory;
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-[#D4AF37]">
            CATALOG ARCHIVE
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-wide text-[#ECE7DA] mt-0.5">
            Product Management
          </h1>
          <p className="text-xs text-[#ECE7DA]/60 mt-1">
            Maintain garment specifications, pricing, inventory units, and atelier photography.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadProducts}
            disabled={isLoading}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-[#D4AF37]/30 bg-[#14131D] text-xs font-semibold text-[#ECE7DA] hover:border-[#D4AF37] transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#D4AF37] ${isLoading ? 'animate-spin' : ''}`} />
            <span>Reload</span>
          </button>
          <button
            id="btn-admin-add-product"
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#F4E5C3] text-[#0A0A0C] font-bold text-xs tracking-wider uppercase transition-all shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div className="p-4 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#ECE7DA] text-xs flex items-center gap-2 animate-fadeIn">
          <Check className="w-4 h-4 text-[#D4AF37]" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-[#111017] border border-[#D4AF37]/20 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#D4AF37] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by product name, category, or ID..."
            className="w-full bg-[#181722] border border-[#D4AF37]/25 rounded-xl pl-10 pr-4 py-2 text-xs text-[#ECE7DA] focus:outline-none focus:border-[#D4AF37] placeholder:text-[#ECE7DA]/30"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              selectedCategory === 'ALL'
                ? 'bg-[#D4AF37] text-[#0A0A0C] font-bold'
                : 'bg-[#181722] text-[#ECE7DA]/70 hover:text-[#ECE7DA]'
            }`}
          >
            All ({products.length})
          </button>
          {CATEGORIES.map((cat) => {
            const count = products.filter((p) => p.category === cat).length;
            if (count === 0) return null;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-[#D4AF37] text-[#0A0A0C] font-bold'
                    : 'bg-[#181722] text-[#ECE7DA]/70 hover:text-[#ECE7DA]'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Products Table */}
      <div className="rounded-2xl bg-[#111017] border border-[#D4AF37]/20 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#161520] text-[#D4AF37] font-mono border-b border-[#D4AF37]/20">
                <th className="py-3.5 px-4">Piece</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Price</th>
                <th className="py-3.5 px-4">Inventory Units</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#ECE7DA]/40">
                    Loading atelier product records...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#ECE7DA]/40">
                    No matching products found.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.images?.front}
                          alt={p.name}
                          className="w-12 h-14 object-cover rounded-lg border border-[#D4AF37]/30 shrink-0 bg-[#0A0A0C]"
                        />
                        <div>
                          <h4 className="font-semibold text-sm text-[#ECE7DA]">{p.name}</h4>
                          <span className="text-[10px] font-mono text-[#ECE7DA]/50 block">{p.id}</span>
                          <span className="text-[10px] text-[#D4AF37] block mt-0.5">{p.fabric}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-md bg-[#1D1C2A] text-[#ECE7DA] font-mono text-[11px] font-semibold">
                        {p.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-sm text-[#D4AF37]">
                      ₹{(p.price || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      <span
                        className={`font-semibold ${
                          p.stockCount <= 5 ? 'text-[#EF4444]' : p.stockCount <= 12 ? 'text-[#F59E0B]' : 'text-[#ECE7DA]'
                        }`}
                      >
                        {p.stockCount} units
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => handleToggleStockStatus(p)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition-all cursor-pointer ${
                          p.inStock
                            ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/40'
                            : 'bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/40'
                        }`}
                        title="Click to toggle In Stock / Out of Stock"
                      >
                        {p.inStock ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        <span>{p.inStock ? 'ACTIVE' : 'INACTIVE'}</span>
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditModal(p)}
                          className="p-2 rounded-lg bg-[#1D1C2A] text-[#ECE7DA]/80 hover:text-[#D4AF37] hover:bg-[#D4AF37]/15 transition-colors cursor-pointer"
                          title="Edit Product"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setIsDeletingId(p.id)}
                          className="p-2 rounded-lg bg-[#1D1C2A] text-[#ECE7DA]/80 hover:text-[#EF4444] hover:bg-[#EF4444]/15 transition-colors cursor-pointer"
                          title="Delete Product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Add / Edit Product Modal */}
      {isEditModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="bg-[#14131D] border border-[#D4AF37]/40 rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative my-auto max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#ECE7DA]">
                  {isCreating ? 'Add New Atelier Garment' : `Edit Product: ${editingProduct.name}`}
                </h3>
                <span className="text-[10px] font-mono text-[#D4AF37] uppercase">
                  Product ID: {editingProduct.id}
                </span>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 rounded-lg text-[#ECE7DA]/60 hover:text-[#ECE7DA]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 overflow-y-auto pr-1 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-[#ECE7DA]/70 mb-1">
                    Product Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingProduct.name || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    className="w-full bg-[#181722] border border-[#D4AF37]/30 rounded-xl px-3.5 py-2.5 text-xs text-[#ECE7DA] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-[#ECE7DA]/70 mb-1">
                    Category *
                  </label>
                  <select
                    value={editingProduct.category || 'SHIRT'}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                    className="w-full bg-[#181722] border border-[#D4AF37]/30 rounded-xl px-3.5 py-2.5 text-xs text-[#ECE7DA] focus:outline-none focus:border-[#D4AF37]"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-[#ECE7DA]/70 mb-1">
                    Price (INR) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={editingProduct.price ?? ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                    className="w-full bg-[#181722] border border-[#D4AF37]/30 rounded-xl px-3.5 py-2.5 text-xs text-[#ECE7DA] font-mono focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-[#ECE7DA]/70 mb-1">
                    Original Price
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editingProduct.originalPrice ?? ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, originalPrice: Number(e.target.value) })}
                    className="w-full bg-[#181722] border border-[#D4AF37]/30 rounded-xl px-3.5 py-2.5 text-xs text-[#ECE7DA] font-mono focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-[#ECE7DA]/70 mb-1">
                    Stock Units *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={editingProduct.stockCount ?? ''}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        stockCount: Number(e.target.value),
                        inStock: Number(e.target.value) > 0,
                      })
                    }
                    className="w-full bg-[#181722] border border-[#D4AF37]/30 rounded-xl px-3.5 py-2.5 text-xs text-[#ECE7DA] font-mono focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-[#ECE7DA]/70 mb-1">
                  Fabric / Material Spec
                </label>
                <input
                  type="text"
                  value={editingProduct.fabric || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, fabric: e.target.value })}
                  placeholder="e.g. 100% Giza Cotton with Surat Zari weave"
                  className="w-full bg-[#181722] border border-[#D4AF37]/30 rounded-xl px-3.5 py-2.5 text-xs text-[#ECE7DA] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-[#ECE7DA]/70 mb-1">
                  Product Description
                </label>
                <textarea
                  rows={3}
                  value={editingProduct.description || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  placeholder="Artisanal description of craftsmanship and cut..."
                  className="w-full bg-[#181722] border border-[#D4AF37]/30 rounded-xl px-3.5 py-2 text-xs text-[#ECE7DA] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              {/* Images URLs */}
              <div className="space-y-2">
                <label className="block text-xs font-mono uppercase text-[#ECE7DA]/70">
                  Primary Front Image URL
                </label>
                <div className="flex items-center gap-3">
                  {editingProduct.images?.front && (
                    <img
                      src={editingProduct.images.front}
                      alt="Preview"
                      className="w-12 h-14 object-cover rounded-lg border border-[#D4AF37]/40 shrink-0"
                    />
                  )}
                  <input
                    type="url"
                    required
                    value={editingProduct.images?.front || ''}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        images: {
                          front: e.target.value,
                          back: editingProduct.images?.back || e.target.value,
                          detail: editingProduct.images?.detail || e.target.value,
                          model: editingProduct.images?.model || e.target.value,
                        },
                      })
                    }
                    className="flex-1 bg-[#181722] border border-[#D4AF37]/30 rounded-xl px-3.5 py-2.5 text-xs text-[#ECE7DA] font-mono focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="product-in-stock"
                  checked={editingProduct.inStock !== false}
                  onChange={(e) => setEditingProduct({ ...editingProduct, inStock: e.target.checked })}
                  className="w-4 h-4 accent-[#D4AF37] rounded"
                />
                <label htmlFor="product-in-stock" className="text-xs text-[#ECE7DA] font-semibold cursor-pointer">
                  Mark product as active and in stock on storefront
                </label>
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-white/10 text-xs text-[#ECE7DA] hover:bg-white/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#F4E5C3] text-[#0A0A0C] font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md disabled:opacity-50"
                >
                  {isSaving ? 'Saving Product...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Delete Confirmation Modal */}
      {isDeletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#14131D] border border-[#EF4444]/40 rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-[#EF4444]/15 border border-[#EF4444]/40 flex items-center justify-center text-[#EF4444] mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-serif text-base font-bold text-[#ECE7DA]">Delete Product?</h4>
              <p className="text-xs text-[#ECE7DA]/60 mt-1">
                Are you sure you want to permanently remove this piece from the archive?
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setIsDeletingId(null)}
                className="px-4 py-2 rounded-xl border border-white/10 text-xs text-[#ECE7DA] hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteProduct(isDeletingId)}
                className="px-5 py-2 rounded-xl bg-[#EF4444] text-white font-bold text-xs uppercase tracking-wider hover:bg-[#DC2626]"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
