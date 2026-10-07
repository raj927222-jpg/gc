import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Plus,
  Minus,
  Edit2,
  Trash2,
  Package,
  ShoppingBag,
  Users,
  Layers,
  Settings,
  TrendingUp,
  ShieldCheck,
  Check,
  AlertCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  Sparkles,
  DollarSign,
  Lock,
  LogOut,
  KeyRound,
  UserCheck,
  Upload,
  Image as ImageIcon,
  ToggleLeft,
  ToggleRight,
  CheckCircle2,
  RotateCcw,
  Truck,
  Database,
  Server,
  RefreshCw,
  ExternalLink,
  Copy,
  Terminal,
  Cloud,
  CheckCircle,
} from 'lucide-react';
import { Product, CustomerOrder, ProductColor, ShippingConfig } from '../types';
import { LUXURY_COLORS } from '../data/products';
import { compressImageFile } from '../utils/storage';
import { getRegisteredUsers } from '../utils/authStorage';
import {
  checkMongoHealth,
  configureMongoUri,
  syncAllProductsToMongo,
  syncAllOrdersToMongo,
  syncAllUsersToMongo,
  saveShippingConfigToMongo,
  MongoHealthStatus,
  buildAtlasUri,
  DEFAULT_ATLAS_USER,
  DEFAULT_ATLAS_CLUSTER,
  DEFAULT_ATLAS_URI_TEMPLATE,
} from '../utils/mongoDb';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onUpdateProducts: (products: Product[]) => void;
  orders: CustomerOrder[];
  onUpdateOrderStatus: (orderId: string, status: CustomerOrder['status']) => void;
  currencySymbol: string;
  aboutImage?: string;
  onUpdateAboutImage?: (image: string) => void;
  heroBgImage?: string;
  onUpdateHeroBgImage?: (image: string) => void;
  shippingConfig?: ShippingConfig;
  onUpdateShippingConfig?: (config: ShippingConfig) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  isOpen,
  onClose,
  products,
  onUpdateProducts,
  orders,
  onUpdateOrderStatus,
  currencySymbol,
  aboutImage = 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1200&auto=format&fit=crop',
  onUpdateAboutImage,
  heroBgImage = 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?q=80&w=2000&auto=format&fit=crop',
  onUpdateHeroBgImage,
  shippingConfig,
  onUpdateShippingConfig,
}) => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminIdInput, setAdminIdInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');

  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'PRODUCTS' | 'ORDERS' | 'CUSTOMERS' | 'INVENTORY' | 'SHIPPING' | 'DATABASE' | 'CONTENT'>('OVERVIEW');

  // MongoDB Database State
  const [mongoHealth, setMongoHealth] = useState<MongoHealthStatus | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [isSyncingData, setIsSyncingData] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState('');
  const [mongoUriInput, setMongoUriInput] = useState(DEFAULT_ATLAS_URI_TEMPLATE);
  const [atlasPasswordInput, setAtlasPasswordInput] = useState('');
  const [showAtlasPassword, setShowAtlasPassword] = useState(false);
  const [connectMethod, setConnectMethod] = useState<'ATLAS_PASSWORD' | 'FULL_URI'>('ATLAS_PASSWORD');
  const [dbExplorerTab, setDbExplorerTab] = useState<'USERS' | 'ORDERS' | 'PRODUCTS'>('USERS');
  const [isConnectingMongo, setIsConnectingMongo] = useState(false);
  const [copiedDoc, setCopiedDoc] = useState(false);

  // Initial MongoDB health check
  React.useEffect(() => {
    if (isAuthenticated) {
      handleCheckMongoHealth();
    }
  }, [isAuthenticated]);

  const handleCheckMongoHealth = async () => {
    setIsCheckingHealth(true);
    try {
      const status = await checkMongoHealth();
      setMongoHealth(status);
    } catch (e: any) {
      console.warn('MongoDB health check exception:', e);
    } finally {
      setIsCheckingHealth(false);
    }
  };

  const handleConnectAtlasPassword = async () => {
    if (!atlasPasswordInput.trim()) {
      triggerSyncMsg('Please enter your MongoDB Atlas password for user raj927222_db_user.');
      return;
    }
    setIsConnectingMongo(true);
    try {
      const fullUri = buildAtlasUri(atlasPasswordInput.trim());
      const res = await configureMongoUri(fullUri);
      triggerSyncMsg(res.message);
      await handleCheckMongoHealth();
      if (res.success) {
        setAtlasPasswordInput('');
        // Automatically push existing users, orders, and products to MongoDB Atlas!
        handleSyncAllToMongo();
      }
    } catch (err: any) {
      triggerSyncMsg(`Connection error: ${err?.message || 'Failed to connect to Atlas'}`);
    } finally {
      setIsConnectingMongo(false);
    }
  };

  const handleConnectMongoUri = async () => {
    if (!mongoUriInput.trim()) {
      triggerSyncMsg('Please enter a valid MongoDB connection string (e.g. mongodb+srv://...)');
      return;
    }
    if (mongoUriInput.includes('<db_password>')) {
      triggerSyncMsg('Please replace <db_password> with your actual MongoDB Atlas password.');
      return;
    }
    setIsConnectingMongo(true);
    try {
      const res = await configureMongoUri(mongoUriInput.trim());
      triggerSyncMsg(res.message);
      await handleCheckMongoHealth();
      if (res.success) {
        setMongoUriInput('');
        handleSyncAllToMongo();
      }
    } catch (err: any) {
      triggerSyncMsg(`Connection error: ${err?.message || 'Failed to connect'}`);
    } finally {
      setIsConnectingMongo(false);
    }
  };

  const triggerSyncMsg = (msg: string) => {
    setSyncStatusMsg(msg);
    setTimeout(() => setSyncStatusMsg(''), 4500);
  };

  const handleSyncAllToMongo = async () => {
    setIsSyncingData(true);
    try {
      // 1. Sync Products
      const prodRes = await syncAllProductsToMongo(products);
      // 2. Sync Orders
      const orderRes = await syncAllOrdersToMongo(orders);
      // 3. Sync Users
      const users = getRegisteredUsers();
      const userRes = await syncAllUsersToMongo(users);
      // 4. Sync Shipping Config
      await saveShippingConfigToMongo(localShippingConfig);

      // Refresh health
      await handleCheckMongoHealth();

      if (prodRes.success && orderRes.success) {
        triggerSyncMsg(`Successfully synced ${products.length} products, ${orders.length} orders, ${users.length} users, and configurations to MongoDB!`);
      } else {
        triggerSyncMsg(prodRes.error || orderRes.error || userRes.error || 'Sync completed. Check MongoDB collection document counts.');
      }
    } catch (err: any) {
      triggerSyncMsg(`Sync error: ${err?.message || 'Failed to sync with MongoDB'}`);
    } finally {
      setIsSyncingData(false);
    }
  };

  const handleSyncProductsOnly = async () => {
    setIsSyncingData(true);
    try {
      const res = await syncAllProductsToMongo(products);
      await handleCheckMongoHealth();
      if (res.success) {
        triggerSyncMsg(`Synced ${products.length} products to MongoDB products collection!`);
      } else {
        triggerSyncMsg(`Product sync note: ${res.error || 'Please connect your MongoDB cluster.'}`);
      }
    } catch (e: any) {
      triggerSyncMsg(`Product sync error: ${e?.message}`);
    } finally {
      setIsSyncingData(false);
    }
  };

  const handleSyncOrdersOnly = async () => {
    setIsSyncingData(true);
    try {
      const res = await syncAllOrdersToMongo(orders);
      await handleCheckMongoHealth();
      if (res.success) {
        triggerSyncMsg(`Synced ${orders.length} orders to MongoDB orders collection!`);
      } else {
        triggerSyncMsg(`Orders sync note: ${res.error || 'Please connect your MongoDB cluster.'}`);
      }
    } catch (e: any) {
      triggerSyncMsg(`Orders sync error: ${e?.message}`);
    } finally {
      setIsSyncingData(false);
    }
  };

  const handleSyncUsersOnly = async () => {
    setIsSyncingData(true);
    try {
      const users = getRegisteredUsers();
      const res = await syncAllUsersToMongo(users);
      await handleCheckMongoHealth();
      if (res.success) {
        triggerSyncMsg(`Synced ${users.length} registered accounts to MongoDB registered_users collection!`);
      } else {
        triggerSyncMsg(`Users sync note: ${res.error || 'Please connect your MongoDB cluster.'}`);
      }
    } catch (e: any) {
      triggerSyncMsg(`Users sync error: ${e?.message}`);
    } finally {
      setIsSyncingData(false);
    }
  };

  const handleSyncShippingOnly = async () => {
    setIsSyncingData(true);
    try {
      const ok = await saveShippingConfigToMongo(localShippingConfig);
      await handleCheckMongoHealth();
      if (ok) {
        triggerSyncMsg(`Store shipping policy synced to MongoDB store_settings collection!`);
      } else {
        triggerSyncMsg(`Settings sync note: Ensure MongoDB is connected.`);
      }
    } catch (e: any) {
      triggerSyncMsg(`Settings sync error: ${e?.message}`);
    } finally {
      setIsSyncingData(false);
    }
  };

  // Shipping Configuration State
  const [localShippingConfig, setLocalShippingConfig] = useState<ShippingConfig>(() => {
    return shippingConfig || {
      shippingChargesEnabled: true,
      standardShippingFee: 450,
      freeShippingThreshold: 15000,
      shippingLabel: 'Express White-Glove Shipping',
    };
  });
  const [shippingFeedbackMsg, setShippingFeedbackMsg] = useState('');

  React.useEffect(() => {
    if (shippingConfig) {
      setLocalShippingConfig(shippingConfig);
    }
  }, [shippingConfig]);

  const triggerShippingFeedback = (msg: string) => {
    setShippingFeedbackMsg(msg);
    setTimeout(() => {
      setShippingFeedbackMsg('');
    }, 3500);
  };

  const handleToggleShippingEnabled = (specificVal?: boolean) => {
    const nextVal = specificVal !== undefined ? specificVal : !localShippingConfig.shippingChargesEnabled;
    const updated: ShippingConfig = {
      ...localShippingConfig,
      shippingChargesEnabled: nextVal,
    };
    setLocalShippingConfig(updated);
    if (onUpdateShippingConfig) {
      onUpdateShippingConfig(updated);
    }
    triggerShippingFeedback(
      nextVal
        ? `Shipping charges turned ON (${currencySymbol}${updated.standardShippingFee} standard fee / Free above ${currencySymbol}${updated.freeShippingThreshold.toLocaleString('en-IN')})`
        : 'Shipping charges turned OFF (Complimentary free shipping active store-wide)'
    );
  };

  const handleUpdateShippingFee = (fee: number) => {
    const updated: ShippingConfig = {
      ...localShippingConfig,
      standardShippingFee: Math.max(0, fee),
    };
    setLocalShippingConfig(updated);
    if (onUpdateShippingConfig) {
      onUpdateShippingConfig(updated);
    }
  };

  const handleUpdateFreeThreshold = (threshold: number) => {
    const updated: ShippingConfig = {
      ...localShippingConfig,
      freeShippingThreshold: Math.max(0, threshold),
    };
    setLocalShippingConfig(updated);
    if (onUpdateShippingConfig) {
      onUpdateShippingConfig(updated);
    }
  };

  const handleApplyShippingPreset = (preset: 'FREE' | 'STANDARD' | 'FLAT' | 'VIP') => {
    let updated: ShippingConfig;
    switch (preset) {
      case 'FREE':
        updated = {
          shippingChargesEnabled: false,
          standardShippingFee: 0,
          freeShippingThreshold: 0,
          shippingLabel: 'Complimentary Worldwide Courier',
        };
        break;
      case 'STANDARD':
        updated = {
          shippingChargesEnabled: true,
          standardShippingFee: 450,
          freeShippingThreshold: 15000,
          shippingLabel: 'Express White-Glove Shipping',
        };
        break;
      case 'FLAT':
        updated = {
          shippingChargesEnabled: true,
          standardShippingFee: 250,
          freeShippingThreshold: 0,
          shippingLabel: 'Standard Atelier Delivery',
        };
        break;
      case 'VIP':
        updated = {
          shippingChargesEnabled: true,
          standardShippingFee: 750,
          freeShippingThreshold: 25000,
          shippingLabel: 'VIP BlueDart Luxe Air Express',
        };
        break;
    }
    setLocalShippingConfig(updated);
    if (onUpdateShippingConfig) {
      onUpdateShippingConfig(updated);
    }
    triggerShippingFeedback(`Applied preset: ${preset} shipping profile!`);
  };

  // Edit / Add Product State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const processUploadedImageFile = async (file: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    try {
      const dataUrl = await compressImageFile(file, 1000, 1200, 0.8);
      if (dataUrl && editingProduct) {
        setEditingProduct({
          ...editingProduct,
          images: {
            ...editingProduct.images,
            front: dataUrl,
          },
        });
      }
    } catch (err) {
      console.error('Failed to compress product image:', err);
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processUploadedImageFile(file);
    }
  };

  const handleImageDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingImage(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processUploadedImageFile(file);
    }
  };
  const [announcementText, setAnnouncementText] = useState('COMPLIMENTARY WORLDWIDE BESPOKE COURIER • SURAT ATELIER AUTUMN/WINTER 2026');

  // About Section Atelier Image State
  const [aboutImageUrlInput, setAboutImageUrlInput] = useState('');
  const [isDraggingAboutImage, setIsDraggingAboutImage] = useState(false);
  const [aboutImageSuccessMsg, setAboutImageSuccessMsg] = useState('');
  const aboutFileInputRef = useRef<HTMLInputElement | null>(null);

  const defaultAboutImage = 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1200&auto=format&fit=crop';

  const triggerAboutSuccess = (msg: string) => {
    setAboutImageSuccessMsg(msg);
    setTimeout(() => {
      setAboutImageSuccessMsg('');
    }, 4000);
  };

  const processUploadedAboutFile = async (file: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    try {
      const dataUrl = await compressImageFile(file, 1000, 1200, 0.8);
      if (dataUrl && onUpdateAboutImage) {
        onUpdateAboutImage(dataUrl);
        setAboutImageUrlInput('');
        triggerAboutSuccess('Atelier image uploaded and synced with homepage!');
      }
    } catch (err) {
      console.error('Failed to compress about image:', err);
    }
  };

  const handleAboutFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processUploadedAboutFile(file);
    }
  };

  const handleAboutDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingAboutImage(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processUploadedAboutFile(file);
    }
  };

  const handleApplyAboutUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aboutImageUrlInput.trim()) return;
    if (onUpdateAboutImage) {
      onUpdateAboutImage(aboutImageUrlInput.trim());
      triggerAboutSuccess('Atelier image URL applied and synced!');
      setAboutImageUrlInput('');
    }
  };

  const handleResetAboutImage = () => {
    if (onUpdateAboutImage) {
      onUpdateAboutImage(defaultAboutImage);
      setAboutImageUrlInput('');
      triggerAboutSuccess('Reset to original atelier default photo.');
    }
  };

  // Hero / Homepage Background Image State
  const [heroBgUrlInput, setHeroBgUrlInput] = useState('');
  const [isDraggingHeroBg, setIsDraggingHeroBg] = useState(false);
  const [heroBgSuccessMsg, setHeroBgSuccessMsg] = useState('');
  const heroBgFileInputRef = useRef<HTMLInputElement | null>(null);

  const defaultHeroBgImage = 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?q=80&w=2000&auto=format&fit=crop';

  const triggerHeroBgSuccess = (msg: string) => {
    setHeroBgSuccessMsg(msg);
    setTimeout(() => {
      setHeroBgSuccessMsg('');
    }, 4000);
  };

  const processUploadedHeroBgFile = async (file: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    try {
      const dataUrl = await compressImageFile(file, 1600, 1000, 0.82);
      if (dataUrl && onUpdateHeroBgImage) {
        onUpdateHeroBgImage(dataUrl);
        setHeroBgUrlInput('');
        triggerHeroBgSuccess('Homepage background image uploaded and synced!');
      }
    } catch (err) {
      console.error('Failed to compress hero background image:', err);
    }
  };

  const handleHeroBgFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processUploadedHeroBgFile(file);
    }
  };

  const handleHeroBgDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingHeroBg(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processUploadedHeroBgFile(file);
    }
  };

  const handleApplyHeroBgUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!heroBgUrlInput.trim()) return;
    if (onUpdateHeroBgImage) {
      onUpdateHeroBgImage(heroBgUrlInput.trim());
      triggerHeroBgSuccess('Homepage background image URL applied and synced!');
      setHeroBgUrlInput('');
    }
  };

  const handleResetHeroBgImage = () => {
    if (onUpdateHeroBgImage) {
      onUpdateHeroBgImage(defaultHeroBgImage);
      setHeroBgUrlInput('');
      triggerHeroBgSuccess('Reset to original default homepage background.');
    }
  };

  // Quick inline edit & deletion state
  const [deleteConfirmProduct, setDeleteConfirmProduct] = useState<Product | null>(null);
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [tempPriceInput, setTempPriceInput] = useState<number | ''>('');
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [tempStockInput, setTempStockInput] = useState<number | ''>('');

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const trimmedId = adminIdInput.trim();
    const trimmedPass = passwordInput.trim();

    if (trimmedId === 'admin' && trimmedPass === 'admin123') {
      setIsAuthenticated(true);
      setAuthError('');
    } else {
      setAuthError('Invalid credentials. Please verify your Admin ID and Password.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setAdminIdInput('');
    setPasswordInput('');
    setAuthError('');
  };

  // Overview metrics
  const totalRevenue = orders.reduce((sum, o) => sum + (o.status !== 'CANCELLED' ? o.totalAmount : 0), 0) + 248000;
  const totalOrdersCount = orders.length + 18;
  const inStockItems = products.reduce((acc, p) => acc + (p.inStock ? p.stockCount : 0), 0);
  const lowStockCount = products.filter((p) => p.stockCount <= 8).length;

  // Stock In / Out Toggle Handler
  const handleToggleStockStatus = (productId: string) => {
    const updated = products.map((p) => {
      if (p.id === productId) {
        const nextInStock = !p.inStock;
        return {
          ...p,
          inStock: nextInStock,
          stockCount: nextInStock ? (p.stockCount > 0 ? p.stockCount : 10) : 0,
        };
      }
      return p;
    });
    onUpdateProducts(updated);
  };

  // Direct Stock Counter / Stepper Update
  const handleUpdateStockDirect = (productId: string, newStock: number) => {
    const safeStock = Math.max(0, newStock);
    const updated = products.map((p) => {
      if (p.id === productId) {
        return {
          ...p,
          stockCount: safeStock,
          inStock: safeStock > 0,
        };
      }
      return p;
    });
    onUpdateProducts(updated);
  };

  // Direct Price Update Handler
  const handleUpdatePriceDirect = (productId: string, newPrice: number) => {
    if (newPrice < 0 || isNaN(newPrice)) return;
    const updated = products.map((p) => {
      if (p.id === productId) {
        return {
          ...p,
          price: newPrice,
        };
      }
      return p;
    });
    onUpdateProducts(updated);
    setEditingPriceId(null);
  };

  const handleConfirmDelete = (id: string) => {
    const updated = products.filter((p) => p.id !== id);
    onUpdateProducts(updated);
    setDeleteConfirmProduct(null);
  };

  const handleDeleteProduct = (product: Product) => {
    setDeleteConfirmProduct(product);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    // Ensure stock status matches count
    const safeProduct: Product = {
      ...editingProduct,
      inStock: editingProduct.inStock && editingProduct.stockCount > 0,
    };

    if (isAddingNew) {
      onUpdateProducts([safeProduct, ...products]);
    } else {
      const updated = products.map((p) => (p.id === safeProduct.id ? safeProduct : p));
      onUpdateProducts(updated);
    }
    setEditingProduct(null);
    setIsAddingNew(false);
  };

  const handleCreateNewProduct = () => {
    const newP: Product = {
      id: `gc-custom-${Date.now()}`,
      name: 'GC NEW BESPOKE PIECE',
      category: 'JACKET',
      price: 9500,
      originalPrice: 13000,
      tagline: 'Hand-tailored luxury garment from Surat atelier',
      description: 'Crafted with exemplary attention to fit, finish, and textile luxury.',
      fabric: '100% Giza Cotton & Mulberry Silk',
      details: ['Hand-rolled hems', 'Mother-of-pearl buttons', 'Artisanal finish'],
      sizes: ['38 (S)', '40 (M)', '42 (L)', '44 (XL)'],
      colors: [LUXURY_COLORS.obsidian, LUXURY_COLORS.ivory, LUXURY_COLORS.navy],
      images: {
        front: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=1200&auto=format&fit=crop',
        back: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=1200&auto=format&fit=crop',
        detail: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=1200&auto=format&fit=crop',
        model: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?q=80&w=1200&auto=format&fit=crop',
      },
      rotation360Images: [
        'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?q=80&w=1000&auto=format&fit=crop',
      ],
      rating: 5.0,
      reviewsCount: 1,
      isNew: true,
      inStock: true,
      stockCount: 12,
    };
    setEditingProduct(newP);
    setIsAddingNew(true);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[90] flex items-center justify-center p-2 sm:p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-[#0A0A0C]/95 backdrop-blur-2xl"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          className="relative z-10 w-full max-w-6xl bg-[#14131A] rounded-2xl border border-[#D4AF37]/40 shadow-[0_30px_90px_rgba(0,0,0,0.95)] overflow-hidden my-auto max-h-[92vh] flex flex-col"
        >
          {/* Top Bar */}
          <div className="p-5 border-b border-[#D4AF37]/20 flex items-center justify-between bg-[#0E0D14]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#D4AF37] text-[#0A0A0C] flex items-center justify-center font-bold font-cinzel text-xs">
                GC
              </div>
              <div>
                <h3 className="font-cinzel text-lg font-bold tracking-wider text-[#ECE7DA]">
                  ATELIER MANAGEMENT PORTAL
                </h3>
                <span className="text-[10px] text-[#D4AF37] tracking-widest uppercase">
                  {isAuthenticated ? 'SURAT HQ • ADMINISTRATIVE EXECUTIVE' : 'SECURITY CREDENTIAL AUTHENTICATION'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isAuthenticated && (
                <button
                  id="btn-admin-logout"
                  onClick={handleLogout}
                  title="Sign out of Atelier Admin"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#ECE7DA]/70 hover:text-[#D4AF37] hover:bg-[#1E1D28] border border-white/10 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">LOGOUT</span>
                </button>
              )}
              <button
                id="btn-close-admin-panel"
                onClick={onClose}
                className="p-2 rounded-full text-[#ECE7DA]/60 hover:text-[#D4AF37] hover:bg-[#1E1D28] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {!isAuthenticated ? (
            /* Admin Login Gate */
            <div className="p-6 sm:p-12 flex-1 overflow-y-auto flex items-center justify-center bg-gradient-to-b from-[#14131A] via-[#0E0D14] to-[#0A0A0C]">
              <div className="w-full max-w-md bg-[#14131A] border border-[#D4AF37]/30 rounded-2xl p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative">
                {/* Security Crest */}
                <div className="flex flex-col items-center text-center mb-6">
                  <div className="w-14 h-14 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] mb-3 shadow-[0_0_20px_rgba(212,175,55,0.2)]">
                    <Lock className="w-6 h-6" />
                  </div>
                  <h4 className="font-cinzel text-xl font-bold tracking-wider text-[#ECE7DA]">
                    ATELIER AUTHORIZATION
                  </h4>
                  <p className="text-xs text-[#ECE7DA]/60 mt-1">
                    Restricted executive portal for Gyutaro Collection staff & inventory controllers.
                  </p>
                </div>

                {authError && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-5 p-3.5 rounded-xl bg-red-950/40 border border-red-500/40 flex items-center gap-2.5 text-xs text-red-300"
                  >
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{authError}</span>
                  </motion.div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-widest text-[#ECE7DA]/80 mb-1.5">
                      Admin ID
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#D4AF37]/70">
                        <UserCheck className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        id="input-admin-id"
                        value={adminIdInput}
                        onChange={(e) => setAdminIdInput(e.target.value)}
                        placeholder="Enter Admin ID (e.g. admin)"
                        autoComplete="username"
                        required
                        className="w-full pl-10 pr-4 py-3 bg-[#0E0D14] border border-[#D4AF37]/30 rounded-xl text-xs text-[#ECE7DA] placeholder:text-[#ECE7DA]/30 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/50 transition-all font-sans"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-widest text-[#ECE7DA]/80 mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#D4AF37]/70">
                        <KeyRound className="w-4 h-4" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="input-admin-password"
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        placeholder="Enter Password"
                        autoComplete="current-password"
                        required
                        className="w-full pl-10 pr-10 py-3 bg-[#0E0D14] border border-[#D4AF37]/30 rounded-xl text-xs text-[#ECE7DA] placeholder:text-[#ECE7DA]/30 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/50 transition-all font-sans"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#ECE7DA]/50 hover:text-[#D4AF37] transition-colors cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    id="btn-submit-admin-login"
                    className="w-full mt-2 py-3.5 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#E8C868] to-[#D4AF37] text-[#0A0A0C] font-bold text-xs tracking-[0.25em] uppercase hover:shadow-[0_0_25px_rgba(212,175,55,0.6)] transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>AUTHENTICATE & ENTER</span>
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <>
              {/* Navigation Sub-header Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto p-2 bg-[#0A0A0C] border-b border-[#D4AF37]/15">
                {[
                  { id: 'OVERVIEW', label: 'Overview', icon: TrendingUp },
                  { id: 'PRODUCTS', label: `Products (${products.length})`, icon: Layers },
                  { id: 'ORDERS', label: `Orders (${orders.length})`, icon: ShoppingBag },
                  { id: 'INVENTORY', label: 'Inventory & Stock', icon: Package },
                  { id: 'SHIPPING', label: 'Shipping Charges', icon: Truck },
                  { id: 'DATABASE', label: 'MongoDB Database', icon: Database },
                  { id: 'CUSTOMERS', label: 'VIP Clients', icon: Users },
                  { id: 'CONTENT', label: 'Atelier Content', icon: Sparkles },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      id={`admin-tab-${tab.id.toLowerCase()}`}
                      onClick={() => {
                        setActiveTab(tab.id as any);
                        setEditingProduct(null);
                      }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold tracking-wider font-cinzel transition-colors whitespace-nowrap cursor-pointer ${
                        isActive
                          ? 'bg-[#D4AF37] text-[#0A0A0C]'
                          : 'text-[#ECE7DA]/70 hover:text-[#D4AF37] hover:bg-[#14131A]'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

          {/* Content Area */}
          <div className="p-6 sm:p-8 overflow-y-auto flex-1">
            {/* 1. OVERVIEW TAB */}
            {activeTab === 'OVERVIEW' && (
              <div className="space-y-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-5 rounded-xl bg-[#0E0D14] border border-[#D4AF37]/20 flex flex-col justify-between">
                    <span className="text-xs text-[#ECE7DA]/60 uppercase tracking-widest font-cinzel">TOTAL SALES</span>
                    <span className="font-cinzel text-2xl font-bold text-[#D4AF37] mt-2">
                      {currencySymbol}{totalRevenue.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-[#10B981] mt-1">+18.4% this quarter</span>
                  </div>

                  <div className="p-5 rounded-xl bg-[#0E0D14] border border-[#D4AF37]/20 flex flex-col justify-between">
                    <span className="text-xs text-[#ECE7DA]/60 uppercase tracking-widest font-cinzel">TOTAL ORDERS</span>
                    <span className="font-cinzel text-2xl font-bold text-[#ECE7DA] mt-2">
                      {totalOrdersCount}
                    </span>
                    <span className="text-[10px] text-[#D4AF37] mt-1">100% On-time delivery</span>
                  </div>

                  <div className="p-5 rounded-xl bg-[#0E0D14] border border-[#D4AF37]/20 flex flex-col justify-between">
                    <span className="text-xs text-[#ECE7DA]/60 uppercase tracking-widest font-cinzel">ACTIVE PIECES</span>
                    <span className="font-cinzel text-2xl font-bold text-[#ECE7DA] mt-2">
                      {products.length}
                    </span>
                    <span className="text-[10px] text-[#ECE7DA]/50 mt-1">All flagship items active</span>
                  </div>

                  <div className="p-5 rounded-xl bg-[#0E0D14] border border-[#D4AF37]/20 flex flex-col justify-between">
                    <span className="text-xs text-[#ECE7DA]/60 uppercase tracking-widest font-cinzel">LOW STOCK ALERTS</span>
                    <span className="font-cinzel text-2xl font-bold text-[#EF4444] mt-2">
                      {lowStockCount}
                    </span>
                    <span className="text-[10px] text-[#EF4444]/80 mt-1">Restock recommended</span>
                  </div>
                </div>

                {/* Quick Shipping Controls Banner */}
                <div className="p-5 sm:p-6 rounded-2xl bg-[#0E0D14] border border-[#D4AF37]/30 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start sm:items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center border shrink-0 transition-all ${
                      localShippingConfig.shippingChargesEnabled
                        ? 'bg-[#D4AF37]/15 text-[#D4AF37] border-[#D4AF37]/40 shadow-[0_0_20px_rgba(212,175,55,0.25)]'
                        : 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/40 shadow-[0_0_20px_rgba(16,185,129,0.25)]'
                    }`}>
                      <Truck className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-cinzel text-sm font-bold text-[#ECE7DA] tracking-wider">
                          STORE SHIPPING CHARGES:
                        </h4>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${
                          localShippingConfig.shippingChargesEnabled
                            ? 'bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/50'
                            : 'bg-[#10B981]/20 text-[#10B981] border-[#10B981]/50'
                        }`}>
                          {localShippingConfig.shippingChargesEnabled ? 'CHARGES ACTIVE (ON)' : 'COMPLIMENTARY FREE (OFF)'}
                        </span>
                      </div>
                      <p className="text-xs text-[#ECE7DA]/70 mt-1">
                        {localShippingConfig.shippingChargesEnabled
                          ? `Standard fee of ${currencySymbol}${localShippingConfig.standardShippingFee} applied • Complimentary delivery on orders above ${currencySymbol}${localShippingConfig.freeShippingThreshold.toLocaleString('en-IN')}`
                          : '100% Free Shipping is active store-wide. Customers are not charged any delivery fee during checkout.'
                        }
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <button
                      type="button"
                      id="btn-admin-toggle-shipping-quick"
                      onClick={() => handleToggleShippingEnabled()}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs tracking-wider uppercase transition-all duration-200 cursor-pointer shadow-md ${
                        localShippingConfig.shippingChargesEnabled
                          ? 'bg-[#D4AF37] text-[#0A0A0C] hover:bg-[#F4E5C3] shadow-[0_0_15px_rgba(212,175,55,0.3)]'
                          : 'bg-[#14131A] text-[#10B981] border border-[#10B981]/40 hover:bg-[#10B981]/20'
                      }`}
                    >
                      {localShippingConfig.shippingChargesEnabled ? (
                        <>
                          <ToggleRight className="w-4 h-4" />
                          <span>TURN OFF SHIPPING CHARGES</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-4 h-4" />
                          <span>TURN ON SHIPPING CHARGES</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      id="btn-admin-open-shipping-tab"
                      onClick={() => setActiveTab('SHIPPING')}
                      className="px-4 py-2.5 rounded-xl bg-[#14131A] border border-[#D4AF37]/30 text-xs font-semibold text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-colors cursor-pointer font-cinzel whitespace-nowrap"
                    >
                      FULL SETTINGS →
                    </button>
                  </div>
                </div>

                {/* Recent Orders Overview */}
                <div className="p-6 rounded-xl bg-[#0E0D14] border border-[#D4AF37]/20">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-cinzel text-sm font-bold text-[#ECE7DA] tracking-wider">
                      LATEST ATELIER ORDERS
                    </h4>
                    <button
                      onClick={() => setActiveTab('ORDERS')}
                      className="text-xs text-[#D4AF37] hover:underline cursor-pointer font-cinzel"
                    >
                      VIEW ALL ORDERS →
                    </button>
                  </div>

                  {orders.length === 0 ? (
                    <p className="text-xs text-[#ECE7DA]/50 py-4">No live checkout orders placed yet this session.</p>
                  ) : (
                    <div className="divide-y divide-[#D4AF37]/10">
                      {orders.slice(0, 3).map((o) => (
                        <div key={o.id} className="py-3 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-mono font-bold text-[#D4AF37] mr-2">{o.orderNumber}</span>
                            <span className="text-[#ECE7DA] font-semibold">{o.customer.firstName} {o.customer.lastName}</span>
                            <span className="text-[#ECE7DA]/50 ml-2">({o.items.length} items)</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-cinzel font-bold text-[#D4AF37]">
                              {currencySymbol}{o.total.toLocaleString('en-IN')}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full bg-[#10B981]/20 text-[#10B981] text-[10px] font-bold">
                              {o.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 2. PRODUCTS TAB (CRUD) */}
            {activeTab === 'PRODUCTS' && !editingProduct && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="font-cinzel text-base font-bold text-[#ECE7DA] tracking-wider">
                    ATELIER CATALOGUE ARCHIVE
                  </h4>
                  <button
                    id="btn-admin-add-product"
                    onClick={handleCreateNewProduct}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#D4AF37] text-[#0A0A0C] text-xs font-bold tracking-widest uppercase hover:bg-[#F4E5C3] transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>ADD NEW PIECE</span>
                  </button>
                </div>

                <div className="overflow-x-auto rounded-xl border border-[#D4AF37]/20">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#0E0D14] border-b border-[#D4AF37]/20 text-[#D4AF37] font-cinzel">
                      <tr>
                        <th className="py-3 px-4">ITEM</th>
                        <th className="py-3 px-4">CATEGORY</th>
                        <th className="py-3 px-4">PRICE</th>
                        <th className="py-3 px-4">STOCK</th>
                        <th className="py-3 px-4">STATUS</th>
                        <th className="py-3 px-4 text-right">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D4AF37]/10 bg-[#14131A] text-[#ECE7DA]/80">
                      {products.map((p) => {
                        const isEditingPrice = editingPriceId === p.id;
                        const isEditingStock = editingStockId === p.id;

                        return (
                          <tr key={p.id} className="hover:bg-[#D4AF37]/5 transition-colors">
                            {/* 1. Item info */}
                            <td className="py-3 px-4 flex items-center gap-3">
                              <img
                                src={p.images.front}
                                alt={p.name}
                                referrerPolicy="no-referrer"
                                className="w-10 h-12 object-cover rounded border border-[#D4AF37]/20 shrink-0"
                              />
                              <div>
                                <span className="font-bold text-[#ECE7DA] block">{p.name}</span>
                                <span className="text-[10px] text-[#ECE7DA]/50 line-clamp-1">{p.tagline}</span>
                              </div>
                            </td>

                            {/* 2. Category */}
                            <td className="py-3 px-4 text-[#D4AF37] font-semibold">{p.category}</td>

                            {/* 3. Price (Inline Editable) */}
                            <td className="py-3 px-4">
                              {isEditingPrice ? (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[#D4AF37] font-cinzel">{currencySymbol}</span>
                                  <input
                                    type="number"
                                    min="0"
                                    autoFocus
                                    value={tempPriceInput}
                                    onChange={(e) => setTempPriceInput(e.target.value === '' ? '' : Number(e.target.value))}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' && tempPriceInput !== '') {
                                        handleUpdatePriceDirect(p.id, Number(tempPriceInput));
                                      } else if (e.key === 'Escape') {
                                        setEditingPriceId(null);
                                      }
                                    }}
                                    className="w-24 bg-[#0A0A0C] border border-[#D4AF37] text-xs font-mono font-bold text-[#ECE7DA] px-2 py-1 rounded focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                                  />
                                  <button
                                    onClick={() => {
                                      if (tempPriceInput !== '') {
                                        handleUpdatePriceDirect(p.id, Number(tempPriceInput));
                                      }
                                    }}
                                    className="p-1 rounded bg-[#D4AF37] text-[#0A0A0C] hover:bg-[#F4E5C3]"
                                    title="Save price"
                                  >
                                    <Check className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => setEditingPriceId(null)}
                                    className="p-1 rounded bg-[#1F1E29] text-[#ECE7DA]/60 hover:text-white"
                                    title="Cancel"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 group">
                                  <span className="font-cinzel font-bold text-[#ECE7DA]">
                                    {currencySymbol}{p.price.toLocaleString('en-IN')}
                                  </span>
                                  <button
                                    onClick={() => {
                                      setEditingPriceId(p.id);
                                      setTempPriceInput(p.price);
                                    }}
                                    className="opacity-40 group-hover:opacity-100 p-1 text-[#D4AF37] hover:bg-[#D4AF37]/20 rounded transition-all"
                                    title="Click to edit price"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                            </td>

                            {/* 4. Stock Quantity (Direct Stepper & Editable) */}
                            <td className="py-3 px-4">
                              {isEditingStock ? (
                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    min="0"
                                    autoFocus
                                    value={tempStockInput}
                                    onChange={(e) => setTempStockInput(e.target.value === '' ? '' : Number(e.target.value))}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' && tempStockInput !== '') {
                                        handleUpdateStockDirect(p.id, Number(tempStockInput));
                                        setEditingStockId(null);
                                      } else if (e.key === 'Escape') {
                                        setEditingStockId(null);
                                      }
                                    }}
                                    className="w-16 bg-[#0A0A0C] border border-[#D4AF37] text-xs font-mono font-bold text-[#ECE7DA] px-2 py-1 rounded focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                                  />
                                  <button
                                    onClick={() => {
                                      if (tempStockInput !== '') {
                                        handleUpdateStockDirect(p.id, Number(tempStockInput));
                                      }
                                      setEditingStockId(null);
                                    }}
                                    className="p-1 rounded bg-[#D4AF37] text-[#0A0A0C] hover:bg-[#F4E5C3]"
                                  >
                                    <Check className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => setEditingStockId(null)}
                                    className="p-1 rounded bg-[#1F1E29] text-[#ECE7DA]/60 hover:text-white"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => handleUpdateStockDirect(p.id, p.stockCount - 1)}
                                    disabled={p.stockCount <= 0}
                                    className="w-6 h-6 rounded bg-[#1F1E29] text-[#ECE7DA] hover:bg-[#EF4444] hover:text-white flex items-center justify-center text-xs font-bold transition-colors disabled:opacity-30 disabled:hover:bg-[#1F1E29]"
                                    title="Decrease stock (-1)"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingStockId(p.id);
                                      setTempStockInput(p.stockCount);
                                    }}
                                    className="px-2 py-0.5 rounded bg-[#0A0A0C] border border-[#D4AF37]/30 text-xs font-mono font-bold text-[#ECE7DA] hover:border-[#D4AF37] transition-colors"
                                    title="Click to edit exact units"
                                  >
                                    {p.stockCount} <span className="text-[9px] text-[#ECE7DA]/50 font-normal">units</span>
                                  </button>
                                  <button
                                    onClick={() => handleUpdateStockDirect(p.id, p.stockCount + 1)}
                                    className="w-6 h-6 rounded bg-[#1F1E29] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#0A0A0C] flex items-center justify-center text-xs font-bold transition-colors"
                                    title="Increase stock (+1)"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                            </td>

                            {/* 5. Stock Status Toggle (Stock In / Stock Out) */}
                            <td className="py-3 px-4">
                              <button
                                onClick={() => handleToggleStockStatus(p.id)}
                                className={`group flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider transition-all duration-200 cursor-pointer ${
                                  p.inStock
                                    ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40 hover:bg-[#10B981]/30 hover:border-[#10B981]'
                                    : 'bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/40 hover:bg-[#EF4444]/30 hover:border-[#EF4444]'
                                }`}
                                title={p.inStock ? 'Click to mark OUT OF STOCK' : 'Click to mark IN STOCK'}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${p.inStock ? 'bg-[#10B981] animate-pulse' : 'bg-[#EF4444]'}`} />
                                <span>{p.inStock ? 'IN STOCK' : 'OUT OF STOCK'}</span>
                                {p.inStock ? (
                                  <ToggleRight className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100" />
                                ) : (
                                  <ToggleLeft className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100" />
                                )}
                              </button>
                            </td>

                            {/* 6. Action buttons (Edit & Delete) */}
                            <td className="py-3 px-4 text-right space-x-2">
                              <button
                                onClick={() => {
                                  setEditingProduct({ ...p });
                                  setIsAddingNew(false);
                                }}
                                className="p-1.5 rounded bg-[#1F1E29] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#0A0A0C] transition-colors cursor-pointer"
                                title="Full Edit piece details"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(p)}
                                className="p-1.5 rounded bg-[#1F1E29] text-[#EF4444] hover:bg-[#EF4444] hover:text-white transition-colors cursor-pointer"
                                title="Delete piece from archive"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* EDIT PRODUCT FORM */}
            {activeTab === 'PRODUCTS' && editingProduct && (
              <form onSubmit={handleSaveProduct} className="space-y-6 max-w-3xl mx-auto">
                <div className="flex items-center justify-between pb-3 border-b border-[#D4AF37]/20">
                  <h4 className="font-cinzel text-base font-bold text-[#D4AF37]">
                    {isAddingNew ? 'CREATE NEW ATELIER PIECE' : `EDITING ${editingProduct.name}`}
                  </h4>
                  <button
                    type="button"
                    onClick={() => setEditingProduct(null)}
                    className="text-xs text-[#ECE7DA]/60 hover:text-[#D4AF37]"
                  >
                    CANCEL
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase text-[#ECE7DA]/70 mb-1">Product Title</label>
                    <input
                      type="text"
                      required
                      value={editingProduct.name}
                      onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                      className="w-full bg-[#0E0D14] border border-[#D4AF37]/30 rounded-xl px-4 py-2 text-xs text-[#ECE7DA] focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase text-[#ECE7DA]/70 mb-1">Category</label>
                    <select
                      value={editingProduct.category}
                      onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value as any })}
                      className="w-full bg-[#0E0D14] border border-[#D4AF37]/30 rounded-xl px-4 py-2 text-xs text-[#ECE7DA] focus:outline-none focus:border-[#D4AF37]"
                    >
                      <option value="SHIRT">SHIRT</option>
                      <option value="PANT">PANT</option>
                      <option value="JEANS">JEANS</option>
                      <option value="JACKET">JACKET</option>
                      <option value="BLAZER">BLAZER</option>
                      <option value="SHOES">SHOES</option>
                      <option value="WATCHES">WATCHES</option>
                      <option value="GOGGLES">GOGGLES</option>
                      <option value="COMBO">COMBO</option>
                      <option value="CAPS">CAPS</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs uppercase text-[#ECE7DA]/70 mb-1">Price ({currencySymbol} INR)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={editingProduct.price}
                      onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                      className="w-full bg-[#0E0D14] border border-[#D4AF37]/30 rounded-xl px-4 py-2 text-xs text-[#ECE7DA] font-mono focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase text-[#ECE7DA]/70 mb-1">Original Price ({currencySymbol})</label>
                    <input
                      type="number"
                      min="0"
                      value={editingProduct.originalPrice || 0}
                      onChange={(e) => setEditingProduct({ ...editingProduct, originalPrice: Number(e.target.value) })}
                      className="w-full bg-[#0E0D14] border border-[#D4AF37]/30 rounded-xl px-4 py-2 text-xs text-[#ECE7DA] font-mono focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase text-[#ECE7DA]/70 mb-1">Stock Quantity (Units)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        required
                        min="0"
                        value={editingProduct.stockCount}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setEditingProduct({
                            ...editingProduct,
                            stockCount: val,
                            inStock: val > 0,
                          });
                        }}
                        className="w-full bg-[#0E0D14] border border-[#D4AF37]/30 rounded-xl px-4 py-2 text-xs text-[#ECE7DA] font-mono focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                  </div>
                </div>

                {/* Stock Status & Badges Toggle */}
                <div className="p-4 rounded-xl bg-[#0E0D14] border border-[#D4AF37]/20 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="text-xs uppercase font-bold text-[#ECE7DA] block">Stock Availability Status</span>
                    <span className="text-[11px] text-[#ECE7DA]/50">Control whether this piece is purchasable in the shop</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const nextInStock = !editingProduct.inStock;
                      setEditingProduct({
                        ...editingProduct,
                        inStock: nextInStock,
                        stockCount: nextInStock ? (editingProduct.stockCount > 0 ? editingProduct.stockCount : 10) : 0,
                      });
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      editingProduct.inStock
                        ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/50'
                        : 'bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/50'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${editingProduct.inStock ? 'bg-[#10B981]' : 'bg-[#EF4444]'}`} />
                    <span>{editingProduct.inStock ? 'IN STOCK (AVAILABLE)' : 'DEPLETED (OUT OF STOCK)'}</span>
                    {editingProduct.inStock ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                  </button>
                </div>

                <div>
                  <label className="block text-xs uppercase text-[#ECE7DA]/70 mb-1">Tagline</label>
                  <input
                    type="text"
                    value={editingProduct.tagline}
                    onChange={(e) => setEditingProduct({ ...editingProduct, tagline: e.target.value })}
                    className="w-full bg-[#0E0D14] border border-[#D4AF37]/30 rounded-xl px-4 py-2 text-xs text-[#ECE7DA] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                {/* Product Image Section: Upload & Direct URL */}
                <div className="space-y-2">
                  <label className="block text-xs uppercase text-[#ECE7DA]/70 font-semibold tracking-wider">
                    Product Image (Upload / URL)
                  </label>

                  {/* Hidden Native File Input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageFileChange}
                    accept="image/*"
                    className="hidden"
                    id="input-product-image-file"
                  />

                  {/* Drag and Drop Zone + Click to Upload */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingImage(true);
                    }}
                    onDragLeave={() => setIsDraggingImage(false)}
                    onDrop={handleImageDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-2 ${
                      isDraggingImage
                        ? 'border-[#D4AF37] bg-[#D4AF37]/15'
                        : 'border-[#D4AF37]/30 hover:border-[#D4AF37]/60 bg-[#0E0D14]/80 hover:bg-[#14131A]'
                    }`}
                  >
                    {editingProduct.images.front ? (
                      <div className="flex items-center gap-4 w-full">
                        <img
                          src={editingProduct.images.front}
                          alt="Product Preview"
                          referrerPolicy="no-referrer"
                          className="w-16 h-20 object-cover rounded-lg border border-[#D4AF37]/40 shadow-md shrink-0 bg-black/40"
                        />
                        <div className="text-left flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 text-xs text-[#D4AF37] font-semibold">
                            <Upload className="w-3.5 h-3.5" />
                            <span>Click or Drop to Replace Image</span>
                          </div>
                          <p className="text-[10px] text-[#ECE7DA]/50 truncate mt-0.5 font-mono">
                            {editingProduct.images.front.startsWith('data:') ? 'Custom Uploaded Image File' : editingProduct.images.front}
                          </p>
                          <span className="text-[10px] text-[#ECE7DA]/40 inline-block mt-1">
                            Supports PNG, JPG, WEBP, GIF
                          </span>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="w-10 h-10 rounded-full bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37]">
                          <Upload className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-[#ECE7DA]">
                            Click to upload image or drag & drop here
                          </span>
                          <p className="text-[10px] text-[#ECE7DA]/50 mt-0.5">
                            PNG, JPG, WEBP up to 10MB
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Fallback direct URL input */}
                  <div className="pt-1">
                    <span className="text-[10px] text-[#ECE7DA]/50 uppercase tracking-widest block mb-1">
                      Or Paste Image URL directly:
                    </span>
                    <input
                      type="text"
                      placeholder="https://images.unsplash.com/..."
                      value={editingProduct.images.front.startsWith('data:') ? '' : editingProduct.images.front}
                      onChange={(e) => setEditingProduct({
                        ...editingProduct,
                        images: { ...editingProduct.images, front: e.target.value }
                      })}
                      className="w-full bg-[#0E0D14] border border-[#D4AF37]/30 rounded-xl px-4 py-2 text-xs text-[#ECE7DA] placeholder:text-[#ECE7DA]/30 focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase text-[#ECE7DA]/70 mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={editingProduct.description}
                    onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                    className="w-full bg-[#0E0D14] border border-[#D4AF37]/30 rounded-xl px-4 py-2 text-xs text-[#ECE7DA] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-[#D4AF37]/20">
                  <button
                    type="button"
                    onClick={() => setEditingProduct(null)}
                    className="px-6 py-2.5 rounded-xl border border-[#D4AF37]/30 text-xs text-[#ECE7DA]"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    className="px-8 py-2.5 rounded-xl bg-[#D4AF37] text-[#0A0A0C] font-bold text-xs tracking-widest uppercase hover:bg-[#F4E5C3] transition-colors cursor-pointer"
                  >
                    SAVE PIECE ARCHIVE
                  </button>
                </div>
              </form>
            )}

            {/* 3. ORDERS TAB */}
            {activeTab === 'ORDERS' && (
              <div className="space-y-4">
                <h4 className="font-cinzel text-base font-bold text-[#ECE7DA]">
                  CLIENT ORDERS MANAGEMENT ({orders.length})
                </h4>

                {orders.length === 0 ? (
                  <p className="text-xs text-[#ECE7DA]/50 py-8 text-center">No orders received in this session yet.</p>
                ) : (
                  <div className="space-y-4">
                    {orders.map((o) => (
                      <div key={o.id} className="p-5 rounded-xl bg-[#0E0D14] border border-[#D4AF37]/30 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#D4AF37]/15">
                          <div>
                            <span className="font-mono font-bold text-[#D4AF37] mr-2">{o.orderNumber}</span>
                            <span className="text-xs text-[#ECE7DA] font-semibold">
                              {o.customer.firstName} {o.customer.lastName} ({o.customer.phone})
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-[#ECE7DA]/60">{o.date}</span>
                            <span className="font-cinzel font-bold text-sm text-[#D4AF37]">
                              {currencySymbol}{o.total.toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>

                        <div className="text-xs text-[#ECE7DA]/75">
                          <p><strong>Shipping Address:</strong> {o.customer.address}, {o.customer.city}, {o.customer.state} {o.customer.pincode}</p>
                          <p className="mt-1"><strong>Payment:</strong> {o.paymentMethod} • <strong>Tracking:</strong> {o.trackingNumber}</p>
                        </div>

                        {/* Status Select */}
                        <div className="pt-2 flex items-center justify-between">
                          <span className="text-xs text-[#ECE7DA]/60">Update Order Status:</span>
                          <div className="flex gap-1.5 flex-wrap">
                            {(['PENDING', 'PROCESSING', 'TAILORED', 'DISPATCHED', 'DELIVERED'] as const).map((st) => (
                              <button
                                key={st}
                                onClick={() => onUpdateOrderStatus(o.id, st)}
                                className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase transition-colors ${
                                  o.status === st
                                    ? 'bg-[#D4AF37] text-[#0A0A0C]'
                                    : 'bg-[#14131A] text-[#ECE7DA]/60 hover:text-[#D4AF37] border border-[#D4AF37]/20'
                                }`}
                              >
                                {st}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 4. INVENTORY TAB */}
            {activeTab === 'INVENTORY' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-cinzel text-base font-bold text-[#ECE7DA]">
                      ATELIER STOCK & WORKSHOP INVENTORY ({products.length})
                    </h4>
                    <p className="text-xs text-[#ECE7DA]/60">
                      Manage real-time atelier units, stock in/out status, prices, and piece availability.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const updated = products.map((p) => ({ ...p, inStock: true, stockCount: p.stockCount > 0 ? p.stockCount : 10 }));
                        onUpdateProducts(updated);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40 text-xs font-bold hover:bg-[#10B981]/30 transition-colors"
                    >
                      STOCK ALL IN
                    </button>
                    <button
                      onClick={handleCreateNewProduct}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#D4AF37] text-[#0A0A0C] text-xs font-bold hover:bg-[#F4E5C3] transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>NEW PIECE</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {products.map((p) => {
                    const isEditingPrice = editingPriceId === p.id;
                    const isEditingStock = editingStockId === p.id;

                    return (
                      <div
                        key={p.id}
                        className={`p-4 rounded-xl bg-[#0E0D14] border transition-all duration-200 flex flex-col justify-between gap-4 ${
                          p.inStock
                            ? 'border-[#D4AF37]/30 hover:border-[#D4AF37]/60'
                            : 'border-[#EF4444]/40 bg-[#160B0D]'
                        }`}
                      >
                        {/* Top: Thumbnail, Title, Delete & Edit */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={p.images.front}
                              alt={p.name}
                              referrerPolicy="no-referrer"
                              className="w-12 h-16 object-cover rounded-lg border border-[#D4AF37]/30 shrink-0 bg-black/40"
                            />
                            <div className="min-w-0">
                              <h5 className="font-cinzel font-bold text-xs text-[#ECE7DA] truncate">{p.name}</h5>
                              <span className="text-[10px] text-[#D4AF37] font-semibold block">{p.category}</span>
                              <span className="text-[10px] text-[#ECE7DA]/50 line-clamp-1 mt-0.5">{p.tagline}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => {
                                setEditingProduct({ ...p });
                                setIsAddingNew(false);
                              }}
                              className="p-1.5 rounded bg-[#1F1E29] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#0A0A0C] transition-colors"
                              title="Full edit"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(p)}
                              className="p-1.5 rounded bg-[#1F1E29] text-[#EF4444] hover:bg-[#EF4444] hover:text-white transition-colors"
                              title="Delete piece"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Middle: Price & Stock In/Out Switch */}
                        <div className="pt-2 border-t border-[#D4AF37]/15 flex items-center justify-between gap-2">
                          {/* Price */}
                          <div>
                            <span className="text-[10px] text-[#ECE7DA]/50 uppercase tracking-widest block mb-0.5">Price</span>
                            {isEditingPrice ? (
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-[#D4AF37] font-cinzel">{currencySymbol}</span>
                                <input
                                  type="number"
                                  min="0"
                                  autoFocus
                                  value={tempPriceInput}
                                  onChange={(e) => setTempPriceInput(e.target.value === '' ? '' : Number(e.target.value))}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && tempPriceInput !== '') {
                                      handleUpdatePriceDirect(p.id, Number(tempPriceInput));
                                    } else if (e.key === 'Escape') {
                                      setEditingPriceId(null);
                                    }
                                  }}
                                  className="w-20 bg-[#0A0A0C] border border-[#D4AF37] text-xs font-mono font-bold text-[#ECE7DA] px-1.5 py-0.5 rounded"
                                />
                                <button
                                  onClick={() => {
                                    if (tempPriceInput !== '') {
                                      handleUpdatePriceDirect(p.id, Number(tempPriceInput));
                                    }
                                  }}
                                  className="p-1 rounded bg-[#D4AF37] text-[#0A0A0C]"
                                >
                                  <Check className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setEditingPriceId(p.id);
                                  setTempPriceInput(p.price);
                                }}
                                className="font-cinzel font-bold text-xs text-[#D4AF37] hover:text-[#F4E5C3] flex items-center gap-1"
                                title="Click to edit price"
                              >
                                <span>{currencySymbol}{p.price.toLocaleString('en-IN')}</span>
                                <Edit2 className="w-2.5 h-2.5 opacity-60" />
                              </button>
                            )}
                          </div>

                          {/* Stock Status Button */}
                          <div>
                            <span className="text-[10px] text-[#ECE7DA]/50 uppercase tracking-widest block mb-0.5 text-right">Status</span>
                            <button
                              onClick={() => handleToggleStockStatus(p.id)}
                              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider transition-colors ${
                                p.inStock
                                  ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40 hover:bg-[#10B981]/30'
                                  : 'bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/40 hover:bg-[#EF4444]/30'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${p.inStock ? 'bg-[#10B981]' : 'bg-[#EF4444]'}`} />
                              <span>{p.inStock ? 'IN STOCK' : 'OUT'}</span>
                              {p.inStock ? <ToggleRight className="w-3 h-3" /> : <ToggleLeft className="w-3 h-3" />}
                            </button>
                          </div>
                        </div>

                        {/* Bottom: Stock Count & Steppers */}
                        <div className="pt-2 border-t border-[#D4AF37]/15 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleUpdateStockDirect(p.id, p.stockCount - 5)}
                              disabled={p.stockCount <= 0}
                              className="px-1.5 py-1 bg-[#1F1E29] hover:bg-[#EF4444] text-[10px] font-bold rounded text-[#EF4444] disabled:opacity-30 transition-colors"
                              title="Decrease 5 units"
                            >
                              -5
                            </button>
                            <button
                              onClick={() => handleUpdateStockDirect(p.id, p.stockCount - 1)}
                              disabled={p.stockCount <= 0}
                              className="w-6 h-6 rounded bg-[#1F1E29] text-[#ECE7DA] hover:bg-[#EF4444] hover:text-white flex items-center justify-center text-xs font-bold disabled:opacity-30 transition-colors"
                              title="Decrease 1 unit"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Editable Stock Number */}
                          {isEditingStock ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min="0"
                                autoFocus
                                value={tempStockInput}
                                onChange={(e) => setTempStockInput(e.target.value === '' ? '' : Number(e.target.value))}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && tempStockInput !== '') {
                                    handleUpdateStockDirect(p.id, Number(tempStockInput));
                                    setEditingStockId(null);
                                  } else if (e.key === 'Escape') {
                                    setEditingStockId(null);
                                  }
                                }}
                                className="w-14 bg-[#0A0A0C] border border-[#D4AF37] text-xs font-mono font-bold text-[#ECE7DA] px-1 py-0.5 text-center rounded"
                              />
                              <button
                                onClick={() => {
                                  if (tempStockInput !== '') {
                                    handleUpdateStockDirect(p.id, Number(tempStockInput));
                                  }
                                  setEditingStockId(null);
                                }}
                                className="p-1 rounded bg-[#D4AF37] text-[#0A0A0C]"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingStockId(p.id);
                                setTempStockInput(p.stockCount);
                              }}
                              className="font-mono font-bold text-sm text-[#ECE7DA] px-2 py-0.5 rounded bg-[#0A0A0C] border border-[#D4AF37]/30 hover:border-[#D4AF37] transition-colors"
                              title="Click to edit exact stock"
                            >
                              {p.stockCount} <span className="text-[10px] text-[#ECE7DA]/50 font-normal">units</span>
                            </button>
                          )}

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleUpdateStockDirect(p.id, p.stockCount + 1)}
                              className="w-6 h-6 rounded bg-[#1F1E29] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#0A0A0C] flex items-center justify-center text-xs font-bold transition-colors"
                              title="Add 1 unit"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleUpdateStockDirect(p.id, p.stockCount + 5)}
                              className="px-1.5 py-1 bg-[#1F1E29] hover:bg-[#D4AF37] hover:text-[#0A0A0C] text-[10px] font-bold rounded text-[#D4AF37] transition-colors"
                              title="Add 5 units"
                            >
                              +5
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 5. CUSTOMERS TAB */}
            {activeTab === 'CUSTOMERS' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-cinzel text-base font-bold text-[#ECE7DA]">
                    REGISTERED PRIVILEGE CLIENTS ({getRegisteredUsers().length})
                  </h4>
                  <span className="text-[10px] text-[#D4AF37] uppercase tracking-wider font-cinzel">
                    Synced with Atelier Database
                  </span>
                </div>

                <div className="divide-y divide-[#D4AF37]/15 rounded-xl border border-[#D4AF37]/20 bg-[#0E0D14]">
                  {getRegisteredUsers().map((u, i) => (
                    <div key={u.id || i} className="p-4 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-[#ECE7DA] block">
                          {u.firstName} {u.lastName}
                        </span>
                        <div className="flex items-center gap-3 text-[11px] text-[#ECE7DA]/60 mt-0.5">
                          <span>{u.email}</span>
                          <span>•</span>
                          <span>{u.phone}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-cinzel font-bold text-[#D4AF37] block">
                          VIP PATRON
                        </span>
                        <span className="text-[9px] text-[#10B981] font-bold tracking-widest uppercase">
                          REGISTERED
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 6. CONTENT TAB */}
            {activeTab === 'CONTENT' && (
              <div className="space-y-10 max-w-4xl">
                {/* A. HOMEPAGE HERO BACKGROUND IMAGE CUSTOMIZATION */}
                <div className="p-6 rounded-2xl bg-[#0E0D14] border border-[#D4AF37]/30 shadow-xl space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#D4AF37]/20">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.2)]">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-cinzel text-base font-bold text-[#ECE7DA] tracking-wider">
                          HOMEPAGE HERO BACKGROUND IMAGE
                        </h4>
                        <p className="text-xs text-[#ECE7DA]/60 mt-0.5">
                          Change the main full-screen cinematic backdrop featured at the top of the boutique.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      id="btn-reset-hero-bg"
                      onClick={handleResetHeroBgImage}
                      className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#14131A] border border-[#D4AF37]/30 text-xs font-semibold text-[#ECE7DA]/80 hover:text-[#D4AF37] hover:border-[#D4AF37] transition-all cursor-pointer w-fit"
                      title="Reset to default photoshoot background"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>RESET DEFAULT</span>
                    </button>
                  </div>

                  {/* Success Notification */}
                  {heroBgSuccessMsg && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3.5 rounded-xl bg-[#10B981]/20 border border-[#10B981]/50 flex items-center gap-2.5 text-xs text-[#10B981] font-semibold"
                    >
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{heroBgSuccessMsg}</span>
                    </motion.div>
                  )}

                  {/* Two-Column Editor Layout */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left: Live Background Image Preview (5 cols) */}
                    <div className="lg:col-span-5 flex flex-col gap-3">
                      <span className="text-[11px] font-semibold uppercase tracking-widest text-[#ECE7DA]/70 font-cinzel">
                        LIVE BACKGROUND PREVIEW
                      </span>
                      <div className="relative aspect-[16/10] rounded-2xl overflow-hidden border-2 border-[#D4AF37]/40 shadow-2xl bg-[#14131A] group">
                        <img
                          id="admin-hero-bg-preview"
                          src={heroBgImage}
                          alt="Hero Section Background Preview"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover object-center filter brightness-50 contrast-110 group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0C] via-transparent to-[#0A0A0C]/70 pointer-events-none" />

                        {/* Top Badge */}
                        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-[#0A0A0C]/80 backdrop-blur-md border border-[#D4AF37]/40 text-[#D4AF37] text-[9px] font-bold tracking-widest uppercase flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                          <span>ACTIVE ON HERO</span>
                        </div>

                        {/* Centered Overlay Mock */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
                          <span className="font-cinzel text-sm font-bold text-[#FFFDF7] tracking-[0.2em] drop-shadow-md">
                            GYUTARO
                          </span>
                          <span className="font-cinzel text-[10px] text-[#D4AF37] tracking-[0.3em] uppercase">
                            COLLECTION
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Upload Options & Custom URL (7 cols) */}
                    <div className="lg:col-span-7 space-y-5">
                      {/* 1. Direct File Upload Zone */}
                      <div>
                        <span className="block text-xs uppercase font-semibold text-[#ECE7DA]/80 tracking-wider mb-2 font-cinzel">
                          1. UPLOAD BACKGROUND FROM DEVICE
                        </span>

                        <input
                          type="file"
                          ref={heroBgFileInputRef}
                          onChange={handleHeroBgFileChange}
                          accept="image/*"
                          className="hidden"
                          id="input-hero-bg-file"
                        />

                        <div
                          onDragOver={(e) => {
                            e.preventDefault();
                            setIsDraggingHeroBg(true);
                          }}
                          onDragLeave={() => setIsDraggingHeroBg(false)}
                          onDrop={handleHeroBgDrop}
                          onClick={() => heroBgFileInputRef.current?.click()}
                          className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-300 ${
                            isDraggingHeroBg
                              ? 'border-[#D4AF37] bg-[#D4AF37]/15 scale-[1.01]'
                              : 'border-[#D4AF37]/30 hover:border-[#D4AF37]/80 bg-[#14131A] hover:bg-[#1A1924]'
                          }`}
                        >
                          <div className="w-10 h-10 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] mx-auto mb-2">
                            <Upload className="w-5 h-5" />
                          </div>
                          <span className="text-xs font-bold text-[#ECE7DA] block">
                            Click to select background photo or drag & drop
                          </span>
                          <span className="text-[10px] text-[#ECE7DA]/50 block mt-1">
                            PNG, JPG, WEBP or GIF (High resolution 16:9 / landscape recommended)
                          </span>
                        </div>
                      </div>

                      {/* 2. Direct Image URL Input */}
                      <div>
                        <span className="block text-xs uppercase font-semibold text-[#ECE7DA]/80 tracking-wider mb-2 font-cinzel">
                          2. OR PASTE BACKGROUND IMAGE URL
                        </span>
                        <form onSubmit={handleApplyHeroBgUrl} className="flex gap-2">
                          <input
                            type="url"
                            id="input-hero-bg-image-url"
                            value={heroBgUrlInput}
                            onChange={(e) => setHeroBgUrlInput(e.target.value)}
                            placeholder="https://images.unsplash.com/..."
                            className="flex-1 bg-[#14131A] border border-[#D4AF37]/30 rounded-xl px-4 py-2.5 text-xs text-[#ECE7DA] placeholder:text-[#ECE7DA]/30 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/50"
                          />
                          <button
                            type="submit"
                            id="btn-apply-hero-bg-url"
                            disabled={!heroBgUrlInput.trim()}
                            className="px-5 py-2.5 rounded-xl bg-[#D4AF37] text-[#0A0A0C] font-bold text-xs tracking-wider uppercase hover:bg-[#F4E5C3] transition-colors disabled:opacity-40 disabled:pointer-events-none cursor-pointer shrink-0"
                          >
                            APPLY URL
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>

                {/* B. ABOUT US STORY IMAGE CUSTOMIZATION SECTION */}
                <div className="p-6 rounded-2xl bg-[#0E0D14] border border-[#D4AF37]/30 shadow-xl space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#D4AF37]/20">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.2)]">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-cinzel text-base font-bold text-[#ECE7DA] tracking-wider">
                          ABOUT ATELIER STORY PHOTOGRAPH
                        </h4>
                        <p className="text-xs text-[#ECE7DA]/60 mt-0.5">
                          Change the primary editorial image featured in the “The Atelier Story / About” section.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      id="btn-reset-about-image"
                      onClick={handleResetAboutImage}
                      className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#14131A] border border-[#D4AF37]/30 text-xs font-semibold text-[#ECE7DA]/80 hover:text-[#D4AF37] hover:border-[#D4AF37] transition-all cursor-pointer w-fit"
                      title="Reset to default photoshoot image"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>RESET DEFAULT</span>
                    </button>
                  </div>

                  {/* Success Notification */}
                  {aboutImageSuccessMsg && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3.5 rounded-xl bg-[#10B981]/20 border border-[#10B981]/50 flex items-center gap-2.5 text-xs text-[#10B981] font-semibold"
                    >
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{aboutImageSuccessMsg}</span>
                    </motion.div>
                  )}

                  {/* Two-Column Editor Layout */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left: Live Image Preview (5 cols) */}
                    <div className="lg:col-span-5 flex flex-col gap-3">
                      <span className="text-[11px] font-semibold uppercase tracking-widest text-[#ECE7DA]/70 font-cinzel">
                        LIVE ABOUT SECTION PREVIEW
                      </span>
                      <div className="relative aspect-[4/5] rounded-2xl overflow-hidden border-2 border-[#D4AF37]/40 shadow-2xl bg-[#14131A] group">
                        <img
                          id="admin-about-image-preview"
                          src={aboutImage}
                          alt="About Section Atelier Preview"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover object-center filter contrast-110 group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0C]/90 via-transparent to-black/30 pointer-events-none" />

                        {/* Top Badge */}
                        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-[#0A0A0C]/80 backdrop-blur-md border border-[#D4AF37]/40 text-[#D4AF37] text-[9px] font-bold tracking-widest uppercase flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                          <span>ACTIVE ON HOMEPAGE</span>
                        </div>

                        {/* Bottom Tag */}
                        <div className="absolute bottom-3 left-3 right-3 text-left">
                          <span className="text-[10px] tracking-widest uppercase font-cinzel text-[#D4AF37] font-semibold block">
                            THE ATELIER STORY
                          </span>
                          <span className="text-xs text-[#ECE7DA] font-bold truncate block">
                            Surat, Gujarat Haute Couture
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Upload Options & Custom URL & Presets (7 cols) */}
                    <div className="lg:col-span-7 space-y-5">
                      {/* 1. Direct File Upload Zone */}
                      <div>
                        <span className="block text-xs uppercase font-semibold text-[#ECE7DA]/80 tracking-wider mb-2 font-cinzel">
                          1. UPLOAD IMAGE FROM DEVICE
                        </span>

                        <input
                          type="file"
                          ref={aboutFileInputRef}
                          onChange={handleAboutFileChange}
                          accept="image/*"
                          className="hidden"
                          id="input-about-file"
                        />

                        <div
                          onDragOver={(e) => {
                            e.preventDefault();
                            setIsDraggingAboutImage(true);
                          }}
                          onDragLeave={() => setIsDraggingAboutImage(false)}
                          onDrop={handleAboutDrop}
                          onClick={() => aboutFileInputRef.current?.click()}
                          className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-300 ${
                            isDraggingAboutImage
                              ? 'border-[#D4AF37] bg-[#D4AF37]/15 scale-[1.01]'
                              : 'border-[#D4AF37]/30 hover:border-[#D4AF37]/80 bg-[#14131A] hover:bg-[#1A1924]'
                          }`}
                        >
                          <div className="w-10 h-10 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] mx-auto mb-2">
                            <Upload className="w-5 h-5" />
                          </div>
                          <span className="text-xs font-bold text-[#ECE7DA] block">
                            Click to select photo or drag and drop
                          </span>
                          <span className="text-[10px] text-[#ECE7DA]/50 block mt-1">
                            PNG, JPG, WEBP or GIF (High resolution 4:5 recommended)
                          </span>
                        </div>
                      </div>

                      {/* 2. Direct Image URL Input */}
                      <div>
                        <span className="block text-xs uppercase font-semibold text-[#ECE7DA]/80 tracking-wider mb-2 font-cinzel">
                          2. OR PASTE IMAGE URL
                        </span>
                        <form onSubmit={handleApplyAboutUrl} className="flex gap-2">
                          <input
                            type="url"
                            id="input-about-image-url"
                            value={aboutImageUrlInput}
                            onChange={(e) => setAboutImageUrlInput(e.target.value)}
                            placeholder="https://images.unsplash.com/..."
                            className="flex-1 bg-[#14131A] border border-[#D4AF37]/30 rounded-xl px-4 py-2.5 text-xs text-[#ECE7DA] placeholder:text-[#ECE7DA]/30 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/50"
                          />
                          <button
                            type="submit"
                            id="btn-apply-about-url"
                            disabled={!aboutImageUrlInput.trim()}
                            className="px-5 py-2.5 rounded-xl bg-[#D4AF37] text-[#0A0A0C] font-bold text-xs tracking-wider uppercase hover:bg-[#F4E5C3] transition-colors disabled:opacity-40 disabled:pointer-events-none cursor-pointer shrink-0"
                          >
                            APPLY URL
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>

                {/* B. HOMEPAGE TICKER BANNER SECTION */}
                <div className="p-6 rounded-2xl bg-[#0E0D14] border border-[#D4AF37]/30 shadow-xl space-y-4">
                  <div className="flex items-center gap-3 pb-3 border-b border-[#D4AF37]/20">
                    <div className="w-8 h-8 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-cinzel text-sm font-bold text-[#ECE7DA] tracking-wider">
                        HOMEPAGE TOP ANNOUNCEMENT TICKER
                      </h4>
                      <p className="text-[11px] text-[#ECE7DA]/60">
                        Marquee headline displayed continuously across the top of the boutique.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs uppercase text-[#ECE7DA]/70 mb-1.5 font-cinzel">
                      Live Announcement Text
                    </label>
                    <input
                      type="text"
                      id="input-announcement-ticker"
                      value={announcementText}
                      onChange={(e) => setAnnouncementText(e.target.value)}
                      className="w-full bg-[#14131A] border border-[#D4AF37]/30 rounded-xl px-4 py-2.5 text-xs text-[#ECE7DA] focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/50"
                    />
                  </div>

                  <button
                    type="button"
                    id="btn-update-ticker"
                    onClick={() => triggerAboutSuccess('Top ticker banner updated!')}
                    className="px-6 py-2.5 rounded-xl bg-[#D4AF37] text-[#0A0A0C] font-bold text-xs tracking-widest uppercase hover:bg-[#F4E5C3] transition-colors cursor-pointer"
                  >
                    UPDATE TICKER BANNER
                  </button>
                </div>
              </div>
            )}

            {/* 7. SHIPPING & DELIVERY SETTINGS TAB */}
            {activeTab === 'SHIPPING' && (
              <div className="space-y-8">
                {/* Header info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D4AF37]/20">
                  <div>
                    <h3 className="font-cinzel text-xl font-bold text-[#ECE7DA] tracking-wider flex items-center gap-3">
                      <Truck className="w-5 h-5 text-[#D4AF37]" />
                      <span>ATELIER SHIPPING & DELIVERY CHARGES</span>
                    </h3>
                    <p className="text-xs text-[#ECE7DA]/70 font-light mt-1">
                      Configure store-wide shipping fees, toggle complimentary shipping on/off, and manage customer threshold discounts.
                    </p>
                  </div>

                  {shippingFeedbackMsg && (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#10B981]/20 border border-[#10B981]/40 text-[#10B981] text-xs font-semibold animate-fade-in">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{shippingFeedbackMsg}</span>
                    </div>
                  )}
                </div>

                {/* 1. MASTER SHIPPING CHARGES TOGGLE CARD */}
                <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-[#14131A] via-[#0E0D14] to-[#1A1826] border-2 border-[#D4AF37]/40 shadow-[0_10px_40px_rgba(0,0,0,0.8)] relative overflow-hidden">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2 max-w-xl">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#D4AF37] font-cinzel">
                          PRIMARY STORE LOGISTICS CONTROL
                        </span>
                        <span className={`px-3 py-0.5 rounded-full text-xs font-bold tracking-wider uppercase border ${
                          localShippingConfig.shippingChargesEnabled
                            ? 'bg-[#D4AF37]/25 text-[#D4AF37] border-[#D4AF37]/60 shadow-[0_0_15px_rgba(212,175,55,0.3)]'
                            : 'bg-[#10B981]/25 text-[#10B981] border-[#10B981]/60 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                        }`}>
                          {localShippingConfig.shippingChargesEnabled ? '● SHIPPING CHARGES ON' : '● SHIPPING CHARGES OFF (FREE)'}
                        </span>
                      </div>

                      <h4 className="font-cinzel text-lg sm:text-xl font-bold text-[#ECE7DA]">
                        {localShippingConfig.shippingChargesEnabled
                          ? 'Customer Shipping Charges are currently ACTIVE'
                          : 'Complimentary Worldwide Shipping is ACTIVE (Zero Charges)'}
                      </h4>

                      <p className="text-xs text-[#ECE7DA]/70 leading-relaxed font-light">
                        {localShippingConfig.shippingChargesEnabled
                          ? `Orders under ${currencySymbol}${localShippingConfig.freeShippingThreshold.toLocaleString('en-IN')} will be charged ${currencySymbol}${localShippingConfig.standardShippingFee} for luxury express delivery. Orders exceeding the threshold receive automated free delivery.`
                          : 'All customers and clients receive 100% complimentary bespoke courier delivery. No shipping fees are added during cart or checkout calculations.'}
                      </p>
                    </div>

                    {/* Master Switch Button */}
                    <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
                      <button
                        type="button"
                        id="btn-admin-toggle-shipping-master"
                        onClick={() => handleToggleShippingEnabled()}
                        className={`flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-bold text-sm tracking-wider font-cinzel uppercase transition-all duration-300 cursor-pointer shadow-xl ${
                          localShippingConfig.shippingChargesEnabled
                            ? 'bg-gradient-to-r from-[#D4AF37] via-[#E5C365] to-[#D4AF37] text-[#0A0A0C] hover:shadow-[0_0_30px_rgba(212,175,55,0.6)]'
                            : 'bg-[#1E1D2A] text-[#10B981] border-2 border-[#10B981]/50 hover:bg-[#10B981]/15 hover:border-[#10B981]'
                        }`}
                      >
                        {localShippingConfig.shippingChargesEnabled ? (
                          <>
                            <ToggleRight className="w-6 h-6 text-[#0A0A0C]" />
                            <span>CLICK TO TURN OFF (MAKE FREE)</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-6 h-6 text-[#10B981]" />
                            <span>CLICK TO TURN ON CHARGES</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. PRESET SHIPPING PROFILES */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-cinzel text-sm font-bold text-[#ECE7DA] tracking-wider uppercase">
                        QUICK PRESET PROFILES
                      </h4>
                      <p className="text-[11px] text-[#ECE7DA]/60">
                        Apply pre-configured luxury delivery schemes with a single click.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Preset 1: 100% Free */}
                    <button
                      type="button"
                      id="btn-preset-free-shipping"
                      onClick={() => handleApplyShippingPreset('FREE')}
                      className={`p-5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                        !localShippingConfig.shippingChargesEnabled
                          ? 'bg-[#10B981]/10 border-[#10B981] shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                          : 'bg-[#0E0D14] border-[#D4AF37]/20 hover:border-[#D4AF37]/60 hover:bg-[#14131A]'
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-[#10B981] font-cinzel">
                            100% COMPLIMENTARY
                          </span>
                          {!localShippingConfig.shippingChargesEnabled && (
                            <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                          )}
                        </div>
                        <span className="font-cinzel text-sm font-bold text-[#ECE7DA] block">
                          Always Free Shipping
                        </span>
                        <p className="text-[11px] text-[#ECE7DA]/60 mt-1 leading-normal">
                          Charges turned OFF. Zero delivery fees across all carts and order values.
                        </p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                        <span className="text-[#ECE7DA]/50 font-mono">Fee: {currencySymbol}0</span>
                        <span className="font-bold text-[#10B981]">FREE</span>
                      </div>
                    </button>

                    {/* Preset 2: Standard Luxe */}
                    <button
                      type="button"
                      id="btn-preset-standard-shipping"
                      onClick={() => handleApplyShippingPreset('STANDARD')}
                      className={`p-5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                        localShippingConfig.shippingChargesEnabled && localShippingConfig.standardShippingFee === 450 && localShippingConfig.freeShippingThreshold === 15000
                          ? 'bg-[#D4AF37]/15 border-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.25)]'
                          : 'bg-[#0E0D14] border-[#D4AF37]/20 hover:border-[#D4AF37]/60 hover:bg-[#14131A]'
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-[#D4AF37] font-cinzel">
                            ATELIER DEFAULT
                          </span>
                          {localShippingConfig.shippingChargesEnabled && localShippingConfig.standardShippingFee === 450 && localShippingConfig.freeShippingThreshold === 15000 && (
                            <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
                          )}
                        </div>
                        <span className="font-cinzel text-sm font-bold text-[#ECE7DA] block">
                          Standard Luxe (₹450)
                        </span>
                        <p className="text-[11px] text-[#ECE7DA]/60 mt-1 leading-normal">
                          Charges ON. {currencySymbol}450 standard fee. Free for orders above {currencySymbol}15,000.
                        </p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                        <span className="text-[#ECE7DA]/50 font-mono">Fee: {currencySymbol}450</span>
                        <span className="text-[#D4AF37] font-semibold">&gt; {currencySymbol}15k Free</span>
                      </div>
                    </button>

                    {/* Preset 3: Flat Rate */}
                    <button
                      type="button"
                      id="btn-preset-flat-shipping"
                      onClick={() => handleApplyShippingPreset('FLAT')}
                      className={`p-5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                        localShippingConfig.shippingChargesEnabled && localShippingConfig.standardShippingFee === 250 && localShippingConfig.freeShippingThreshold === 0
                          ? 'bg-[#D4AF37]/15 border-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.25)]'
                          : 'bg-[#0E0D14] border-[#D4AF37]/20 hover:border-[#D4AF37]/60 hover:bg-[#14131A]'
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-[#D4AF37] font-cinzel">
                            FLAT RATE
                          </span>
                          {localShippingConfig.shippingChargesEnabled && localShippingConfig.standardShippingFee === 250 && localShippingConfig.freeShippingThreshold === 0 && (
                            <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
                          )}
                        </div>
                        <span className="font-cinzel text-sm font-bold text-[#ECE7DA] block">
                          Flat Rate (₹250)
                        </span>
                        <p className="text-[11px] text-[#ECE7DA]/60 mt-1 leading-normal">
                          Charges ON. Fixed {currencySymbol}250 shipping on all orders regardless of cart total.
                        </p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                        <span className="text-[#ECE7DA]/50 font-mono">Fee: {currencySymbol}250</span>
                        <span className="text-[#ECE7DA] font-semibold">Universal</span>
                      </div>
                    </button>

                    {/* Preset 4: VIP Concierge */}
                    <button
                      type="button"
                      id="btn-preset-vip-shipping"
                      onClick={() => handleApplyShippingPreset('VIP')}
                      className={`p-5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                        localShippingConfig.shippingChargesEnabled && localShippingConfig.standardShippingFee === 750 && localShippingConfig.freeShippingThreshold === 25000
                          ? 'bg-[#D4AF37]/15 border-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.25)]'
                          : 'bg-[#0E0D14] border-[#D4AF37]/20 hover:border-[#D4AF37]/60 hover:bg-[#14131A]'
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-[#D4AF37] font-cinzel">
                            VIP EXPRESS AIR
                          </span>
                          {localShippingConfig.shippingChargesEnabled && localShippingConfig.standardShippingFee === 750 && localShippingConfig.freeShippingThreshold === 25000 && (
                            <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
                          )}
                        </div>
                        <span className="font-cinzel text-sm font-bold text-[#ECE7DA] block">
                          VIP Air Courier (₹750)
                        </span>
                        <p className="text-[11px] text-[#ECE7DA]/60 mt-1 leading-normal">
                          Charges ON. {currencySymbol}750 premium courier fee. Free for orders exceeding {currencySymbol}25,000.
                        </p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                        <span className="text-[#ECE7DA]/50 font-mono">Fee: {currencySymbol}750</span>
                        <span className="text-[#D4AF37] font-semibold">&gt; {currencySymbol}25k Free</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* 3. DETAILED CUSTOM SETTINGS FORM */}
                <div className="p-6 sm:p-7 rounded-2xl bg-[#0E0D14] border border-[#D4AF37]/30 shadow-xl space-y-6">
                  <div className="flex items-center gap-3 pb-3 border-b border-[#D4AF37]/20">
                    <div className="w-8 h-8 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
                      <Settings className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-cinzel text-sm font-bold text-[#ECE7DA] tracking-wider">
                        CUSTOM RATE CONFIGURATION
                      </h4>
                      <p className="text-[11px] text-[#ECE7DA]/60">
                        Manually customize numeric fees and threshold conditions.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Field 1: Standard Fee */}
                    <div className="space-y-2">
                      <label className="block text-xs uppercase font-semibold text-[#ECE7DA] tracking-wider font-cinzel">
                        Standard Shipping Fee ({currencySymbol})
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-[#D4AF37] font-bold text-sm">
                          {currencySymbol}
                        </span>
                        <input
                          type="number"
                          id="input-standard-shipping-fee"
                          min="0"
                          step="10"
                          value={localShippingConfig.standardShippingFee}
                          onChange={(e) => handleUpdateShippingFee(Number(e.target.value))}
                          disabled={!localShippingConfig.shippingChargesEnabled}
                          className="w-full bg-[#14131A] border border-[#D4AF37]/30 rounded-xl pl-9 pr-4 py-2.5 text-xs text-[#ECE7DA] font-mono focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/50 disabled:opacity-40"
                        />
                      </div>
                      <div className="flex items-center gap-1.5 pt-1">
                        {[0, 200, 350, 450, 600, 750].map((f) => (
                          <button
                            key={f}
                            type="button"
                            onClick={() => handleUpdateShippingFee(f)}
                            disabled={!localShippingConfig.shippingChargesEnabled}
                            className="px-2 py-0.5 rounded bg-[#14131A] hover:bg-[#D4AF37]/20 border border-[#D4AF37]/20 text-[10px] font-mono text-[#ECE7DA]/80 disabled:opacity-30 cursor-pointer"
                          >
                            {currencySymbol}{f}
                          </button>
                        ))}
                      </div>
                      <span className="text-[10px] text-[#ECE7DA]/50 block">
                        Base courier rate charged when order subtotal is below the threshold.
                      </span>
                    </div>

                    {/* Field 2: Free Shipping Threshold */}
                    <div className="space-y-2">
                      <label className="block text-xs uppercase font-semibold text-[#ECE7DA] tracking-wider font-cinzel">
                        Free Shipping Threshold ({currencySymbol})
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-[#D4AF37] font-bold text-sm">
                          {currencySymbol}
                        </span>
                        <input
                          type="number"
                          id="input-free-shipping-threshold"
                          min="0"
                          step="500"
                          value={localShippingConfig.freeShippingThreshold}
                          onChange={(e) => handleUpdateFreeThreshold(Number(e.target.value))}
                          disabled={!localShippingConfig.shippingChargesEnabled}
                          className="w-full bg-[#14131A] border border-[#D4AF37]/30 rounded-xl pl-9 pr-4 py-2.5 text-xs text-[#ECE7DA] font-mono focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/50 disabled:opacity-40"
                        />
                      </div>
                      <div className="flex items-center gap-1.5 pt-1">
                        {[5000, 10000, 15000, 20000, 25000, 50000].map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => handleUpdateFreeThreshold(t)}
                            disabled={!localShippingConfig.shippingChargesEnabled}
                            className="px-2 py-0.5 rounded bg-[#14131A] hover:bg-[#D4AF37]/20 border border-[#D4AF37]/20 text-[10px] font-mono text-[#ECE7DA]/80 disabled:opacity-30 cursor-pointer"
                          >
                            {currencySymbol}{(t / 1000)}k
                          </button>
                        ))}
                      </div>
                      <span className="text-[10px] text-[#ECE7DA]/50 block">
                        Set to 0 if shipping should never be free, or an amount like {currencySymbol}15,000.
                      </span>
                    </div>

                    {/* Field 3: Shipping Label */}
                    <div className="space-y-2 md:col-span-2">
                      <label className="block text-xs uppercase font-semibold text-[#ECE7DA] tracking-wider font-cinzel">
                        Shipping Service Display Label
                      </label>
                      <input
                        type="text"
                        id="input-shipping-label"
                        value={localShippingConfig.shippingLabel || 'Express White-Glove Shipping'}
                        onChange={(e) => {
                          const updated = { ...localShippingConfig, shippingLabel: e.target.value };
                          setLocalShippingConfig(updated);
                          if (onUpdateShippingConfig) onUpdateShippingConfig(updated);
                        }}
                        placeholder="e.g. Express White-Glove Shipping"
                        className="w-full bg-[#14131A] border border-[#D4AF37]/30 rounded-xl px-4 py-2.5 text-xs text-[#ECE7DA] focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/50"
                      />
                      <span className="text-[10px] text-[#ECE7DA]/50 block">
                        Shown to the customer on checkout and in the shopping drawer line items.
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4. LIVE CHECKOUT CALCULATION SIMULATOR */}
                <div className="p-6 rounded-2xl bg-[#0E0D14] border border-[#D4AF37]/20 shadow-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-cinzel text-sm font-bold text-[#ECE7DA] tracking-wider uppercase">
                        LIVE CART & CHECKOUT SIMULATION
                      </h4>
                      <p className="text-[11px] text-[#ECE7DA]/60">
                        Preview what your patrons see across different order values with current settings:
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { title: 'Small Order', subtotal: 6500 },
                      { title: 'Mid-Tier Order', subtotal: 14000 },
                      { title: 'Haute Atelier Order', subtotal: 28000 },
                    ].map((sim, idx) => {
                      const isFree = !localShippingConfig.shippingChargesEnabled ||
                        (localShippingConfig.freeShippingThreshold > 0 && sim.subtotal > localShippingConfig.freeShippingThreshold);
                      const calculatedFee = isFree ? 0 : localShippingConfig.standardShippingFee;
                      const finalTotal = sim.subtotal + calculatedFee;

                      return (
                        <div
                          key={idx}
                          className="p-4 rounded-xl bg-[#14131A] border border-[#D4AF37]/20 flex flex-col justify-between space-y-3"
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-cinzel text-xs font-bold text-[#ECE7DA]">
                              {sim.title}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                              isFree
                                ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30'
                                : 'bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30'
                            }`}>
                              {isFree ? 'FREE DELIVERY' : `+ ${currencySymbol}${calculatedFee} FEE`}
                            </span>
                          </div>

                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between text-[#ECE7DA]/60">
                              <span>Cart Subtotal:</span>
                              <span className="font-mono">{currencySymbol}{sim.subtotal.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between text-[#ECE7DA]/60">
                              <span>Shipping:</span>
                              <span className={`font-mono font-semibold ${isFree ? 'text-[#10B981]' : 'text-[#D4AF37]'}`}>
                                {isFree ? 'FREE (₹0)' : `${currencySymbol}${calculatedFee}`}
                              </span>
                            </div>
                            <div className="pt-2 border-t border-[#D4AF37]/15 flex justify-between font-bold text-[#ECE7DA]">
                              <span>Total Client Pays:</span>
                              <span className="font-cinzel text-sm text-[#D4AF37]">
                                {currencySymbol}{finalTotal.toLocaleString('en-IN')}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 8: MONGODB DATABASE INTEGRATION */}
            {activeTab === 'DATABASE' && (
              <div className="space-y-6 animate-fadeIn pb-12">
                {/* Header & Status Card */}
                <div className="p-6 rounded-2xl bg-gradient-to-br from-[#12111A] via-[#14131F] to-[#0A0A0C] border border-[#D4AF37]/30 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${mongoHealth?.connected ? 'bg-[#10B981] animate-pulse' : 'bg-[#F59E0B]'}`} />
                        <span className={`text-[10px] font-bold uppercase tracking-[0.25em] font-cinzel ${mongoHealth?.connected ? 'text-[#10B981]' : 'text-[#F59E0B]'}`}>
                          {mongoHealth?.connected ? 'MONGODB CLUSTER CONNECTED' : 'MONGODB CONFIGURATION READY'}
                        </span>
                      </div>
                      <h3 className="font-cinzel text-xl font-bold text-[#ECE7DA] flex items-center gap-2">
                        <Database className="w-5 h-5 text-[#D4AF37]" />
                        <span>MongoDB Database Integration & Live Sync</span>
                      </h3>
                      <p className="text-xs text-[#ECE7DA]/70 mt-1 max-w-2xl leading-relaxed">
                        Your Gyutaro Atelier application uses MongoDB for high-speed document storage across garment products, customer orders, registered VIP accounts, and store settings.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        id="btn-check-mongo-health"
                        onClick={handleCheckMongoHealth}
                        disabled={isCheckingHealth}
                        className="px-4 py-2.5 rounded-xl border border-[#D4AF37]/30 bg-[#0E0D14] text-xs font-semibold text-[#ECE7DA] hover:border-[#D4AF37] hover:bg-[#14131A] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 text-[#D4AF37] ${isCheckingHealth ? 'animate-spin' : ''}`} />
                        <span>{isCheckingHealth ? 'Testing Ping...' : 'Check Connection'}</span>
                      </button>

                      <button
                        type="button"
                        id="btn-sync-all-mongo"
                        onClick={handleSyncAllToMongo}
                        disabled={isSyncingData}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#E8C868] to-[#D4AF37] text-[#0A0A0C] font-bold text-xs tracking-wider uppercase hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        <Cloud className={`w-4 h-4 ${isSyncingData ? 'animate-bounce' : ''}`} />
                        <span>{isSyncingData ? 'Syncing to MongoDB...' : 'Sync All Data to MongoDB'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Feedback Notification */}
                  {syncStatusMsg && (
                    <div className="mt-4 p-3 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-xs font-medium text-[#ECE7DA] flex items-center gap-2 animate-fadeIn">
                      <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0" />
                      <span>{syncStatusMsg}</span>
                    </div>
                  )}
                </div>

                {/* MongoDB Connection URI Config Box */}
                <div className="p-6 rounded-2xl bg-[#0E0D14] border border-[#D4AF37]/30 shadow-xl space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#D4AF37]/15 text-[#D4AF37] font-mono">
                          MONGODB ATLAS CLUSTER0
                        </span>
                        {mongoHealth?.connected && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#10B981]/15 text-[#10B981] font-mono flex items-center gap-1">
                            <Check className="w-3 h-3" /> ACTIVE
                          </span>
                        )}
                      </div>
                      <h4 className="font-cinzel text-base font-bold text-[#ECE7DA] flex items-center gap-2">
                        <Server className="w-4 h-4 text-[#D4AF37]" />
                        <span>Connect MongoDB Atlas Database</span>
                      </h4>
                      <p className="text-xs text-[#ECE7DA]/70 mt-0.5">
                        Cluster: <code className="text-[#D4AF37]">{DEFAULT_ATLAS_CLUSTER}</code> • User: <code className="text-[#ECE7DA]">{DEFAULT_ATLAS_USER}</code> • Database: <code className="text-[#ECE7DA]">gyutaro_atelier</code>
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#14131A] border border-[#D4AF37]/20">
                      <button
                        type="button"
                        onClick={() => setConnectMethod('ATLAS_PASSWORD')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          connectMethod === 'ATLAS_PASSWORD'
                            ? 'bg-[#D4AF37] text-[#0A0A0C] font-bold'
                            : 'text-[#ECE7DA]/70 hover:text-[#ECE7DA]'
                        }`}
                      >
                        Quick Password Connect
                      </button>
                      <button
                        type="button"
                        onClick={() => setConnectMethod('FULL_URI')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          connectMethod === 'FULL_URI'
                            ? 'bg-[#D4AF37] text-[#0A0A0C] font-bold'
                            : 'text-[#ECE7DA]/70 hover:text-[#ECE7DA]'
                        }`}
                      >
                        Full Connection URI
                      </button>
                    </div>
                  </div>

                  {/* Method 1: Quick Password for raj927222_db_user */}
                  {connectMethod === 'ATLAS_PASSWORD' ? (
                    <div className="p-4 rounded-xl bg-[#14131A] border border-[#D4AF37]/20 space-y-3">
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <div className="relative flex-1">
                          <Lock className="w-4 h-4 text-[#D4AF37] absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type={showAtlasPassword ? 'text' : 'password'}
                            id="input-atlas-password"
                            value={atlasPasswordInput}
                            onChange={(e) => setAtlasPasswordInput(e.target.value)}
                            placeholder="Enter password for user raj927222_db_user"
                            className="w-full bg-[#0E0D14] border border-[#D4AF37]/30 rounded-xl pl-10 pr-10 py-3 text-xs text-[#ECE7DA] font-mono focus:outline-none focus:border-[#D4AF37] placeholder:text-[#ECE7DA]/40"
                          />
                          <button
                            type="button"
                            onClick={() => setShowAtlasPassword(!showAtlasPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#ECE7DA]/50 hover:text-[#D4AF37] transition-colors cursor-pointer"
                          >
                            {showAtlasPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>

                        <button
                          type="button"
                          id="btn-connect-atlas-password"
                          onClick={handleConnectAtlasPassword}
                          disabled={isConnectingMongo}
                          className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#E8C868] to-[#D4AF37] hover:shadow-[0_0_25px_rgba(212,175,55,0.5)] text-[#0A0A0C] font-bold text-xs tracking-wider uppercase transition-all whitespace-nowrap cursor-pointer shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {isConnectingMongo ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-[#0A0A0C] border-t-transparent rounded-full animate-spin" />
                              <span>CONNECTING TO ATLAS...</span>
                            </>
                          ) : (
                            <>
                              <Check className="w-4 h-4" />
                              <span>CONNECT & SYNC ALL</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-[#ECE7DA]/60">
                        <span>Target: mongodb+srv://raj927222_db_user:••••••••@cluster0.x70hmm8.mongodb.net/gyutaro_atelier</span>
                        <span className="text-[#D4AF37]">Automatically syncs all users & orders upon connection</span>
                      </div>
                    </div>
                  ) : (
                    /* Method 2: Full Connection String */
                    <div className="p-4 rounded-xl bg-[#14131A] border border-[#D4AF37]/20 space-y-3">
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            id="input-mongo-uri"
                            value={mongoUriInput}
                            onChange={(e) => setMongoUriInput(e.target.value)}
                            placeholder="mongodb+srv://raj927222_db_user:<password>@cluster0.x70hmm8.mongodb.net/gyutaro_atelier?appName=Cluster0&compressors=zlib"
                            className="w-full bg-[#0E0D14] border border-[#D4AF37]/30 rounded-xl px-4 py-3 text-xs text-[#ECE7DA] font-mono focus:outline-none focus:border-[#D4AF37] placeholder:text-[#ECE7DA]/30"
                          />
                        </div>
                        <button
                          type="button"
                          id="btn-save-mongo-uri"
                          onClick={handleConnectMongoUri}
                          disabled={isConnectingMongo}
                          className="px-6 py-3 rounded-xl bg-[#D4AF37] hover:bg-[#F4E5C3] text-[#0A0A0C] font-bold text-xs tracking-wider uppercase transition-all whitespace-nowrap cursor-pointer shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {isConnectingMongo ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-[#0A0A0C] border-t-transparent rounded-full animate-spin" />
                              <span>CONNECTING...</span>
                            </>
                          ) : (
                            <>
                              <Check className="w-4 h-4" />
                              <span>CONNECT URI</span>
                            </>
                          )}
                        </button>
                      </div>
                      <p className="text-[11px] text-[#ECE7DA]/60">
                        Replace <code className="text-[#EF4444]">&lt;db_password&gt;</code> with your MongoDB Atlas database user password.
                      </p>
                    </div>
                  )}

                  {mongoHealth?.lastError && !mongoHealth.connected && (
                    <div className="p-3 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/30 text-xs text-[#EF4444] flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{mongoHealth.lastError}</span>
                    </div>
                  )}
                </div>

                {/* Connection Details Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-[#0E0D14] border border-[#D4AF37]/20">
                    <span className="text-[10px] text-[#ECE7DA]/50 uppercase tracking-wider block font-cinzel">Database Name</span>
                    <span className="font-mono text-xs text-[#D4AF37] font-bold mt-1 block truncate">
                      {mongoHealth?.databaseName || 'gyutaro_atelier'}
                    </span>
                    <span className="text-[10px] text-[#10B981] mt-2 flex items-center gap-1 font-semibold">
                      <Check className="w-3 h-3" /> MongoDB Atlas Database
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-[#0E0D14] border border-[#D4AF37]/20">
                    <span className="text-[10px] text-[#ECE7DA]/50 uppercase tracking-wider block font-cinzel">Cluster Host</span>
                    <span className="font-mono text-[11px] text-[#ECE7DA] font-semibold mt-1 block truncate">
                      {DEFAULT_ATLAS_CLUSTER}
                    </span>
                    <span className="text-[10px] text-[#ECE7DA]/50 mt-2 block">
                      Region: AWS (Cluster0)
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-[#0E0D14] border border-[#D4AF37]/20">
                    <span className="text-[10px] text-[#ECE7DA]/50 uppercase tracking-wider block font-cinzel">Database User</span>
                    <span className="font-mono text-[11px] text-[#D4AF37] font-semibold mt-1 block truncate">
                      {DEFAULT_ATLAS_USER}
                    </span>
                    <span className="text-[10px] text-[#10B981] mt-2 flex items-center gap-1 font-semibold">
                      <Check className="w-3 h-3" /> Read/Write Access
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-[#0E0D14] border border-[#D4AF37]/20">
                    <span className="text-[10px] text-[#ECE7DA]/50 uppercase tracking-wider block font-cinzel">Connection Health</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`w-2 h-2 rounded-full ${mongoHealth?.connected ? 'bg-[#10B981]' : 'bg-[#F59E0B]'}`} />
                      <span className="font-cinzel text-xs font-bold text-[#ECE7DA]">
                        {mongoHealth?.connected ? 'Live & Connected' : 'Awaiting Password'}
                      </span>
                    </div>
                    <span className="text-[10px] text-[#ECE7DA]/50 mt-2 block">
                      {mongoHealth?.connected ? 'Atlas Cluster Online' : 'Enter user password to link'}
                    </span>
                  </div>
                </div>

                {/* LIVE DATABASE EXPLORER: USERS & ORDERS IN MONGODB ATLAS */}
                <div className="p-6 rounded-2xl bg-[#0E0D14] border border-[#D4AF37]/25 shadow-xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#D4AF37]/20 pb-4">
                    <div>
                      <h4 className="font-cinzel text-base font-bold text-[#ECE7DA] flex items-center gap-2">
                        <Database className="w-4 h-4 text-[#D4AF37]" />
                        <span>Live Database Records: Users & Orders in MongoDB</span>
                      </h4>
                      <p className="text-xs text-[#ECE7DA]/60 mt-0.5">
                        Real-time inspection of patron accounts and placed couture orders stored in your database.
                      </p>
                    </div>

                    {/* Sub-tab Switcher */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        id="btn-db-view-users"
                        onClick={() => setDbExplorerTab('USERS')}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold font-cinzel tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                          dbExplorerTab === 'USERS'
                            ? 'bg-[#D4AF37] text-[#0A0A0C]'
                            : 'bg-[#14131A] text-[#ECE7DA]/70 hover:text-[#ECE7DA] border border-[#D4AF37]/20'
                        }`}
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>Registered Users ({getRegisteredUsers().length})</span>
                      </button>

                      <button
                        type="button"
                        id="btn-db-view-orders"
                        onClick={() => setDbExplorerTab('ORDERS')}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold font-cinzel tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                          dbExplorerTab === 'ORDERS'
                            ? 'bg-[#D4AF37] text-[#0A0A0C]'
                            : 'bg-[#14131A] text-[#ECE7DA]/70 hover:text-[#ECE7DA] border border-[#D4AF37]/20'
                        }`}
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Orders ({orders.length})</span>
                      </button>

                      <button
                        type="button"
                        id="btn-db-view-products"
                        onClick={() => setDbExplorerTab('PRODUCTS')}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold font-cinzel tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                          dbExplorerTab === 'PRODUCTS'
                            ? 'bg-[#D4AF37] text-[#0A0A0C]'
                            : 'bg-[#14131A] text-[#ECE7DA]/70 hover:text-[#ECE7DA] border border-[#D4AF37]/20'
                        }`}
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>Products ({products.length})</span>
                      </button>
                    </div>
                  </div>

                  {/* 1. Sub-view: REGISTERED USERS IN MONGODB */}
                  {dbExplorerTab === 'USERS' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[#ECE7DA]/70">
                          Showing {getRegisteredUsers().length} registered patron records stored for collection <code className="text-[#D4AF37]">registered_users</code>:
                        </span>
                        <button
                          type="button"
                          id="btn-sync-users-quick"
                          onClick={handleSyncUsersOnly}
                          disabled={isSyncingData}
                          className="px-3 py-1 rounded-lg bg-[#14131A] hover:bg-[#D4AF37]/20 border border-[#D4AF37]/30 text-xs font-semibold text-[#D4AF37] transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <Cloud className="w-3 h-3" />
                          <span>Push Users to MongoDB</span>
                        </button>
                      </div>

                      <div className="overflow-x-auto rounded-xl border border-[#D4AF37]/20">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-[#14131A] text-[#D4AF37] font-cinzel border-b border-[#D4AF37]/20">
                              <th className="p-3">Patron Name</th>
                              <th className="p-3">Email Address</th>
                              <th className="p-3">Mobile Phone</th>
                              <th className="p-3">Auth Provider</th>
                              <th className="p-3">Registered On</th>
                              <th className="p-3">Database ID</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {getRegisteredUsers().map((u) => (
                              <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                                <td className="p-3 font-semibold text-[#ECE7DA] flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] flex items-center justify-center font-bold text-[10px]">
                                    {(u.firstName || 'U')[0]}
                                  </div>
                                  <span>{u.firstName} {u.lastName}</span>
                                </td>
                                <td className="p-3 font-mono text-[#ECE7DA]/80">{u.email}</td>
                                <td className="p-3 font-mono text-[#D4AF37]">{u.phone}</td>
                                <td className="p-3">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white/5 text-[#ECE7DA]/80">
                                    {u.authProvider || 'password'}
                                  </span>
                                </td>
                                <td className="p-3 text-[#ECE7DA]/60">
                                  {new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </td>
                                <td className="p-3 font-mono text-[10px] text-[#ECE7DA]/40">{u.id}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* 2. Sub-view: CUSTOMER ORDERS IN MONGODB */}
                  {dbExplorerTab === 'ORDERS' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[#ECE7DA]/70">
                          Showing {orders.length} placed customer orders stored for collection <code className="text-[#D4AF37]">orders</code>:
                        </span>
                        <button
                          type="button"
                          id="btn-sync-orders-quick"
                          onClick={handleSyncOrdersOnly}
                          disabled={isSyncingData}
                          className="px-3 py-1 rounded-lg bg-[#14131A] hover:bg-[#D4AF37]/20 border border-[#D4AF37]/30 text-xs font-semibold text-[#D4AF37] transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <Cloud className="w-3 h-3" />
                          <span>Push Orders to MongoDB</span>
                        </button>
                      </div>

                      {orders.length === 0 ? (
                        <div className="p-8 rounded-xl bg-[#14131A] text-center border border-white/5">
                          <ShoppingBag className="w-8 h-8 text-[#D4AF37]/40 mx-auto mb-2" />
                          <p className="text-xs text-[#ECE7DA]/60">No orders placed yet. Orders confirmed at checkout will appear here.</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto rounded-xl border border-[#D4AF37]/20">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-[#14131A] text-[#D4AF37] font-cinzel border-b border-[#D4AF37]/20">
                                <th className="p-3">Order Number</th>
                                <th className="p-3">Customer</th>
                                <th className="p-3">Date</th>
                                <th className="p-3">Items</th>
                                <th className="p-3">Total Payable</th>
                                <th className="p-3">Payment</th>
                                <th className="p-3">Status</th>
                                <th className="p-3">Tracking</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                              {orders.map((o) => (
                                <tr key={o.id} className="hover:bg-white/[0.02] transition-colors">
                                  <td className="p-3 font-mono font-bold text-[#D4AF37]">{o.orderNumber}</td>
                                  <td className="p-3 text-[#ECE7DA]">
                                    <div className="font-semibold">{o.customer?.firstName} {o.customer?.lastName}</div>
                                    <div className="text-[10px] text-[#ECE7DA]/50">{o.customer?.email}</div>
                                  </td>
                                  <td className="p-3 text-[#ECE7DA]/70">{o.date}</td>
                                  <td className="p-3 text-[#ECE7DA]/80">{o.items?.length || 0} piece(s)</td>
                                  <td className="p-3 font-cinzel font-bold text-[#D4AF37]">
                                    {currencySymbol}{o.total?.toLocaleString('en-IN')}
                                  </td>
                                  <td className="p-3">
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#D4AF37]/10 text-[#D4AF37] font-mono">
                                      {o.paymentMethod}
                                    </span>
                                  </td>
                                  <td className="p-3">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                      o.status === 'DELIVERED' ? 'bg-[#10B981]/20 text-[#10B981]' : 'bg-[#F59E0B]/20 text-[#F59E0B]'
                                    }`}>
                                      {o.status}
                                    </span>
                                  </td>
                                  <td className="p-3 font-mono text-[10px] text-[#ECE7DA]/60">{o.trackingNumber}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 3. Sub-view: PRODUCTS IN MONGODB */}
                  {dbExplorerTab === 'PRODUCTS' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[#ECE7DA]/70">
                          Showing {products.length} catalog items stored for collection <code className="text-[#D4AF37]">products</code>:
                        </span>
                        <button
                          type="button"
                          id="btn-sync-products-quick"
                          onClick={handleSyncProductsOnly}
                          disabled={isSyncingData}
                          className="px-3 py-1 rounded-lg bg-[#14131A] hover:bg-[#D4AF37]/20 border border-[#D4AF37]/30 text-xs font-semibold text-[#D4AF37] transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <Cloud className="w-3 h-3" />
                          <span>Push Products to MongoDB</span>
                        </button>
                      </div>

                      <div className="overflow-x-auto rounded-xl border border-[#D4AF37]/20 max-h-96">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-[#14131A] text-[#D4AF37] font-cinzel border-b border-[#D4AF37]/20 sticky top-0">
                              <th className="p-3">Product</th>
                              <th className="p-3">Category</th>
                              <th className="p-3">Price</th>
                              <th className="p-3">Stock Count</th>
                              <th className="p-3">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {products.map((p) => (
                              <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                                <td className="p-3 text-[#ECE7DA] flex items-center gap-3">
                                  <img src={p.images?.front} alt={p.name} className="w-9 h-9 object-cover rounded-lg border border-[#D4AF37]/30 shrink-0" />
                                  <span className="font-semibold">{p.name}</span>
                                </td>
                                <td className="p-3 text-[#ECE7DA]/70">{p.category}</td>
                                <td className="p-3 font-cinzel font-bold text-[#D4AF37]">
                                  {currencySymbol}{p.price?.toLocaleString('en-IN')}
                                </td>
                                <td className="p-3 font-mono">{p.stockCount} units</td>
                                <td className="p-3">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    p.inStock ? 'bg-[#10B981]/20 text-[#10B981]' : 'bg-[#EF4444]/20 text-[#EF4444]'
                                  }`}>
                                    {p.inStock ? 'IN STOCK' : 'OUT OF STOCK'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                {/* MongoDB Collection Synchronization Bento Grid */}
                <div>
                  <h4 className="font-cinzel text-sm font-bold text-[#ECE7DA] mb-3 flex items-center gap-2">
                    <Server className="w-4 h-4 text-[#D4AF37]" />
                    <span>MongoDB Collections & Sync Status</span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Products Collection Card */}
                    <div className="p-4 rounded-xl bg-[#0E0D14] border border-[#D4AF37]/20 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-cinzel text-xs font-bold text-[#ECE7DA]">products</span>
                          <span className="px-2 py-0.5 rounded text-[10px] bg-[#D4AF37]/15 text-[#D4AF37] font-mono font-bold">
                            {mongoHealth?.collections?.products ?? products.length} docs
                          </span>
                        </div>
                        <p className="text-[11px] text-[#ECE7DA]/60 leading-normal mb-3">
                          Atelier garment archive, prices, stock levels, luxury color palettes, and imagery.
                        </p>
                      </div>
                      <button
                        type="button"
                        id="btn-sync-products-mongo"
                        onClick={handleSyncProductsOnly}
                        disabled={isSyncingData}
                        className="w-full py-2 rounded-lg bg-[#14131A] hover:bg-[#D4AF37]/20 border border-[#D4AF37]/30 text-[11px] font-semibold text-[#D4AF37] transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Cloud className="w-3 h-3" />
                        <span>Push Products ({products.length})</span>
                      </button>
                    </div>

                    {/* Orders Collection Card */}
                    <div className="p-4 rounded-xl bg-[#0E0D14] border border-[#D4AF37]/20 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-cinzel text-xs font-bold text-[#ECE7DA]">orders</span>
                          <span className="px-2 py-0.5 rounded text-[10px] bg-[#D4AF37]/15 text-[#D4AF37] font-mono font-bold">
                            {mongoHealth?.collections?.orders ?? orders.length} docs
                          </span>
                        </div>
                        <p className="text-[11px] text-[#ECE7DA]/60 leading-normal mb-3">
                          Customer purchases, delivery addresses, payment methods, and tracking numbers.
                        </p>
                      </div>
                      <button
                        type="button"
                        id="btn-sync-orders-mongo"
                        onClick={handleSyncOrdersOnly}
                        disabled={isSyncingData}
                        className="w-full py-2 rounded-lg bg-[#14131A] hover:bg-[#D4AF37]/20 border border-[#D4AF37]/30 text-[11px] font-semibold text-[#D4AF37] transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Cloud className="w-3 h-3" />
                        <span>Push Orders ({orders.length})</span>
                      </button>
                    </div>

                    {/* Users Collection Card */}
                    <div className="p-4 rounded-xl bg-[#0E0D14] border border-[#D4AF37]/20 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-cinzel text-xs font-bold text-[#ECE7DA]">registered_users</span>
                          <span className="px-2 py-0.5 rounded text-[10px] bg-[#D4AF37]/15 text-[#D4AF37] font-mono font-bold">
                            {mongoHealth?.collections?.registered_users ?? getRegisteredUsers().length} docs
                          </span>
                        </div>
                        <p className="text-[11px] text-[#ECE7DA]/60 leading-normal mb-3">
                          VIP customer accounts, encrypted credentials, contact info, and registration details.
                        </p>
                      </div>
                      <button
                        type="button"
                        id="btn-sync-users-mongo"
                        onClick={handleSyncUsersOnly}
                        disabled={isSyncingData}
                        className="w-full py-2 rounded-lg bg-[#14131A] hover:bg-[#D4AF37]/20 border border-[#D4AF37]/30 text-[11px] font-semibold text-[#D4AF37] transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Cloud className="w-3 h-3" />
                        <span>Push Users ({getRegisteredUsers().length})</span>
                      </button>
                    </div>

                    {/* Settings Collection Card */}
                    <div className="p-4 rounded-xl bg-[#0E0D14] border border-[#D4AF37]/20 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-cinzel text-xs font-bold text-[#ECE7DA]">store_settings</span>
                          <span className="px-2 py-0.5 rounded text-[10px] bg-[#10B981]/15 text-[#10B981] font-mono font-bold">
                            Active
                          </span>
                        </div>
                        <p className="text-[11px] text-[#ECE7DA]/60 leading-normal mb-3">
                          Shipping charge policies ({localShippingConfig.shippingChargesEnabled ? 'ON' : 'OFF'}), delivery fees, and atelier configurations.
                        </p>
                      </div>
                      <button
                        type="button"
                        id="btn-sync-shipping-mongo"
                        onClick={handleSyncShippingOnly}
                        disabled={isSyncingData}
                        className="w-full py-2 rounded-lg bg-[#14131A] hover:bg-[#D4AF37]/20 border border-[#D4AF37]/30 text-[11px] font-semibold text-[#D4AF37] transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Cloud className="w-3 h-3" />
                        <span>Push Settings</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* MongoDB Atlas Setup Guide */}
                <div className="p-6 rounded-2xl bg-[#0E0D14] border border-[#D4AF37]/25 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="font-cinzel text-sm font-bold text-[#ECE7DA] flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-[#D4AF37]" />
                        <span>How to Connect MongoDB Atlas in 3 Steps</span>
                      </h4>
                      <p className="text-xs text-[#ECE7DA]/60 mt-1">
                        Follow these steps to generate your MongoDB Atlas connection string and connect it to Gyutaro Atelier.
                      </p>
                    </div>

                    <a
                      href="https://cloud.mongodb.com"
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 rounded-xl bg-[#D4AF37] text-[#0A0A0C] text-xs font-bold tracking-wider uppercase hover:bg-[#F4E5C3] transition-all flex items-center gap-2 cursor-pointer shadow-lg"
                    >
                      <span>Open MongoDB Atlas</span>
                      <ExternalLink className="w-3.5 h-3.5 text-[#0A0A0C]" />
                    </a>
                  </div>

                  {/* 3 Step Guide Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                    <div className="p-4 rounded-xl bg-[#14131A] border border-white/5 space-y-1.5">
                      <span className="text-[10px] font-bold text-[#D4AF37] font-cinzel uppercase block">STEP 1</span>
                      <p className="text-xs text-[#ECE7DA] font-semibold">Create Free Cluster</p>
                      <p className="text-[11px] text-[#ECE7DA]/60">
                        Sign up or log in at <strong className="text-[#D4AF37]">mongodb.com</strong> and deploy a free M0 cluster (e.g. AWS / Mumbai / Singapore).
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-[#14131A] border border-white/5 space-y-1.5">
                      <span className="text-[10px] font-bold text-[#D4AF37] font-cinzel uppercase block">STEP 2</span>
                      <p className="text-xs text-[#ECE7DA] font-semibold">User & Network Access</p>
                      <p className="text-[11px] text-[#ECE7DA]/60">
                        Under <em>Database Access</em> create a user (e.g. <strong className="text-[#ECE7DA]">admin</strong>), and under <em>Network Access</em> add IP <strong className="text-[#10B981]">0.0.0.0/0</strong> (Allow Anywhere).
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-[#14131A] border border-white/5 space-y-1.5">
                      <span className="text-[10px] font-bold text-[#D4AF37] font-cinzel uppercase block">STEP 3</span>
                      <p className="text-xs text-[#ECE7DA] font-semibold">Paste Connection String</p>
                      <p className="text-[11px] text-[#ECE7DA]/60">
                        Click <em>Connect &gt; Drivers &gt; Node.js</em>, copy the <code className="text-[#D4AF37]">mongodb+srv://...</code> URI, paste it into the box above and click <em>Connect Database</em>.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* CUSTOM LUXURY DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {deleteConfirmProduct && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#14131A] border border-[#EF4444]/40 rounded-2xl max-w-md w-full p-6 shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_30px_rgba(239,68,68,0.2)] relative space-y-4"
            >
              <div className="flex items-center gap-3 text-[#EF4444]">
                <div className="w-10 h-10 rounded-full bg-[#EF4444]/15 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-cinzel font-bold text-base text-[#ECE7DA]">DELETE ATELIER PIECE</h4>
                  <span className="text-xs text-[#EF4444] font-semibold">Irreversible Archive Action</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#0E0D14] border border-[#D4AF37]/20 flex items-center gap-3">
                <img
                  src={deleteConfirmProduct.images.front}
                  alt={deleteConfirmProduct.name}
                  referrerPolicy="no-referrer"
                  className="w-12 h-14 object-cover rounded-lg border border-[#D4AF37]/30 bg-black/50"
                />
                <div className="min-w-0">
                  <span className="font-cinzel font-bold text-xs text-[#ECE7DA] block truncate">
                    {deleteConfirmProduct.name}
                  </span>
                  <span className="text-[10px] text-[#D4AF37] font-semibold block">
                    {deleteConfirmProduct.category} • {currencySymbol}{deleteConfirmProduct.price.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-[#ECE7DA]/50 block">
                    Current stock: {deleteConfirmProduct.stockCount} units
                  </span>
                </div>
              </div>

              <p className="text-xs text-[#ECE7DA]/70 leading-relaxed">
                Are you sure you want to permanently remove <strong className="text-[#ECE7DA]">{deleteConfirmProduct.name}</strong> from the store catalogue and inventory?
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmProduct(null)}
                  className="px-4 py-2 rounded-xl border border-[#D4AF37]/30 text-xs font-semibold text-[#ECE7DA] hover:bg-[#D4AF37]/10 transition-colors cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirmDelete(deleteConfirmProduct.id)}
                  className="px-5 py-2 rounded-xl bg-[#EF4444] text-white text-xs font-bold tracking-wider uppercase hover:bg-[#DC2626] transition-colors shadow-lg shadow-[#EF4444]/30 cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>CONFIRM DELETE</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  </div>
</AnimatePresence>
  );
};
