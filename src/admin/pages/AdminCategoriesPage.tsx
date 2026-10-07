import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Tags, Package, ArrowRight, RefreshCw, Layers } from 'lucide-react';
import { adminFetch } from '../../utils/adminAuth';

interface CategoryItem {
  category: string;
  count: number;
}

export const AdminCategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadCategories = async () => {
    setIsLoading(true);
    try {
      const res = await adminFetch('/api/admin/categories');
      const json = await res.json();
      if (res.ok && json.success) {
        setCategories(json.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const totalPieces = categories.reduce((sum, c) => sum + c.count, 0);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-[#D4AF37]">
            COLLECTION TAXONOMY
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-wide text-[#ECE7DA] mt-0.5">
            Categories & Classifications
          </h1>
          <p className="text-xs text-[#ECE7DA]/60 mt-1">
            Overview of couture categories, inventory volume per line, and department allocations.
          </p>
        </div>

        <button
          onClick={loadCategories}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#D4AF37]/30 bg-[#14131D] text-xs font-semibold text-[#ECE7DA] hover:border-[#D4AF37] transition-all cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#D4AF37] ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Categories</span>
        </button>
      </div>

      {/* Grid of Categories */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {categories.map((c) => {
          const share = totalPieces > 0 ? Math.round((c.count / totalPieces) * 100) : 0;
          return (
            <div
              key={c.category}
              className="p-6 rounded-2xl bg-[#111017] border border-[#D4AF37]/25 shadow-xl space-y-4 hover:border-[#D4AF37]/60 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/15 flex items-center justify-center text-[#D4AF37] group-hover:scale-105 transition-transform">
                  <Tags className="w-5 h-5" />
                </div>
                <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-[#1D1C2A] text-[#D4AF37]">
                  {c.count} items
                </span>
              </div>

              <div>
                <h3 className="font-serif text-lg font-bold text-[#ECE7DA] tracking-wider">
                  {c.category}
                </h3>
                <span className="text-xs text-[#ECE7DA]/50 block mt-0.5 font-mono">
                  {share}% of atelier catalog
                </span>
              </div>

              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-[#D4AF37]">
                <Link
                  to="/admin/products"
                  className="hover:underline flex items-center gap-1 font-mono font-semibold"
                >
                  <span>Browse Products</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
