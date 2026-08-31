import { supabase, SUPABASE_PROJECT_ID, SUPABASE_DEFAULT_URL } from './supabaseClient';
import { Product, CustomerOrder, RegisteredUser, ShippingConfig } from '../types';

export const SUPABASE_SQL_SCHEMA = `-- =========================================================
-- GYUTARO COLLECTION LUXURY ATELIER - SUPABASE SQL SCHEMA
-- Project ID: ${SUPABASE_PROJECT_ID}
-- Execute this script in your Supabase SQL Editor:
-- Supabase Dashboard > SQL Editor > New query > Run
-- =========================================================

-- 1. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price NUMERIC NOT NULL,
  original_price NUMERIC,
  tagline TEXT,
  description TEXT,
  fabric TEXT,
  details JSONB DEFAULT '[]'::jsonb,
  sizes JSONB DEFAULT '[]'::jsonb,
  colors JSONB DEFAULT '[]'::jsonb,
  images JSONB DEFAULT '{}'::jsonb,
  rotation_360_images JSONB DEFAULT '[]'::jsonb,
  rating NUMERIC DEFAULT 4.9,
  reviews_count INTEGER DEFAULT 18,
  is_new BOOLEAN DEFAULT false,
  is_bestseller BOOLEAN DEFAULT false,
  in_stock BOOLEAN DEFAULT true,
  stock_count INTEGER DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. CUSTOMER ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  order_number TEXT NOT NULL,
  date TEXT NOT NULL,
  customer JSONB NOT NULL,
  items JSONB NOT NULL,
  subtotal NUMERIC NOT NULL,
  discount NUMERIC DEFAULT 0,
  shipping NUMERIC DEFAULT 0,
  total NUMERIC NOT NULL,
  payment_method TEXT NOT NULL,
  status TEXT DEFAULT 'PROCESSING',
  tracking_number TEXT,
  created_at BIGINT NOT NULL
);

-- 3. REGISTERED USERS TABLE
CREATE TABLE IF NOT EXISTS public.registered_users (
  id TEXT PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at BIGINT NOT NULL
);

-- 4. STORE SETTINGS TABLE (Shipping, Hero image, About image)
CREATE TABLE IF NOT EXISTS public.store_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. ENABLE ROW LEVEL SECURITY & OPEN POLICIES FOR STORE INTEGRATION
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registered_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public products access') THEN
    CREATE POLICY "Allow public products access" ON public.products FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public orders access') THEN
    CREATE POLICY "Allow public orders access" ON public.orders FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public users access') THEN
    CREATE POLICY "Allow public users access" ON public.registered_users FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public settings access') THEN
    CREATE POLICY "Allow public settings access" ON public.store_settings FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
`;

export interface SupabaseHealthStatus {
  connected: boolean;
  projectId: string;
  url: string;
  tables: {
    products: boolean;
    orders: boolean;
    registered_users: boolean;
    store_settings: boolean;
  };
  productCount: number;
  orderCount: number;
  userCount: number;
  lastChecked: string;
  error?: string;
}

/**
 * Checks connectivity and table presence in Supabase.
 */
export async function checkSupabaseHealth(): Promise<SupabaseHealthStatus> {
  const result: SupabaseHealthStatus = {
    connected: false,
    projectId: SUPABASE_PROJECT_ID,
    url: SUPABASE_DEFAULT_URL,
    tables: {
      products: false,
      orders: false,
      registered_users: false,
      store_settings: false,
    },
    productCount: 0,
    orderCount: 0,
    userCount: 0,
    lastChecked: new Date().toISOString(),
  };

  try {
    // 1. Products
    const prodRes = await supabase.from('products').select('id', { count: 'exact' }).limit(1);
    if (!prodRes.error) {
      result.tables.products = true;
      result.productCount = prodRes.count || 0;
      result.connected = true;
    }

    // 2. Orders
    const orderRes = await supabase.from('orders').select('id', { count: 'exact' }).limit(1);
    if (!orderRes.error) {
      result.tables.orders = true;
      result.orderCount = orderRes.count || 0;
      result.connected = true;
    }

    // 3. Users
    const userRes = await supabase.from('registered_users').select('id', { count: 'exact' }).limit(1);
    if (!userRes.error) {
      result.tables.registered_users = true;
      result.userCount = userRes.count || 0;
      result.connected = true;
    }

    // 4. Store settings
    const settingsRes = await supabase.from('store_settings').select('key').limit(1);
    if (!settingsRes.error) {
      result.tables.store_settings = true;
      result.connected = true;
    }

    // If API responded but tables don't exist yet
    if (prodRes.error?.code === 'PGRST205' || orderRes.error?.code === 'PGRST205') {
      result.connected = true;
      result.error = 'Supabase project connected! Tables ready to be initialized with SQL script.';
    }
  } catch (err: any) {
    result.error = err?.message || 'Failed to communicate with Supabase';
  }

  return result;
}

// -----------------------------------------------------------------------------
// PRODUCTS ADAPTERS
// -----------------------------------------------------------------------------

function mapDbProduct(row: any): Product {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    price: Number(row.price),
    originalPrice: row.original_price ? Number(row.original_price) : undefined,
    description: row.description || '',
    fabric: row.fabric || '',
    details: Array.isArray(row.details) ? row.details : [],
    sizes: Array.isArray(row.sizes) ? row.sizes : ['38', '40', '42', '44'],
    colors: Array.isArray(row.colors) ? row.colors : [],
    images: row.images || { front: '', back: '', detail: '', model: '' },
    rotation360Images: Array.isArray(row.rotation_360_images) ? row.rotation_360_images : [],
    rating: row.rating ? Number(row.rating) : 4.9,
    reviewsCount: row.reviews_count ? Number(row.reviews_count) : 18,
    isNew: Boolean(row.is_new),
    isBestseller: Boolean(row.is_bestseller),
    inStock: row.in_stock !== false,
    stockCount: row.stock_count ?? 50,
    tagline: row.tagline || '',
  };
}

function mapProductToDb(p: Product) {
  return {
    id: p.id,
    name: p.name,
    category: p.category,
    price: p.price,
    original_price: p.originalPrice || null,
    description: p.description || '',
    fabric: p.fabric || '',
    details: p.details || [],
    sizes: p.sizes || ['38', '40', '42', '44'],
    colors: p.colors || [],
    images: p.images || {},
    rotation_360_images: p.rotation360Images || [],
    rating: p.rating || 4.9,
    reviews_count: p.reviewsCount || 18,
    is_new: Boolean(p.isNew),
    is_bestseller: Boolean(p.isBestseller),
    in_stock: p.inStock !== false,
    stock_count: p.stockCount ?? 50,
    tagline: p.tagline || '',
  };
}

export async function fetchProductsFromSupabase(): Promise<Product[] | null> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('price', { ascending: false });

    if (error || !data || data.length === 0) {
      return null;
    }

    return data.map(mapDbProduct);
  } catch (err) {
    console.warn('[Supabase] Failed to fetch products:', err);
    return null;
  }
}

export async function saveProductToSupabase(product: Product): Promise<boolean> {
  try {
    const payload = mapProductToDb(product);
    const { error } = await supabase.from('products').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.warn('[Supabase] Error saving product:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Supabase] Save product exception:', err);
    return false;
  }
}

export async function deleteProductFromSupabase(productId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('products').delete().eq('id', productId);
    if (error) {
      console.warn('[Supabase] Error deleting product:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Supabase] Delete product exception:', err);
    return false;
  }
}

export async function syncAllProductsToSupabase(products: Product[]): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    const payload = products.map(mapProductToDb);
    const { error } = await supabase.from('products').upsert(payload, { onConflict: 'id' });
    if (error) {
      return { success: false, count: 0, error: error.message };
    }
    return { success: true, count: products.length };
  } catch (err: any) {
    return { success: false, count: 0, error: err?.message || 'Sync failed' };
  }
}

// -----------------------------------------------------------------------------
// ORDERS ADAPTERS
// -----------------------------------------------------------------------------

function mapDbOrder(row: any): CustomerOrder {
  return {
    id: row.id,
    orderNumber: row.order_number || `GC-${row.id}`,
    date: row.date || new Date(Number(row.created_at)).toLocaleDateString(),
    customer: row.customer || {
      firstName: 'Valued',
      lastName: 'Patron',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
    },
    items: Array.isArray(row.items) ? row.items : [],
    subtotal: Number(row.subtotal),
    discount: Number(row.discount || 0),
    shipping: Number(row.shipping || 0),
    total: Number(row.total),
    paymentMethod: row.payment_method || 'UPI',
    status: row.status || 'PROCESSING',
    trackingNumber: row.tracking_number || `BD-${row.id}`,
  };
}

function mapOrderToDb(order: CustomerOrder) {
  return {
    id: order.id,
    order_number: order.orderNumber,
    date: order.date,
    customer: order.customer,
    items: order.items,
    subtotal: order.subtotal,
    discount: order.discount || 0,
    shipping: order.shipping || 0,
    total: order.total,
    payment_method: order.paymentMethod,
    status: order.status || 'PROCESSING',
    tracking_number: order.trackingNumber,
    created_at: Date.now(),
  };
}

export async function fetchOrdersFromSupabase(): Promise<CustomerOrder[] | null> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return null;
    }

    return data.map(mapDbOrder);
  } catch (err) {
    console.warn('[Supabase] Failed to fetch orders:', err);
    return null;
  }
}

export async function insertOrderToSupabase(order: CustomerOrder): Promise<boolean> {
  try {
    const payload = mapOrderToDb(order);
    const { error } = await supabase.from('orders').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.warn('[Supabase] Error saving order:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Supabase] Order save exception:', err);
    return false;
  }
}

export async function updateOrderStatusInSupabase(orderId: string, status: CustomerOrder['status']): Promise<boolean> {
  try {
    const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
    if (error) {
      console.warn('[Supabase] Error updating order status:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Supabase] Order status update exception:', err);
    return false;
  }
}

export async function syncAllOrdersToSupabase(orders: CustomerOrder[]): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    const payload = orders.map(mapOrderToDb);
    const { error } = await supabase.from('orders').upsert(payload, { onConflict: 'id' });
    if (error) {
      return { success: false, count: 0, error: error.message };
    }
    return { success: true, count: orders.length };
  } catch (err: any) {
    return { success: false, count: 0, error: err?.message || 'Sync failed' };
  }
}

// -----------------------------------------------------------------------------
// REGISTERED USERS ADAPTERS
// -----------------------------------------------------------------------------

function mapDbUser(row: any): RegisteredUser {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    password: row.password,
    createdAt: Number(row.created_at),
  };
}

function mapUserToDb(u: RegisteredUser) {
  return {
    id: u.id,
    first_name: u.firstName,
    last_name: u.lastName,
    email: u.email,
    phone: u.phone,
    password: u.password,
    created_at: u.createdAt || Date.now(),
  };
}

export async function fetchUsersFromSupabase(): Promise<RegisteredUser[] | null> {
  try {
    const { data, error } = await supabase
      .from('registered_users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return null;
    }

    return data.map(mapDbUser);
  } catch (err) {
    console.warn('[Supabase] Failed to fetch users:', err);
    return null;
  }
}

export async function insertUserToSupabase(user: RegisteredUser): Promise<boolean> {
  try {
    const payload = mapUserToDb(user);
    const { error } = await supabase.from('registered_users').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.warn('[Supabase] Error saving user:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Supabase] User save exception:', err);
    return false;
  }
}

export async function syncAllUsersToSupabase(users: RegisteredUser[]): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    const payload = users.map(mapUserToDb);
    const { error } = await supabase.from('registered_users').upsert(payload, { onConflict: 'id' });
    if (error) {
      return { success: false, count: 0, error: error.message };
    }
    return { success: true, count: users.length };
  } catch (err: any) {
    return { success: false, count: 0, error: err?.message || 'Sync failed' };
  }
}

// -----------------------------------------------------------------------------
// STORE SETTINGS ADAPTERS
// -----------------------------------------------------------------------------

export async function fetchShippingConfigFromSupabase(): Promise<ShippingConfig | null> {
  try {
    const { data, error } = await supabase
      .from('store_settings')
      .select('value')
      .eq('key', 'shipping_config')
      .single();

    if (error || !data) {
      return null;
    }

    return data.value as ShippingConfig;
  } catch (err) {
    console.warn('[Supabase] Failed to fetch shipping config:', err);
    return null;
  }
}

export async function saveShippingConfigToSupabase(config: ShippingConfig): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('store_settings')
      .upsert(
        {
          key: 'shipping_config',
          value: config,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' }
      );

    if (error) {
      console.warn('[Supabase] Error saving shipping config:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Supabase] Save shipping config exception:', err);
    return false;
  }
}
