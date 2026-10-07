import { Router } from 'express';
import { authenticateAdmin, signAdminToken, requireAdminAuth } from './adminAuth';
import { getMongoDb } from './mongodb';
import { fallbackStore } from './fallbackStore';

const router = Router();

// ---------------------------------------------------------------------------
// 1. PUBLIC ADMIN LOGIN ENDPOINT
// ---------------------------------------------------------------------------
router.post('/login', async (req, res) => {
  try {
    const { email, username, password } = req.body || {};
    const identifier = email || username;

    const result = await authenticateAdmin(identifier, password);
    if (!result.success || !result.user) {
      return res.status(401).json({
        success: false,
        message: result.error || 'Invalid admin credentials.',
      });
    }

    const token = signAdminToken(result.user);
    return res.json({
      success: true,
      message: 'Admin authorization granted.',
      token,
      user: result.user,
    });
  } catch (err: any) {
    console.error('[Admin Login Error]', err);
    return res.status(500).json({
      success: false,
      message: 'An error occurred during authentication.',
    });
  }
});

// ---------------------------------------------------------------------------
// ALL ROUTES BELOW REQUIRE VALID ADMIN JWT AUTHORIZATION
// ---------------------------------------------------------------------------
router.use(requireAdminAuth);

// 2. VERIFY CURRENT ADMIN SESSION
router.get('/me', (req, res) => {
  return res.json({
    success: true,
    user: req.adminUser,
  });
});

// 3. ADMIN DASHBOARD AGGREGATED METRICS
router.get('/dashboard', async (req, res) => {
  try {
    const db = await getMongoDb();

    let products: any[] = [];
    let orders: any[] = [];
    let customers: any[] = [];

    if (db) {
      products = await db.collection('products').find({}).toArray();
      orders = await db.collection('orders').find({}).sort({ created_at: -1 }).toArray();
      customers = await db.collection('registered_users').find({}).sort({ createdAt: -1 }).toArray();
    } else {
      products = fallbackStore.getProducts();
      orders = fallbackStore.getOrders();
      customers = fallbackStore.getUsers();
    }

    // Clean MongoDB _id
    products = products.map(({ _id, ...rest }) => rest);
    orders = orders.map(({ _id, ...rest }) => rest);
    customers = customers.map(({ _id, password, ...rest }) => rest);

    // Revenue calculation
    const totalRevenue = orders.reduce((sum, ord) => {
      if (ord.status !== 'CANCELLED' && typeof ord.total === 'number') {
        return sum + ord.total;
      }
      return sum;
    }, 0);

    // Low stock products
    const lowStockProducts = products.filter(
      (p) => p.inStock === false || (typeof p.stockCount === 'number' && p.stockCount <= 10)
    );

    // Sales by status breakdown
    const statusCounts: Record<string, number> = {
      PENDING: 0,
      PROCESSING: 0,
      CONFIRMED: 0,
      SHIPPED: 0,
      DELIVERED: 0,
      CANCELLED: 0,
    };
    orders.forEach((ord) => {
      const s = (ord.status || 'PENDING').toUpperCase();
      statusCounts[s] = (statusCounts[s] || 0) + 1;
    });

    // Categories breakdown
    const categoryCounts: Record<string, number> = {};
    products.forEach((p) => {
      const cat = p.category || 'OTHER';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    return res.json({
      success: true,
      data: {
        totalProducts: products.length,
        totalOrders: orders.length,
        totalCustomers: customers.length,
        totalRevenue,
        recentOrders: orders.slice(0, 8),
        lowStockProducts: lowStockProducts.slice(0, 8),
        statusCounts,
        categoryCounts,
        inStockCount: products.filter((p) => p.inStock !== false).length,
        outOfStockCount: products.filter((p) => p.inStock === false).length,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err?.message });
  }
});

// 4. ADMIN PRODUCTS CRUD
router.get('/products', async (req, res) => {
  try {
    const db = await getMongoDb();
    if (db) {
      const products = await db.collection('products').find({}).toArray();
      const clean = products.map(({ _id, ...rest }) => rest);
      return res.json({ success: true, data: clean });
    }
    return res.json({ success: true, data: fallbackStore.getProducts() });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err?.message });
  }
});

router.post('/products', async (req, res) => {
  try {
    const product = req.body;
    if (!product || !product.name) {
      return res.status(400).json({ success: false, message: 'Product name is required.' });
    }

    const id = product.id || `gc-${Date.now()}`;
    const newProduct = {
      ...product,
      id,
      inStock: product.inStock !== false,
      stockCount: Number(product.stockCount) || 20,
      price: Number(product.price) || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const db = await getMongoDb();
    if (db) {
      await db.collection('products').updateOne(
        { id },
        { $set: newProduct },
        { upsert: true }
      );
    } else {
      fallbackStore.saveProduct(newProduct);
    }

    return res.status(201).json({ success: true, data: newProduct });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err?.message });
  }
});

router.put('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    if (!updates) {
      return res.status(400).json({ success: false, message: 'Update payload required.' });
    }

    const sanitized = {
      ...updates,
      id,
      updatedAt: new Date(),
    };

    const db = await getMongoDb();
    if (db) {
      await db.collection('products').updateOne({ id }, { $set: sanitized }, { upsert: true });
    } else {
      fallbackStore.saveProduct(sanitized);
    }

    return res.json({ success: true, data: sanitized });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err?.message });
  }
});

router.delete('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getMongoDb();
    if (db) {
      await db.collection('products').deleteOne({ id });
    } else {
      fallbackStore.deleteProduct(id);
    }
    return res.json({ success: true, message: `Product ${id} removed.` });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err?.message });
  }
});

router.patch('/products/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { inStock, stockCount } = req.body;

    const updateDoc: any = { updatedAt: new Date() };
    if (typeof inStock === 'boolean') updateDoc.inStock = inStock;
    if (typeof stockCount === 'number') updateDoc.stockCount = stockCount;

    const db = await getMongoDb();
    if (db) {
      await db.collection('products').updateOne({ id }, { $set: updateDoc });
    } else {
      const existing = fallbackStore.getProductById(id);
      if (existing) {
        fallbackStore.saveProduct({ ...existing, ...updateDoc });
      }
    }

    return res.json({ success: true, id, updates: updateDoc });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err?.message });
  }
});

// 5. ADMIN ORDERS CRUD & STATUS MANAGEMENT
router.get('/orders', async (req, res) => {
  try {
    const db = await getMongoDb();
    if (db) {
      const orders = await db.collection('orders').find({}).sort({ created_at: -1 }).toArray();
      const clean = orders.map(({ _id, ...rest }) => rest);
      return res.json({ success: true, data: clean });
    }
    return res.json({ success: true, data: fallbackStore.getOrders() });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err?.message });
  }
});

router.get('/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getMongoDb();
    if (db) {
      const order = await db.collection('orders').findOne({ id });
      if (order) {
        const { _id, ...clean } = order;
        return res.json({ success: true, data: clean });
      }
    }
    const found = fallbackStore.getOrderById(id);
    if (found) return res.json({ success: true, data: found });

    return res.status(404).json({ success: false, message: 'Order not found.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err?.message });
  }
});

router.patch('/orders/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required.' });
    }

    const db = await getMongoDb();
    if (db) {
      await db.collection('orders').updateOne(
        { id },
        { $set: { status, updatedAt: new Date() } }
      );
    } else {
      fallbackStore.updateOrderStatus(id, status);
    }

    return res.json({ success: true, id, status });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err?.message });
  }
});

// 6. ADMIN CUSTOMERS / REGISTERED USERS MANAGEMENT
router.get('/customers', async (req, res) => {
  try {
    const db = await getMongoDb();
    let customers: any[] = [];
    if (db) {
      customers = await db.collection('registered_users').find({}).sort({ createdAt: -1 }).toArray();
    } else {
      customers = fallbackStore.getUsers();
    }
    // Clean passwords and IDs
    const safe = customers.map(({ _id, password, ...rest }) => rest);
    return res.json({ success: true, data: safe });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err?.message });
  }
});

router.get('/users', async (req, res) => {
  try {
    const db = await getMongoDb();
    let usersList: any[] = [];
    if (db) {
      usersList = await db.collection('registered_users').find({}).sort({ createdAt: -1 }).toArray();
    } else {
      usersList = fallbackStore.getUsers();
    }
    // Always include system default admin account if not in database
    const safe = usersList.map(({ _id, password, ...rest }) => ({
      ...rest,
      role: rest.role || 'customer',
    }));

    return res.json({ success: true, data: safe });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err?.message });
  }
});

router.patch('/users/:id/role', async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    if (!role || (role !== 'admin' && role !== 'customer')) {
      return res.status(400).json({ success: false, message: 'Valid role ("admin" or "customer") required.' });
    }

    const db = await getMongoDb();
    if (db) {
      await db.collection('registered_users').updateOne(
        { $or: [{ id }, { email: id }] },
        { $set: { role, updatedAt: new Date() } }
      );
    } else {
      fallbackStore.updateUserRole(id, role);
    }
    return res.json({ success: true, id, role });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err?.message });
  }
});

// 7. ADMIN CATEGORIES
router.get('/categories', async (req, res) => {
  try {
    const db = await getMongoDb();
    let products: any[] = [];
    if (db) {
      products = await db.collection('products').find({}).toArray();
    } else {
      products = fallbackStore.getProducts();
    }

    const categoriesMap: Record<string, number> = {};
    products.forEach((p) => {
      const cat = p.category || 'OTHER';
      categoriesMap[cat] = (categoriesMap[cat] || 0) + 1;
    });

    const categoriesList = Object.entries(categoriesMap).map(([category, count]) => ({
      category,
      count,
    }));

    return res.json({ success: true, data: categoriesList });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err?.message });
  }
});

// 8. ADMIN SETTINGS (SHIPPING CONFIG, ATELIER MEDIA)
router.get('/settings', async (req, res) => {
  try {
    const db = await getMongoDb();
    if (db) {
      const shippingRecord = await db.collection('store_settings').findOne({ key: 'shipping_config' });
      return res.json({
        success: true,
        data: {
          shippingConfig: shippingRecord ? shippingRecord.value : fallbackStore.getSettings(),
        },
      });
    }
    return res.json({
      success: true,
      data: { shippingConfig: fallbackStore.getSettings() },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err?.message });
  }
});

router.post('/settings', async (req, res) => {
  try {
    const { shippingConfig } = req.body;
    if (shippingConfig) {
      fallbackStore.saveSettings(shippingConfig);
      const db = await getMongoDb();
      if (db) {
        await db.collection('store_settings').updateOne(
          { key: 'shipping_config' },
          { $set: { key: 'shipping_config', value: shippingConfig, updatedAt: new Date() } },
          { upsert: true }
        );
      }
    }
    return res.json({ success: true, message: 'Settings saved successfully.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err?.message });
  }
});

export default router;
