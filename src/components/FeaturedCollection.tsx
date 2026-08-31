import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Eye,
  ShoppingBag,
  Heart,
  Sparkles,
  RotateCw,
  SlidersHorizontal,
  Star
} from 'lucide-react';
import { Product, ProductColor } from '../types';

interface FeaturedCollectionProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product, color?: ProductColor, size?: string) => void;
  onToggleWishlist: (product: Product) => void;
  wishlistProductIds?: string[];
  wishlistIds?: string[];
  currencySymbol: string;
  currencyRate: number;
}

export const FeaturedCollection: React.FC<FeaturedCollectionProps> = ({
  products,
  onSelectProduct,
  onAddToCart,
  onToggleWishlist,
  wishlistProductIds = [],
  wishlistIds = [],
  currencySymbol,
  currencyRate,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);

  const activeWishlist = Array.isArray(wishlistProductIds) && wishlistProductIds.length > 0
    ? wishlistProductIds
    : (Array.isArray(wishlistIds) ? wishlistIds : []);

  const categories = [
    { label: `ALL PIECES (${products.length})`, value: 'ALL' },
    { label: 'SHIRT', value: 'SHIRT' },
    { label: 'PANT', value: 'PANT' },
    { label: 'JEANS', value: 'JEANS' },
    { label: 'JACKET', value: 'JACKET' },
    { label: 'BLAZER', value: 'BLAZER' },
    { label: 'SHOES', value: 'SHOES' },
    { label: 'WATCHES', value: 'WATCHES' },
    { label: 'GOGGLES', value: 'GOGGLES' },
    { label: 'COMBO', value: 'COMBO' },
    { label: 'CAPS', value: 'CAPS' },
  ];

  const filteredProducts =
    activeCategory === 'ALL'
      ? products
      : products.filter((p) => p.category === activeCategory);

  const formatPrice = (priceInInr: number) => {
    const converted = Math.round(priceInInr * currencyRate);
    return `${currencySymbol}${converted.toLocaleString('en-IN')}`;
  };

  return (
    <section id="featured-collection" className="relative py-24 sm:py-32 bg-[#0A0A0C] overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-1/4 -right-40 w-[600px] h-[600px] rounded-full bg-[#D4AF37]/5 blur-[160px] pointer-events-none" />
      <div className="absolute bottom-10 -left-40 w-[600px] h-[600px] rounded-full bg-[#8B6F1F]/5 blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center mb-16">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-10 h-px bg-[#D4AF37]/50" />
            <span className="text-xs font-medium tracking-[0.35em] text-[#D4AF37] uppercase">
              HAUTE SIGNATURES
            </span>
            <span className="w-10 h-px bg-[#D4AF37]/50" />
          </div>

          <h2 className="font-cinzel text-3xl sm:text-5xl font-bold tracking-[0.16em] text-[#ECE7DA]">
            FEATURED COLLECTION
          </h2>

          <p className="mt-4 text-xs sm:text-sm text-[#ECE7DA]/65 max-w-2xl font-light tracking-wide">
            Eight essential pillars of refined modern menswear. Handcrafted in our Surat atelier, marrying heritage textile weaving with avant-garde tailoring.
          </p>

          {/* Category Filter Tabs */}
          <div className="mt-10 flex items-center justify-center gap-2 sm:gap-3 flex-wrap max-w-4xl">
            {categories.map((cat) => (
              <button
                key={cat.value}
                id={`filter-${cat.value.toLowerCase()}`}
                onClick={() => setActiveCategory(cat.value)}
                className={`px-4 py-2 rounded-full text-[11px] font-medium tracking-[0.2em] uppercase transition-all duration-300 cursor-pointer ${
                  activeCategory === cat.value
                    ? 'bg-[#D4AF37] text-[#0A0A0C] font-semibold shadow-[0_0_20px_rgba(212,175,55,0.4)]'
                    : 'bg-[#14131A] text-[#ECE7DA]/70 hover:text-[#D4AF37] border border-[#D4AF37]/20 hover:border-[#D4AF37]/50'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8"
        >
          <AnimatePresence>
            {filteredProducts.map((product, idx) => {
              const isWishlisted = activeWishlist.includes(product.id);
              const isHovered = hoveredCardId === product.id;

              return (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.5, delay: idx * 0.05 }}
                  onMouseEnter={() => setHoveredCardId(product.id)}
                  onMouseLeave={() => setHoveredCardId(null)}
                  data-cursor="product"
                  data-cursor-label="VIEW"
                  className="group relative bg-[#14131A] rounded-xl overflow-hidden border border-[#D4AF37]/20 hover:border-[#D4AF37]/70 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_15px_35px_rgba(0,0,0,0.8),0_0_25px_rgba(212,175,55,0.18)] flex flex-col justify-between"
                >
                  {/* Top Image Container */}
                  <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#0F0E15] cursor-pointer" onClick={() => onSelectProduct(product)}>
                    {/* Main Image */}
                    <img
                      src={product.images.front}
                      alt={product.name}
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      className="w-full h-full object-cover object-center"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#14131A] via-transparent to-black/30 pointer-events-none" />

                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10 pointer-events-none">
                      {product.isBestseller && (
                        <span className="px-2.5 py-0.5 rounded-full bg-[#D4AF37] text-[#0A0A0C] text-[9px] font-bold tracking-widest uppercase">
                          BESTSELLER
                        </span>
                      )}
                      {product.isNew && (
                        <span className="px-2.5 py-0.5 rounded-full bg-[#10B981] text-[#0A0A0C] text-[9px] font-bold tracking-widest uppercase">
                          NEW PIECE
                        </span>
                      )}
                    </div>

                    {/* 360° Rotator Tag */}
                    <div className="absolute top-3 right-12 z-10">
                      <span
                        title="360° Interactive Viewer Available"
                        className="w-7 h-7 rounded-full bg-[#0A0A0C]/70 backdrop-blur-md border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] hover:scale-110 transition-transform"
                      >
                        <RotateCw className="w-3.5 h-3.5 animate-spin-slow" />
                      </span>
                    </div>

                    {/* Wishlist Heart Button */}
                    <button
                      id={`btn-wishlist-${product.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleWishlist(product);
                      }}
                      className={`absolute top-3 right-3 z-10 w-7 h-7 rounded-full backdrop-blur-md border flex items-center justify-center transition-all duration-300 cursor-pointer ${
                        isWishlisted
                          ? 'bg-[#D4AF37] border-[#D4AF37] text-[#0A0A0C]'
                          : 'bg-[#0A0A0C]/70 border-[#D4AF37]/30 text-[#ECE7DA] hover:text-[#D4AF37] hover:border-[#D4AF37]'
                      }`}
                      aria-label="Toggle Wishlist"
                    >
                      <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-current' : ''}`} />
                    </button>

                    {/* Hover Quick View Trigger bar */}
                    <div className="absolute inset-x-3 bottom-3 z-10 translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectProduct(product);
                        }}
                        className="flex-1 py-2.5 rounded-lg bg-[#0A0A0C]/90 backdrop-blur-md border border-[#D4AF37]/60 text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#0A0A0C] text-[11px] font-semibold tracking-widest uppercase transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-lg"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>VIEW PRODUCT</span>
                      </button>
                    </div>
                  </div>

                  {/* Product Details Area */}
                  <div className="p-5 flex flex-col flex-1 justify-between">
                    <div>
                      {/* Category */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[10px] font-semibold tracking-[0.25em] uppercase text-[#D4AF37]">
                          {product.category}
                        </span>
                      </div>

                      {/* Product Title */}
                      <h3
                        onClick={() => onSelectProduct(product)}
                        className="font-cinzel text-lg font-bold tracking-wider text-[#ECE7DA] group-hover:text-[#D4AF37] transition-colors cursor-pointer"
                      >
                        {product.name}
                      </h3>

                      {/* Short Tagline */}
                      <p className="mt-1 text-xs text-[#ECE7DA]/60 line-clamp-1 font-light">
                        {product.tagline}
                      </p>

                      {/* Rating */}
                      <div className="mt-2 flex items-center gap-1 text-[#D4AF37] text-xs">
                        <Star className="w-3 h-3 fill-current" />
                        <span className="font-semibold text-[11px]">{product.rating}</span>
                        <span className="text-[#ECE7DA]/40 text-[10px]">({product.reviewsCount})</span>
                      </div>
                    </div>

                    {/* Pricing & Add To Cart Button */}
                    <div className="mt-4 pt-3 border-t border-[#D4AF37]/15 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-base font-bold tracking-wide text-[#ECE7DA] font-cinzel">
                          {formatPrice(product.price)}
                        </span>
                        {product.originalPrice && (
                          <span className="text-[11px] text-[#ECE7DA]/40 line-through">
                            {formatPrice(product.originalPrice)}
                          </span>
                        )}
                      </div>

                      {/* Add to Cart Quick CTA */}
                      <button
                        id={`btn-add-cart-${product.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToCart(product);
                        }}
                        className="p-2.5 rounded-full bg-[#1F1E29] hover:bg-[#D4AF37] text-[#D4AF37] hover:text-[#0A0A0C] border border-[#D4AF37]/30 hover:border-[#D4AF37] transition-all duration-300 cursor-pointer shadow-md"
                        title="Add to Bag"
                        aria-label={`Add ${product.name} to bag`}
                      >
                        <ShoppingBag className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
};
