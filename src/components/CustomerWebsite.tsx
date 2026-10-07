import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { CinematicIntro } from './CinematicIntro';
import { Navbar } from './Navbar';
import { HeroSection } from './HeroSection';
import { FeaturedCollection } from './FeaturedCollection';
import { AboutSection } from './AboutSection';
import { BrandPhilosophy } from './BrandPhilosophy';
import { Footer } from './Footer';
import { ProductDetailModal } from './ProductDetailModal';
import { SizeGuideModal } from './SizeGuideModal';
import { CartDrawer, WishlistDrawer } from './CartDrawer';
import { CheckoutModal } from './CheckoutModal';
import { AuthModal } from './AuthModal';
import { SearchOverlay } from './SearchOverlay';

import { INITIAL_PRODUCTS, CURRENCIES } from '../data/products';
import { Product, CartItem, UserAccount, CustomerOrder, CurrencyConfig, ProductColor, ShippingConfig } from '../types';
import { safeStorage } from '../utils/storage';
import { syncRegisteredUsersFromMongo } from '../utils/authStorage';
import {
  fetchProductsFromMongo,
  fetchOrdersFromMongo,
  fetchShippingConfigFromMongo,
  updateOrderStatusInMongo,
  saveShippingConfigToMongo,
} from '../utils/mongoDb';

// Run initial storage health & quota check
safeStorage.sanitizeQuota();

export const CustomerWebsite: React.FC = () => {
  const location = useLocation();

  // 1. Cinematic Intro State (Skip if directly navigating to specific sub-path)
  const [showIntro, setShowIntro] = useState<boolean>(() => {
    return location.pathname === '/' || location.pathname === '';
  });

  // 2. Product Dataset (Synced with safeStorage)
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = safeStorage.getItem('gc_products');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved products', e);
      }
    }
    return INITIAL_PRODUCTS;
  });

  // 3. Cart State (Synced with safeStorage, with sanitization)
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    const saved = safeStorage.getItem('gc_cart');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((item: any) => item && item.product && typeof item.product === 'object' && item.product.id).map((item: any) => {
            const fallbackColor = item.product.colors?.[0] || { name: 'Imperial Obsidian', hex: '#0A0A0C', accent: '#D4AF37', glow: '', bgGlow: '' };
            return {
              ...item,
              productId: item.productId || item.product.id,
              selectedColor: item.selectedColor && item.selectedColor.name ? item.selectedColor : fallbackColor,
              selectedSize: item.selectedSize || item.product.sizes?.[0] || 'Standard',
              quantity: typeof item.quantity === 'number' && item.quantity > 0 ? item.quantity : 1,
            };
          });
        }
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  });

  // 4. Wishlist State (Synced with safeStorage, with sanitization)
  const [wishlistItems, setWishlistItems] = useState<CartItem[]>(() => {
    const saved = safeStorage.getItem('gc_wishlist');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((item: any) => item && item.product && typeof item.product === 'object' && item.product.id).map((item: any) => {
            const fallbackColor = item.product.colors?.[0] || { name: 'Imperial Obsidian', hex: '#0A0A0C', accent: '#D4AF37', glow: '', bgGlow: '' };
            return {
              ...item,
              productId: item.productId || item.product.id,
              selectedColor: item.selectedColor && item.selectedColor.name ? item.selectedColor : fallbackColor,
              selectedSize: item.selectedSize || item.product.sizes?.[0] || 'Standard',
              quantity: 1,
            };
          });
        }
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  });

  // 5. Orders State
  const [orders, setOrders] = useState<CustomerOrder[]>(() => {
    const saved = safeStorage.getItem('gc_orders');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  });

  // 6. User Account State
  const [user, setUser] = useState<UserAccount>(() => {
    const saved = safeStorage.getItem('gc_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      isLoggedIn: false,
    };
  });

  // 7. Active Currency State
  const [activeCurrency, setActiveCurrency] = useState<CurrencyConfig>(CURRENCIES[0]);

  // 7.1. Theme Mode State (Dark / Light)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = safeStorage.getItem('gc_theme');
    return saved === 'light' || saved === 'dark' ? saved : 'dark';
  });

  // 7.2. Shipping Configuration State
  const [shippingConfig, setShippingConfig] = useState<ShippingConfig>(() => {
    const saved = safeStorage.getItem('gc_shipping_config');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved shipping config', e);
      }
    }
    return {
      shippingChargesEnabled: true,
      standardShippingFee: 450,
      freeShippingThreshold: 15000,
      shippingLabel: 'Express White-Glove Shipping',
    };
  });

  // 8. Atelier Story / About Section Image
  const [aboutImage, setAboutImage] = useState<string>(() => {
    const saved = safeStorage.getItem('gc_about_image');
    return saved || 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1200&auto=format&fit=crop';
  });

  // 9. Hero / Homepage Background Image
  const [heroBgImage, setHeroBgImage] = useState<string>(() => {
    const saved = safeStorage.getItem('gc_hero_bg_image');
    return saved || 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?q=80&w=2000&auto=format&fit=crop';
  });

  // 10. Modals & Overlays Visibility
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(() => location.pathname === '/cart');
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(() => location.pathname === '/login');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // 11. Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Route-based scrolling & drawer opening
  useEffect(() => {
    if (location.pathname === '/products') {
      const el = document.getElementById('collection') || document.getElementById('featured-collection');
      el?.scrollIntoView({ behavior: 'smooth' });
    } else if (location.pathname === '/about') {
      const el = document.getElementById('about');
      el?.scrollIntoView({ behavior: 'smooth' });
    } else if (location.pathname === '/contact') {
      const el = document.getElementById('footer');
      el?.scrollIntoView({ behavior: 'smooth' });
    } else if (location.pathname === '/cart') {
      setIsCartOpen(true);
    } else if (location.pathname === '/login') {
      setIsAuthOpen(true);
    }
  }, [location.pathname]);

  // Sync to safeStorage
  useEffect(() => {
    safeStorage.setItem('gc_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    safeStorage.setItem('gc_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    safeStorage.setItem('gc_wishlist', JSON.stringify(wishlistItems));
  }, [wishlistItems]);

  useEffect(() => {
    safeStorage.setItem('gc_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    safeStorage.setItem('gc_shipping_config', JSON.stringify(shippingConfig));
  }, [shippingConfig]);

  useEffect(() => {
    safeStorage.setItem('gc_about_image', aboutImage);
  }, [aboutImage]);

  useEffect(() => {
    safeStorage.setItem('gc_hero_bg_image', heroBgImage);
  }, [heroBgImage]);

  useEffect(() => {
    safeStorage.setItem('gc_user', JSON.stringify(user));
  }, [user]);

  // Initial Sync from MongoDB Database
  useEffect(() => {
    let isMounted = true;

    async function loadCloudData() {
      try {
        const cloudProducts = await fetchProductsFromMongo();
        if (isMounted && cloudProducts && cloudProducts.length > 0) {
          setProducts(cloudProducts);
        }

        const cloudOrders = await fetchOrdersFromMongo();
        if (isMounted && cloudOrders && cloudOrders.length > 0) {
          setOrders(cloudOrders);
        }

        const cloudShipping = await fetchShippingConfigFromMongo();
        if (isMounted && cloudShipping) {
          setShippingConfig(cloudShipping);
        }

        await syncRegisteredUsersFromMongo();
      } catch (err) {
        console.warn('[MongoDB Init] Cloud data sync fallback:', err);
      }
    }

    loadCloudData();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    safeStorage.setItem('gc_theme', theme);
    if (theme === 'light') {
      document.documentElement.classList.add('light-theme');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.remove('light-theme');
      document.documentElement.classList.add('dark');
    }
  }, [theme]);

  // Handlers
  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsDetailModalOpen(true);
  };

  const handleAddToCart = (
    itemOrProduct: CartItem | Product,
    customColor?: ProductColor,
    customSize?: string,
    customQty: number = 1
  ) => {
    if (!itemOrProduct) return;

    let cartItem: CartItem;

    if ('product' in itemOrProduct && itemOrProduct.product) {
      const p = itemOrProduct.product;
      const col = itemOrProduct.selectedColor && itemOrProduct.selectedColor.name
        ? itemOrProduct.selectedColor
        : (p.colors?.[0] || { name: 'Imperial Obsidian', hex: '#0A0A0C', accent: '#D4AF37', glow: '', bgGlow: '' });
      const sz = itemOrProduct.selectedSize || p.sizes?.[0] || 'Standard';
      const qty = typeof itemOrProduct.quantity === 'number' && itemOrProduct.quantity > 0 ? itemOrProduct.quantity : 1;

      cartItem = {
        id: itemOrProduct.id || `${p.id}-${col.name}-${sz}-${Date.now()}`,
        productId: p.id,
        product: p,
        selectedColor: col,
        selectedSize: sz,
        quantity: qty,
      };
    } else {
      const p = itemOrProduct as Product;
      const col = customColor && customColor.name
        ? customColor
        : (p.colors?.[0] || { name: 'Imperial Obsidian', hex: '#0A0A0C', accent: '#D4AF37', glow: '', bgGlow: '' });
      const sz = customSize || p.sizes?.[0] || 'Standard';
      const qty = typeof customQty === 'number' && customQty > 0 ? customQty : 1;

      cartItem = {
        id: `${p.id}-${col.name}-${sz}-${Date.now()}`,
        productId: p.id,
        product: p,
        selectedColor: col,
        selectedSize: sz,
        quantity: qty,
      };
    }

    setCartItems((prev) => {
      const safePrev = Array.isArray(prev) ? prev : [];
      const existingIdx = safePrev.findIndex(
        (i) =>
          i &&
          i.productId === cartItem.productId &&
          (i.selectedColor?.name || '') === (cartItem.selectedColor?.name || '') &&
          (i.selectedSize || '') === (cartItem.selectedSize || '')
      );
      if (existingIdx > -1) {
        const updated = [...safePrev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: (updated[existingIdx].quantity || 1) + cartItem.quantity,
        };
        return updated;
      }
      return [...safePrev, cartItem];
    });

    showToast(`Added "${cartItem.product?.name || 'Item'}" to your Shopping Bag.`);
  };

  const handleUpdateCartQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveFromCart(id);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  };

  const handleRemoveFromCart = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
    showToast('Piece removed from bag.');
  };

  const handleToggleWishlist = (product: Product) => {
    const isAlreadyWishlisted = wishlistItems.some((w) => w.productId === product.id);

    if (isAlreadyWishlisted) {
      setWishlistItems((prev) => prev.filter((w) => w.productId !== product.id));
      showToast(`Removed "${product.name}" from Atelier Wishlist.`);
    } else {
      const newItem: CartItem = {
        id: `${product.id}-${Date.now()}`,
        productId: product.id,
        product: product,
        selectedColor: product.colors[0],
        selectedSize: product.sizes[0],
        quantity: 1,
      };
      setWishlistItems((prev) => [...prev, newItem]);
      showToast(`Saved "${product.name}" to Atelier Wishlist.`);
    }
  };

  const handleDirectBuyNow = (product: Product, color: ProductColor, size: string, quantity: number) => {
    handleAddToCart(product, color, size, quantity);
    setIsDetailModalOpen(false);
    if (!user.isLoggedIn) {
      setIsAuthOpen(true);
      showToast('Please authenticate with your ID to proceed to VIP payment.');
    } else {
      setIsCheckoutOpen(true);
    }
  };

  const handleOrderComplete = (newOrder: CustomerOrder) => {
    setOrders((prev) => [newOrder, ...prev]);
    setCartItems([]);
    showToast(`Order #${newOrder.id.slice(-6).toUpperCase()} confirmed. White-glove concierge dispatched.`);
  };

  const handleUpdateOrderStatus = (orderId: string, status: CustomerOrder['status']) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o))
    );
    updateOrderStatusInMongo(orderId, status).catch((err) => {
      console.warn('[MongoDB Sync] Order status update warning:', err);
    });
    showToast(`Order status updated to ${status}.`);
  };

  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const totalWishlistCount = wishlistItems.length;

  return (
    <div className={`min-h-screen ${theme === 'light' ? 'bg-[#F9F8F6] text-[#1A1924]' : 'bg-[#0A0A0C] text-[#ECE7DA]'} font-sans relative selection:bg-[#D4AF37] selection:text-[#0A0A0C]`}>
      {/* 1. Full-Screen Cinematic Intro */}
      {showIntro && <CinematicIntro onComplete={() => setShowIntro(false)} />}

      {/* 2. Global Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-24 right-6 z-[100] px-5 py-3 rounded-xl bg-[#14131A] border border-[#D4AF37] text-xs font-semibold tracking-wider text-[#D4AF37] shadow-[0_10px_30px_rgba(0,0,0,0.8),0_0_20px_rgba(212,175,55,0.3)] animate-fadeIn flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-ping" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 3. Top Navigation Bar (NO ADMIN LINK) */}
      <Navbar
        cartCount={totalCartCount}
        wishlistCount={totalWishlistCount}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenWishlist={() => setIsWishlistOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onReplayIntro={() => setShowIntro(true)}
        user={user}
        activeCurrency={activeCurrency}
        onSelectCurrency={setActiveCurrency}
        theme={theme}
        onSelectTheme={(newTheme) => setTheme(newTheme)}
        onToggleTheme={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
      />

      {/* 4. Main Cinematic Content View */}
      <main className="relative">
        {/* Cinematic Hero */}
        <HeroSection
          backgroundImage={heroBgImage}
          onExplore={() => {
            const el = document.getElementById('collection');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
        />

        {/* Featured Product Collection Grid */}
        <FeaturedCollection
          products={products}
          onSelectProduct={handleSelectProduct}
          onAddToCart={(product) => {
            handleAddToCart({
              id: `${product.id}-${Date.now()}`,
              productId: product.id,
              product: product,
              selectedColor: product.colors[0],
              selectedSize: product.sizes[0],
              quantity: 1,
            });
          }}
          onToggleWishlist={handleToggleWishlist}
          wishlistProductIds={wishlistItems.map((w) => w.productId)}
          wishlistIds={wishlistItems.map((w) => w.productId)}
          currencySymbol={activeCurrency.symbol}
          currencyRate={activeCurrency.rate}
        />

        {/* About Section (Surat Atelier Story) */}
        <AboutSection aboutImage={aboutImage} />

        {/* Brand Philosophy (CRAFT, IDENTITY, LEGACY) */}
        <BrandPhilosophy />
      </main>

      {/* 5. Footer (NO ADMIN LINK) */}
      <Footer
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* 6. Modals & Overlays */}
      <ProductDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        product={selectedProduct}
        onAddToCart={handleAddToCart}
        onBuyNow={handleDirectBuyNow}
        onOpenSizeGuide={() => setIsSizeGuideOpen(true)}
        currencySymbol={activeCurrency.symbol}
        currencyRate={activeCurrency.rate}
        onToggleWishlist={handleToggleWishlist}
        isWishlisted={selectedProduct ? wishlistItems.some(w => w.productId === selectedProduct.id) : false}
        onColorChange={() => {}}
      />

      <SizeGuideModal
        isOpen={isSizeGuideOpen}
        onClose={() => setIsSizeGuideOpen(false)}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveFromCart}
        isLoggedIn={user.isLoggedIn}
        shippingConfig={shippingConfig}
        onRequireLogin={() => {
          setIsCartOpen(false);
          setIsAuthOpen(true);
          showToast('Please log in with your ID to proceed to payment.');
        }}
        onProceedToCheckout={() => {
          if (!user.isLoggedIn) {
            setIsCartOpen(false);
            setIsAuthOpen(true);
            showToast('Please log in with your ID to proceed to payment.');
            return;
          }
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
        currencySymbol={activeCurrency.symbol}
        currencyRate={activeCurrency.rate}
      />

      <WishlistDrawer
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
        items={wishlistItems}
        onRemoveFromWishlist={(id) => {
          setWishlistItems((prev) => prev.filter((w) => w.productId !== id));
        }}
        onMoveToCart={(product) => {
          handleAddToCart({
            id: `${product.id}-${Date.now()}`,
            productId: product.id,
            product: product,
            selectedColor: product.colors[0],
            selectedSize: product.sizes[0],
            quantity: 1,
          });
          setWishlistItems((prev) => prev.filter((w) => w.productId !== product.id));
          setIsWishlistOpen(false);
          setIsCartOpen(true);
        }}
        currencySymbol={activeCurrency.symbol}
        currencyRate={activeCurrency.rate}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cartItems={cartItems}
        onOrderComplete={handleOrderComplete}
        currencySymbol={activeCurrency.symbol}
        currencyRate={activeCurrency.rate}
        currentUser={user}
        shippingConfig={shippingConfig}
        onRequireLogin={() => {
          setIsCheckoutOpen(false);
          setIsAuthOpen(true);
          showToast('Please log in with your ID to authorize payment.');
        }}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={user}
        onLogout={() => {
          setUser({
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            isLoggedIn: false,
          });
          showToast('You have been logged out.');
        }}
        onLoginSuccess={(loggedUser) => {
          setUser(loggedUser);
          showToast(`Welcome, ${loggedUser.firstName}! Privilege activated.`);
        }}
      />

      <SearchOverlay
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        products={products}
        onSelectProduct={handleSelectProduct}
        currencySymbol={activeCurrency.symbol}
        currencyRate={activeCurrency.rate}
      />
    </div>
  );
};
