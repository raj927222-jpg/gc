import fs from 'fs';
import path from 'path';
import { INITIAL_PRODUCTS } from '../src/data/products';
import { DEFAULT_ORDERS, DEFAULT_SHIPPING_CONFIG } from './defaultData';

const STORE_FILE = path.join(process.cwd(), 'server', 'fallbackStore.json');

export interface FallbackStoreData {
  products: any[];
  orders: any[];
  users: any[];
  settings: {
    shippingChargesEnabled: boolean;
    standardShippingFee: number;
    freeShippingThreshold: number;
    shippingLabel: string;
  };
}

const defaultSettings = DEFAULT_SHIPPING_CONFIG;

function initStore(): FallbackStoreData {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const content = fs.readFileSync(STORE_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      return {
        products: Array.isArray(parsed.products) && parsed.products.length > 0 ? parsed.products : INITIAL_PRODUCTS,
        orders: Array.isArray(parsed.orders) && parsed.orders.length > 0 ? parsed.orders : DEFAULT_ORDERS,
        users: Array.isArray(parsed.users) ? parsed.users : [],
        settings: parsed.settings || defaultSettings,
      };
    }
  } catch (err) {
    console.warn('[FallbackStore] Error reading store file, using defaults:', err);
  }

  const initial: FallbackStoreData = {
    products: INITIAL_PRODUCTS,
    orders: DEFAULT_ORDERS,
    users: [],
    settings: defaultSettings,
  };
  saveStore(initial);
  return initial;
}

function saveStore(data: FallbackStoreData) {
  try {
    const dir = path.dirname(STORE_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[FallbackStore] Failed to write store file:', err);
  }
}

let inMemoryStore: FallbackStoreData = initStore();

export const fallbackStore = {
  // PRODUCTS
  getProducts(): any[] {
    return inMemoryStore.products;
  },
  getProductById(id: string): any | null {
    return inMemoryStore.products.find((p) => p.id === id) || null;
  },
  saveProduct(product: any): any {
    const id = product.id || `gc-${Date.now()}`;
    const newProduct = {
      ...product,
      id,
      inStock: product.inStock !== false,
      stockCount: Number(product.stockCount) || 20,
      price: Number(product.price) || 0,
      updatedAt: new Date().toISOString(),
    };
    const index = inMemoryStore.products.findIndex((p) => p.id === id);
    if (index >= 0) {
      inMemoryStore.products[index] = { ...inMemoryStore.products[index], ...newProduct };
    } else {
      inMemoryStore.products.unshift(newProduct);
    }
    saveStore(inMemoryStore);
    return newProduct;
  },
  deleteProduct(id: string): boolean {
    const before = inMemoryStore.products.length;
    inMemoryStore.products = inMemoryStore.products.filter((p) => p.id !== id);
    saveStore(inMemoryStore);
    return inMemoryStore.products.length < before;
  },
  syncAllProducts(products: any[]): void {
    inMemoryStore.products = products;
    saveStore(inMemoryStore);
  },

  // ORDERS
  getOrders(): any[] {
    return inMemoryStore.orders;
  },
  getOrderById(id: string): any | null {
    return inMemoryStore.orders.find((o) => o.id === id) || null;
  },
  saveOrder(order: any): any {
    const id = order.id || `order-${Date.now()}`;
    const newOrder = {
      ...order,
      id,
      createdAt: order.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const index = inMemoryStore.orders.findIndex((o) => o.id === id);
    if (index >= 0) {
      inMemoryStore.orders[index] = { ...inMemoryStore.orders[index], ...newOrder };
    } else {
      inMemoryStore.orders.unshift(newOrder);
    }
    saveStore(inMemoryStore);
    return newOrder;
  },
  updateOrderStatus(id: string, status: string): boolean {
    const order = inMemoryStore.orders.find((o) => o.id === id);
    if (order) {
      order.status = status;
      order.updatedAt = new Date().toISOString();
      saveStore(inMemoryStore);
      return true;
    }
    return false;
  },
  syncAllOrders(orders: any[]): void {
    inMemoryStore.orders = orders;
    saveStore(inMemoryStore);
  },

  // USERS
  getUsers(): any[] {
    return inMemoryStore.users;
  },
  syncAllUsers(users: any[]): void {
    inMemoryStore.users = users;
    saveStore(inMemoryStore);
  },
  saveUser(user: any): any {
    const id = user.id || user.email;
    const existingIdx = inMemoryStore.users.findIndex((u) => u.id === id || u.email === user.email);
    const updatedUser = {
      ...user,
      id,
      role: user.role || 'customer',
      updatedAt: new Date().toISOString(),
    };
    if (existingIdx >= 0) {
      inMemoryStore.users[existingIdx] = { ...inMemoryStore.users[existingIdx], ...updatedUser };
    } else {
      inMemoryStore.users.push(updatedUser);
    }
    saveStore(inMemoryStore);
    return updatedUser;
  },
  updateUserRole(id: string, role: string): boolean {
    const user = inMemoryStore.users.find((u) => u.id === id || u.email === id);
    if (user) {
      user.role = role;
      user.updatedAt = new Date().toISOString();
      saveStore(inMemoryStore);
      return true;
    }
    return false;
  },

  // SETTINGS
  getSettings(): any {
    return inMemoryStore.settings;
  },
  saveSettings(settings: any): void {
    inMemoryStore.settings = { ...inMemoryStore.settings, ...settings };
    saveStore(inMemoryStore);
  },

  // COUNTS
  getCounts() {
    return {
      products: inMemoryStore.products.length,
      orders: inMemoryStore.orders.length,
      registered_users: inMemoryStore.users.length,
      store_settings: 1,
    };
  },
};
