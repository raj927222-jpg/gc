import { Product, CustomerOrder, RegisteredUser, ShippingConfig } from '../types';

export interface MongoHealthStatus {
  connected: boolean;
  configured: boolean;
  databaseName: string | null;
  maskedUri?: string;
  message?: string;
  collections: {
    products: number;
    orders: number;
    registered_users: number;
    store_settings: number;
  };
  lastError?: string | null;
  lastChecked: string;
}

export const DEFAULT_ATLAS_USER = 'raj927222_db_user';
export const DEFAULT_ATLAS_CLUSTER = 'cluster0.x70hmm8.mongodb.net';
export const DEFAULT_ATLAS_URI_TEMPLATE = 'mongodb+srv://raj927222_db_user:<db_password>@cluster0.x70hmm8.mongodb.net/gyutaro_atelier?appName=Cluster0&compressors=zlib';

export function buildAtlasUri(password: string): string {
  return `mongodb+srv://${DEFAULT_ATLAS_USER}:${encodeURIComponent(password.trim())}@${DEFAULT_ATLAS_CLUSTER}/gyutaro_atelier?appName=Cluster0&compressors=zlib`;
}

/**
 * Checks connection status and collection document counts from the MongoDB backend.
 */
export async function checkMongoHealth(): Promise<MongoHealthStatus> {
  try {
    const res = await fetch('/api/mongodb/status');
    if (!res.ok) {
      throw new Error(`Server returned HTTP ${res.status}`);
    }
    const data = await res.json();
    return {
      connected: Boolean(data.connected),
      configured: Boolean(data.configured),
      databaseName: data.databaseName || null,
      maskedUri: data.maskedUri,
      message: data.message,
      collections: data.collections || {
        products: 0,
        orders: 0,
        registered_users: 0,
        store_settings: 0,
      },
      lastError: data.lastError,
      lastChecked: new Date().toISOString(),
    };
  } catch (err: any) {
    return {
      connected: false,
      configured: false,
      databaseName: null,
      message: err?.message || 'Unable to communicate with MongoDB backend API',
      collections: {
        products: 0,
        orders: 0,
        registered_users: 0,
        store_settings: 0,
      },
      lastError: err?.message,
      lastChecked: new Date().toISOString(),
    };
  }
}

/**
 * Sends a new MongoDB connection string to the backend to test and save.
 */
export async function configureMongoUri(uri: string): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch('/api/mongodb/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uri }),
    });
    const data = await res.json();
    return {
      success: Boolean(data.success),
      message: data.message || (data.success ? 'Connected successfully' : 'Failed to connect'),
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Failed to send configuration to server',
    };
  }
}

// -----------------------------------------------------------------------------
// PRODUCTS ADAPTERS
// -----------------------------------------------------------------------------

export async function fetchProductsFromMongo(): Promise<Product[] | null> {
  try {
    const res = await fetch('/api/db/products');
    if (!res.ok) return null;
    const json = await res.json();
    if (json.success && Array.isArray(json.data) && json.data.length > 0) {
      return json.data as Product[];
    }
    return null;
  } catch (err) {
    console.warn('[MongoDB] Failed to fetch products:', err);
    return null;
  }
}

export async function saveProductToMongo(product: Product): Promise<boolean> {
  try {
    const res = await fetch('/api/db/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });
    const json = await res.json();
    return Boolean(json.success);
  } catch (err) {
    console.warn('[MongoDB] Save product error:', err);
    return false;
  }
}

export async function deleteProductFromMongo(productId: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/db/products/${encodeURIComponent(productId)}`, {
      method: 'DELETE',
    });
    const json = await res.json();
    return Boolean(json.success);
  } catch (err) {
    console.warn('[MongoDB] Delete product error:', err);
    return false;
  }
}

export async function syncAllProductsToMongo(products: Product[]): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    const res = await fetch('/api/db/products/sync-all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ products }),
    });
    const json = await res.json();
    if (json.success) {
      return { success: true, count: products.length };
    }
    return { success: false, count: 0, error: json.error || json.message || 'Sync failed' };
  } catch (err: any) {
    return { success: false, count: 0, error: err?.message || 'Network error during sync' };
  }
}

// -----------------------------------------------------------------------------
// ORDERS ADAPTERS
// -----------------------------------------------------------------------------

export async function fetchOrdersFromMongo(): Promise<CustomerOrder[] | null> {
  try {
    const res = await fetch('/api/db/orders');
    if (!res.ok) return null;
    const json = await res.json();
    if (json.success && Array.isArray(json.data) && json.data.length > 0) {
      return json.data as CustomerOrder[];
    }
    return null;
  } catch (err) {
    console.warn('[MongoDB] Failed to fetch orders:', err);
    return null;
  }
}

export async function insertOrderToMongo(order: CustomerOrder): Promise<boolean> {
  try {
    const res = await fetch('/api/db/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    });
    const json = await res.json();
    return Boolean(json.success);
  } catch (err) {
    console.warn('[MongoDB] Order save error:', err);
    return false;
  }
}

export async function updateOrderStatusInMongo(orderId: string, status: CustomerOrder['status']): Promise<boolean> {
  try {
    const res = await fetch(`/api/db/orders/${encodeURIComponent(orderId)}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    const json = await res.json();
    return Boolean(json.success);
  } catch (err) {
    console.warn('[MongoDB] Order status update error:', err);
    return false;
  }
}

export async function syncAllOrdersToMongo(orders: CustomerOrder[]): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    const res = await fetch('/api/db/orders/sync-all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orders }),
    });
    const json = await res.json();
    if (json.success) {
      return { success: true, count: orders.length };
    }
    return { success: false, count: 0, error: json.error || json.message || 'Sync failed' };
  } catch (err: any) {
    return { success: false, count: 0, error: err?.message || 'Network error during sync' };
  }
}

// -----------------------------------------------------------------------------
// REGISTERED USERS ADAPTERS
// -----------------------------------------------------------------------------

export async function fetchUsersFromMongo(): Promise<RegisteredUser[] | null> {
  try {
    const res = await fetch('/api/db/users');
    if (!res.ok) return null;
    const json = await res.json();
    if (json.success && Array.isArray(json.data) && json.data.length > 0) {
      return json.data as RegisteredUser[];
    }
    return null;
  } catch (err) {
    console.warn('[MongoDB] Failed to fetch users:', err);
    return null;
  }
}

export async function insertUserToMongo(user: RegisteredUser): Promise<boolean> {
  try {
    const res = await fetch('/api/db/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    });
    const json = await res.json();
    return Boolean(json.success);
  } catch (err) {
    console.warn('[MongoDB] User save error:', err);
    return false;
  }
}

export async function syncAllUsersToMongo(users: RegisteredUser[]): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    const res = await fetch('/api/db/users/sync-all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ users }),
    });
    const json = await res.json();
    if (json.success) {
      return { success: true, count: users.length };
    }
    return { success: false, count: 0, error: json.error || json.message || 'Sync failed' };
  } catch (err: any) {
    return { success: false, count: 0, error: err?.message || 'Network error during sync' };
  }
}

// -----------------------------------------------------------------------------
// STORE SETTINGS ADAPTERS
// -----------------------------------------------------------------------------

export async function fetchShippingConfigFromMongo(): Promise<ShippingConfig | null> {
  try {
    const res = await fetch('/api/db/settings/shipping_config');
    if (!res.ok) return null;
    const json = await res.json();
    if (json.success && json.data) {
      return json.data as ShippingConfig;
    }
    return null;
  } catch (err) {
    console.warn('[MongoDB] Failed to fetch shipping config:', err);
    return null;
  }
}

export async function saveShippingConfigToMongo(config: ShippingConfig): Promise<boolean> {
  try {
    const res = await fetch('/api/db/settings/shipping_config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: config }),
    });
    const json = await res.json();
    return Boolean(json.success);
  } catch (err) {
    console.warn('[MongoDB] Save shipping config error:', err);
    return false;
  }
}
