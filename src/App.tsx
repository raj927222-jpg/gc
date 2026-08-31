import React, { useState, useEffect } from 'react';
import { CinematicIntro } from './components/CinematicIntro';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { FeaturedCollection } from './components/FeaturedCollection';
import { AboutSection } from './components/AboutSection';
import { BrandPhilosophy } from './components/BrandPhilosophy';
import { Footer } from './components/Footer';
import { ProductDetailModal } from './components/ProductDetailModal';
import { SizeGuideModal } from './components/SizeGuideModal';
import { CartDrawer, WishlistDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { AuthModal } from './components/AuthModal';
import { SearchOverlay } from './components/SearchOverlay';
import { AdminPanel } from './components/AdminPanel';

import { INITIAL_PRODUCTS, CURRENCIES } from './data/products';
import { Product, CartItem, UserAccount, CustomerOrder, CurrencyConfig, ProductColor, ShippingConfig } from './types';
import { safeStorage } from './utils/storage';
import { syncRegisteredUsersFromSupabase } from './utils/authStorage';
import {
  fetchProductsFromSupabase,
  fetchOrdersFromSupabase,
  fetchShippingConfigFromSupabase,
  updateOrderStatusInSupabase,
  saveShippingConfigToSupabase,
} from './utils/supabaseDb';

// Run initial storage health & quota check
safeStorage.sanitizeQuota();

export const App: React.FC = () => {
  // 1. Cinematic Intro State
  const [showIntro, setShowIntro] = useState<boolean>(true);

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

  // 5. Orders State (for Admin & User history)
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

  // 7.2. Shipping Configuration State (Synced with safeStorage)
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

  // 8. Atelier Story / About Section Image (Synced with safeStorage)
  const [aboutImage, setAboutImage] = useState<string>(() => {
    const saved = safeStorage.getItem('gc_about_image');
    return saved || 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1200&auto=format&fit=crop';
  });

  // 9. Hero / Homepage Background Image (Synced with safeStorage)
  const [heroBgImage, setHeroBgImage] = useState<string>(() => {
    const saved = safeStorage.getItem('gc_hero_bg_image');
    return saved || 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?q=80&w=2000&auto=format&fit=crop';
  });

  // 10. Modals & Overlays Visibility
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // 9. Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

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

  // Initial Sync from Supabase Cloud Database (if available)
  useEffect(() => {
    let isMounted = true;

    async function loadCloudData() {
      try {
        // 1. Fetch cloud products
        const cloudProducts = await fetchProductsFromSupabase();
        if (isMounted && cloudProducts && cloudProducts.length > 0) {
          setProducts(cloudProducts);
        }

        // 2. Fetch cloud orders
        const cloudOrders = await fetchOrdersFromSupabase();
        if (isMounted && cloudOrders && cloudOrders.length > 0) {
          setOrders(cloudOrders);
        }

        // 3. Fetch cloud shipping config
        const cloudShipping = await fetchShippingConfigFromSupabase();
        if (isMounted && cloudShipping) {
          setShippingConfig(cloudShipping);
        }

        // 4. Sync registered users from cloud
        await syncRegisteredUsersFromSupabase();
      } catch (err) {
        console.warn('[Supabase Init] Cloud data sync error (fallback to local state):', err);
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
      // It's a CartItem
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
      // It's a Product
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
  };

  const handleToggleWishlist = (product: Product) => {
    if (!product) return;
    const isExisting = wishlistItems.some((w) => w && (w.productId === product.id || w.product?.id === product.id));
    if (isExisting) {
      setWishlistItems((prev) => prev.filter((w) => w && w.productId !== product.id && w.product?.id !== product.id));
      showToast(`Removed "${product.name || 'piece'}" from saved pieces.`);
    } else {
      const fallbackColor = product.colors?.[0] || { name: 'Imperial Obsidian', hex: '#0A0A0C', accent: '#D4AF37', glow: '', bgGlow: '' };
      const newItem: CartItem = {
        id: `wish-${product.id}-${Date.now()}`,
        productId: product.id,
        product: product,
        selectedColor: fallbackColor,
        selectedSize: product.sizes?.[0] || 'Standard',
        quantity: 1,
      };
      setWishlistItems((prev) => [...prev, newItem]);
      showToast(`Saved "${product.name || 'piece'}" to your atelier wishlist.`);
    }
  };

  const handleDirectBuyNow = (
    itemOrProduct: CartItem | Product,
    customColor?: ProductColor,
    customSize?: string,
    customQty: number = 1
  ) => {
    handleAddToCart(itemOrProduct, customColor, customSize, customQty);
    setIsDetailModalOpen(false);
    if (!user.isLoggedIn) {
      setIsAuthOpen(true);
      showToast('Please log in with your ID to proceed to payment.');
      return;
    }
    setIsCheckoutOpen(true);
  };

  const handleOrderComplete = (order: CustomerOrder) => {
    setOrders((prev) => [order, ...prev]);
    setCartItems([]);
    showToast(`Atelier Order ${order.orderNumber} confirmed!`);
  };

  const handleUpdateOrderStatus = (orderId: string, status: CustomerOrder['status']) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o))
    );
    // Sync order status to Supabase
    updateOrderStatusInSupabase(orderId, status).catch((err) => {
      console.warn('[Supabase Sync] Order status update warning:', err);
    });
  };

  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalWishlistCount = wishlistItems.length;

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-[#ECE7DA] selection:bg-[#D4AF37] selection:text-[#0A0A0C] font-sans relative">
      {/* 1. Full-Screen Cinematic Intro */}
      {showIntro && <CinematicIntro onComplete={() => setShowIntro(false)} />}

      {/* 3. Global Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-24 right-6 z-[100] px-5 py-3 rounded-xl bg-[#14131A] border border-[#D4AF37] text-xs font-semibold tracking-wider text-[#D4AF37] shadow-[0_10px_30px_rgba(0,0,0,0.8),0_0_20px_rgba(212,175,55,0.3)] animate-fadeIn flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-ping" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 4. Top Navigation Bar */}
      <Navbar
        cartCount={totalCartCount}
        wishlistCount={totalWishlistCount}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenWishlist={() => setIsWishlistOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onReplayIntro={() => setShowIntro(true)}
        user={user}
        activeCurrency={activeCurrency}
        onSelectCurrency={setActiveCurrency}
        theme={theme}
        onSelectTheme={(newTheme) => setTheme(newTheme)}
        onToggleTheme={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
      />

      {/* 5. Main Cinematic Content View */}
      <main className="relative">
        {/* Cinematic Hero */}
        <HeroSection
          backgroundImage={heroBgImage}
          onExplore={() => {
            const el = document.getElementById('collection');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
        />

        {/* Featured Product Collection Grid & 360 viewer trigger */}
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

      {/* 6. Footer */}
      <Footer
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* 7. Modals & Overlays */}
      <ProductDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        product={selectedProduct}
        onAddToCart={handleAddToCart}
        onBuyNow={handleDirectBuyNow}
        onOpenSizeGuide={() => setIsSizeGuideOpen(true)}
        currencySymbol={activeCurrency.symbol}
        currencyRate={activeCurrency.rate}
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

      <AdminPanel
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        products={products}
        onUpdateProducts={(updated) => {
          setProducts(updated);
          showToast('Atelier product archive updated.');
        }}
        orders={orders}
        onUpdateOrderStatus={handleUpdateOrderStatus}
        currencySymbol={activeCurrency.symbol}
        aboutImage={aboutImage}
        onUpdateAboutImage={(newImg) => {
          setAboutImage(newImg);
          showToast('About section image updated successfully.');
        }}
        heroBgImage={heroBgImage}
        onUpdateHeroBgImage={(newImg) => {
          setHeroBgImage(newImg);
          showToast('Homepage background image updated successfully.');
        }}
        shippingConfig={shippingConfig}
        onUpdateShippingConfig={(newConfig) => {
          setShippingConfig(newConfig);
          saveShippingConfigToSupabase(newConfig).catch((err) => {
            console.warn('[Supabase Sync] Shipping config save warning:', err);
          });
          showToast(newConfig.shippingChargesEnabled ? 'Shipping charges enabled in store.' : 'Shipping charges disabled (Complimentary active).');
        }}
      />
    </div>
  );
};

export default App;
