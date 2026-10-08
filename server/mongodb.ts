import { MongoClient, Db, ServerApiVersion } from 'mongodb';
import fs from 'fs';
import path from 'path';
import { fallbackStore } from './fallbackStore';
import {
  DEFAULT_ORDERS,
  DEFAULT_SHIPPING_CONFIG,
  DEFAULT_ATELIER_INFO,
  DEFAULT_BRANDING_ASSETS,
} from './defaultData';

const CONFIG_FILE_PATH = path.join(process.cwd(), 'server', 'mongoConfig.json');
export const DEFAULT_CLUSTER_HOST = 'cluster0.x70hmm8.mongodb.net';
export const DEFAULT_DB_USER = 'raj927222_db_user';
export const DEFAULT_DB_NAME = 'gyutaro_atelier';

// Load stored URI if exists
function loadStoredUri(): string {
  if (process.env.MONGODB_URI) {
    return process.env.MONGODB_URI;
  }
  try {
    if (fs.existsSync(CONFIG_FILE_PATH)) {
      const data = JSON.parse(fs.readFileSync(CONFIG_FILE_PATH, 'utf-8'));
      if (data && data.uri) {
        return data.uri;
      }
    }
  } catch (err) {
    console.warn('[MongoDB] Failed to read stored config:', err);
  }
  return '';
}

function saveStoredUri(uri: string) {
  try {
    const dir = path.dirname(CONFIG_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify({ uri, updatedAt: new Date().toISOString() }, null, 2));
  } catch (err) {
    console.warn('[MongoDB] Failed to persist URI config:', err);
  }
}

let currentMongoUri = loadStoredUri();
let client: MongoClient | null = null;
let dbInstance: Db | null = null;
let isConnecting = false;
let lastConnectionError: string | null = null;
let lastAttemptFailedTime = 0;
const RECONNECT_COOLDOWN_MS = 30000; // 30s cooldown before retrying unreachable DB

/**
 * Normalizes connection URI ensuring credentials with special characters are safely escaped
 * and dbName is included in path
 */
export function normalizeMongoUri(uri: string): string {
  let clean = uri.trim();
  if (!clean) return clean;

  // Handle credentials if user provided angle brackets or unencoded special chars
  // e.g. mongodb+srv://gyutaro_collection:<raj@123>@cluster0.x70hmm8.mongodb.net/?appName=Cluster0
  const lastAtIdx = clean.lastIndexOf('@');
  const protoEnd = clean.indexOf('://');
  if (lastAtIdx !== -1 && protoEnd !== -1) {
    const proto = clean.substring(0, protoEnd + 3);
    const creds = clean.substring(protoEnd + 3, lastAtIdx);
    const hostAndRest = clean.substring(lastAtIdx + 1);

    const colonIdx = creds.indexOf(':');
    if (colonIdx !== -1) {
      const user = creds.substring(0, colonIdx);
      let pass = creds.substring(colonIdx + 1);
      // Remove angle brackets < > if user left them in password
      if (pass.startsWith('<') && pass.endsWith('>')) {
        pass = pass.slice(1, -1);
      }
      // Encode pass if not already encoded
      try {
        const decoded = decodeURIComponent(pass);
        pass = encodeURIComponent(decoded);
      } catch {
        pass = encodeURIComponent(pass);
      }
      clean = `${proto}${user}:${pass}@${hostAndRest}`;
    }
  }

  // If no dbName in path for mongodb.net, inject gyutaro_atelier
  if (/mongodb(\+srv)?:\/\/[^/]+\/?(\?|$)/.test(clean)) {
    if (clean.includes('.mongodb.net')) {
      clean = clean.replace(/(\.mongodb\.net\/?)(\?|$)/, `$1${DEFAULT_DB_NAME}$2`);
    } else if (clean.startsWith('mongodb://') && !clean.includes('mongodb+srv://')) {
      // For local URLs like mongodb://localhost:27017/?...
      // ensure database name exists if omitted before query parameters
      const urlMatch = clean.match(/^(mongodb:\/\/[^\/?#]+)(\/)?(\?.*)?$/);
      if (urlMatch) {
        const base = urlMatch[1];
        const query = urlMatch[3] || '';
        clean = `${base}/${DEFAULT_DB_NAME}${query}`;
      }
    }
  }
  return clean;
}

/**
 * Initializes and retrieves the MongoDB database instance.
 */
export async function getMongoDb(customUri?: string, forceRetry = false): Promise<Db | null> {
  const rawUri = customUri || currentMongoUri;

  if (!rawUri || rawUri.includes('<db_password>')) {
    lastConnectionError = rawUri?.includes('<db_password>')
      ? 'Password placeholder <db_password> needs to be replaced with your actual MongoDB Atlas password.'
      : 'No MongoDB URI configured.';
    return null;
  }

  // If already connected with the same URI, reuse instance
  if (client && dbInstance && (!customUri || customUri === currentMongoUri)) {
    return dbInstance;
  }

  // Check cooldown to avoid hammering unreachable servers on every HTTP request
  if (!forceRetry && !customUri && Date.now() - lastAttemptFailedTime < RECONNECT_COOLDOWN_MS) {
    return null;
  }

  if (isConnecting) {
    await new Promise((r) => setTimeout(r, 600));
    if (dbInstance) return dbInstance;
  }

  isConnecting = true;
  lastConnectionError = null;

  const uriToUse = normalizeMongoUri(rawUri);
  const isLocal = uriToUse.includes('localhost') || uriToUse.includes('127.0.0.1');

  try {
    if (client) {
      try {
        await client.close();
      } catch {
        // Ignore close error on re-connection
      }
      client = null;
      dbInstance = null;
    }

    const isAtlas = uriToUse.includes('mongodb.net') || uriToUse.startsWith('mongodb+srv://');
    const options: any = {
      connectTimeoutMS: isLocal ? 1500 : 8000,
      serverSelectionTimeoutMS: isLocal ? 1500 : 8000,
    };

    if (isAtlas) {
      options.serverApi = {
        version: ServerApiVersion.v1,
        strict: false,
        deprecationErrors: true,
      };
    }

    const newClient = new MongoClient(uriToUse, options);

    await newClient.connect();

    // Verify ping
    await newClient.db('admin').command({ ping: 1 });

    client = newClient;
    currentMongoUri = uriToUse;
    lastAttemptFailedTime = 0;
    saveStoredUri(uriToUse);

    // Extract db name from URI or use default
    let dbName = DEFAULT_DB_NAME;
    try {
      const parsedUrl = new URL(uriToUse.replace('mongodb+srv://', 'https://').replace('mongodb://', 'http://'));
      const pathDb = parsedUrl.pathname.replace(/^\//, '');
      if (pathDb) {
        dbName = pathDb;
      }
    } catch {
      // Keep default
    }

    dbInstance = client.db(dbName);
    console.log(`[MongoDB] Connected successfully to database: "${dbName}"`);

    // Ensure useful indexes
    try {
      await dbInstance.collection('products').createIndex({ id: 1 }, { unique: true });
      await dbInstance.collection('orders').createIndex({ id: 1 }, { unique: true });
      await dbInstance.collection('registered_users').createIndex({ email: 1 }, { unique: true, sparse: true });
      await dbInstance.collection('store_settings').createIndex({ key: 1 }, { unique: true });
    } catch (idxErr) {
      console.warn('[MongoDB] Index creation note:', idxErr);
    }

    // Auto-seed collections if empty
    try {
      // 1. Products
      const existingProdCount = await dbInstance.collection('products').countDocuments();
      if (existingProdCount === 0) {
        const initialProducts = fallbackStore.getProducts();
        if (initialProducts.length > 0) {
          await dbInstance.collection('products').insertMany(initialProducts);
          console.log(`[MongoDB] Auto-seeded ${initialProducts.length} initial products to "${dbName}.products"`);
        }
      }

      // 2. Orders
      const existingOrderCount = await dbInstance.collection('orders').countDocuments();
      if (existingOrderCount === 0) {
        const initialOrders = fallbackStore.getOrders();
        if (initialOrders.length > 0) {
          await dbInstance.collection('orders').insertMany(initialOrders);
          console.log(`[MongoDB] Auto-seeded ${initialOrders.length} initial orders to "${dbName}.orders"`);
        }
      }

      // 3. Store Settings
      const existingSettingsCount = await dbInstance.collection('store_settings').countDocuments();
      if (existingSettingsCount === 0) {
        const defaultSettingsRecords = [
          { key: 'shipping_config', value: DEFAULT_SHIPPING_CONFIG, updatedAt: new Date() },
          { key: 'atelier_info', value: DEFAULT_ATELIER_INFO, updatedAt: new Date() },
          { key: 'branding_assets', value: DEFAULT_BRANDING_ASSETS, updatedAt: new Date() },
        ];
        await dbInstance.collection('store_settings').insertMany(defaultSettingsRecords);
        console.log(`[MongoDB] Auto-seeded default store settings to "${dbName}.store_settings"`);
      }
    } catch (seedErr) {
      console.warn('[MongoDB] Auto-seed note:', seedErr);
    }

    return dbInstance;
  } catch (err: any) {
    const rawError = err?.message || 'Failed to connect to MongoDB instance';
    if (
      rawError.includes('SSL routines') ||
      rawError.includes('SSL alert number 80') ||
      rawError.includes('tlsv1 alert internal error')
    ) {
      lastConnectionError =
        'Atlas Firewall: MongoDB Atlas blocked this connection. In MongoDB Atlas Dashboard -> Network Access -> click "Add IP Address" -> select "Allow Access from Anywhere" (0.0.0.0/0) -> Confirm.';
    } else if (rawError.includes('bad auth') || rawError.includes('Authentication failed')) {
      lastConnectionError =
        'Authentication failed: Please verify your MongoDB database user credentials in Atlas -> Database Access.';
    } else {
      lastConnectionError = rawError;
    }
    lastAttemptFailedTime = Date.now();
    client = null;
    dbInstance = null;

    if (isLocal) {
      // Local connection refused is expected when running in cloud preview without local mongod
      console.info(
        `[MongoDB] Note: Local MongoDB at ${uriToUse} is not running in this cloud environment. Seamless local storage active.`
      );
    } else {
      console.warn('[MongoDB] Connection notice:', lastConnectionError);
    }
    return null;
  } finally {
    isConnecting = false;
  }
}

/**
 * Checks connection status and collection statistics.
 */
export async function getMongoStatus() {
  const isLocal = currentMongoUri.includes('localhost') || currentMongoUri.includes('127.0.0.1');

  if (!currentMongoUri || currentMongoUri.includes('<db_password>')) {
    const isPlaceholder = currentMongoUri.includes('<db_password>');
    return {
      connected: false,
      configured: Boolean(currentMongoUri),
      databaseName: DEFAULT_DB_NAME,
      clusterHost: DEFAULT_CLUSTER_HOST,
      dbUser: DEFAULT_DB_USER,
      isLocal: false,
      message: isPlaceholder
        ? 'MongoDB Atlas URL received! Please replace <db_password> with your actual database user password to connect.'
        : 'Enter your MongoDB connection string (Atlas or Local/Compass) to link the database.',
      collections: fallbackStore.getCounts(),
      lastError: isPlaceholder
        ? 'Password required: Replace <db_password> with your MongoDB user password.'
        : null,
    };
  }

  // Parse host from current URI
  let detectedHost = isLocal ? 'localhost:27017' : DEFAULT_CLUSTER_HOST;
  let detectedUser = isLocal ? 'Local / Compass' : DEFAULT_DB_USER;
  try {
    const fakeUrl = currentMongoUri.replace('mongodb+srv://', 'http://').replace('mongodb://', 'http://');
    const parsed = new URL(fakeUrl);
    if (parsed.host) detectedHost = parsed.host;
    if (parsed.username) detectedUser = decodeURIComponent(parsed.username);
    else if (!parsed.username && isLocal) detectedUser = 'Local / Compass';
  } catch {
    // fallback
  }

  try {
    const db = await getMongoDb();
    if (!db) {
      return {
        connected: false,
        configured: true,
        databaseName: DEFAULT_DB_NAME,
        clusterHost: detectedHost,
        dbUser: detectedUser,
        isLocal,
        message: isLocal
          ? 'Local MongoDB (localhost:27017) configured for MongoDB Compass. When running on your PC (via npm run dev), it connects directly. In this cloud preview, persistent local store is active.'
          : (lastConnectionError || 'Unable to establish connection to MongoDB'),
        collections: fallbackStore.getCounts(),
        lastError: null,
      };
    }

    const [prodCount, ordCount, userCount, settCount] = await Promise.all([
      db.collection('products').countDocuments().catch(() => 0),
      db.collection('orders').countDocuments().catch(() => 0),
      db.collection('registered_users').countDocuments().catch(() => 0),
      db.collection('store_settings').countDocuments().catch(() => 0),
    ]);

    // Mask URI for security
    const maskedUri = currentMongoUri.replace(/(mongodb(\+srv)?:\/\/[^:]+:)([^@]+)(@.+)/, '$1******$4');

    return {
      connected: true,
      configured: true,
      databaseName: db.databaseName,
      clusterHost: detectedHost,
      dbUser: detectedUser,
      isLocal,
      maskedUri,
      message: `Connected to MongoDB (${detectedHost} / ${db.databaseName})`,
      collections: {
        products: prodCount,
        orders: ordCount,
        registered_users: userCount,
        store_settings: settCount,
      },
      lastError: null,
    };
  } catch (err: any) {
    return {
      connected: false,
      configured: true,
      databaseName: DEFAULT_DB_NAME,
      clusterHost: detectedHost,
      dbUser: detectedUser,
      isLocal,
      message: err?.message || 'Error communicating with MongoDB',
      collections: fallbackStore.getCounts(),
      lastError: null,
    };
  }
}

/**
 * Updates MongoDB connection URI dynamically.
 */
export async function setMongoUri(newUri: string): Promise<{ success: boolean; message: string }> {
  const clean = normalizeMongoUri(newUri);
  if (clean.includes('<db_password>')) {
    return {
      success: false,
      message: 'Please replace <db_password> with your actual MongoDB Atlas database user password.',
    };
  }

  lastAttemptFailedTime = 0; // Reset cooldown so we immediately attempt test connection

  try {
    const testDb = await getMongoDb(clean, true);
    if (!testDb) {
      const isLocal = clean.includes('localhost') || clean.includes('127.0.0.1');
      if (isLocal) {
        // Save the URI anyway so when the user runs the app locally on their machine, it connects to Compass!
        currentMongoUri = clean;
        saveStoredUri(clean);
        return {
          success: true,
          message: 'Saved local MongoDB URI for Compass! (When running locally with "npm run dev", it will connect directly to your local MongoDB Compass).',
        };
      }

      // For Atlas: save the URI so it is preserved
      currentMongoUri = clean;
      saveStoredUri(clean);

      return {
        success: false,
        message: lastConnectionError || 'Could not connect to MongoDB with the provided credentials.',
      };
    }
    currentMongoUri = clean;
    saveStoredUri(clean);
    return {
      success: true,
      message: `Successfully connected to MongoDB database "${testDb.databaseName}"!`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Failed to update MongoDB URI',
    };
  }
}

export async function seedAllCollections(force = false) {
  const db = await getMongoDb();
  if (!db) {
    return { success: false, message: 'Database not connected' };
  }

  const results: any = {};

  // 1. Products
  const prodCount = await db.collection('products').countDocuments();
  if (force || prodCount === 0) {
    const products = fallbackStore.getProducts();
    for (const p of products) {
      await db.collection('products').updateOne(
        { id: p.id },
        { $set: { ...p, updatedAt: new Date() } },
        { upsert: true }
      );
    }
    results.products = products.length;
  } else {
    results.products = prodCount;
  }

  // 2. Orders
  const orderCount = await db.collection('orders').countDocuments();
  if (force || orderCount === 0) {
    const orders = fallbackStore.getOrders();
    for (const o of orders) {
      await db.collection('orders').updateOne(
        { id: o.id },
        { $set: { ...o, updatedAt: new Date() } },
        { upsert: true }
      );
    }
    results.orders = orders.length;
  } else {
    results.orders = orderCount;
  }

  // 3. Store settings
  const settingsCount = await db.collection('store_settings').countDocuments();
  if (force || settingsCount === 0) {
    const shipping = fallbackStore.getSettings() || DEFAULT_SHIPPING_CONFIG;
    await db.collection('store_settings').updateOne(
      { key: 'shipping_config' },
      { $set: { key: 'shipping_config', value: shipping, updatedAt: new Date() } },
      { upsert: true }
    );
    await db.collection('store_settings').updateOne(
      { key: 'atelier_info' },
      { $set: { key: 'atelier_info', value: DEFAULT_ATELIER_INFO, updatedAt: new Date() } },
      { upsert: true }
    );
    await db.collection('store_settings').updateOne(
      { key: 'branding_assets' },
      { $set: { key: 'branding_assets', value: DEFAULT_BRANDING_ASSETS, updatedAt: new Date() } },
      { upsert: true }
    );
    results.store_settings = 3;
  } else {
    results.store_settings = settingsCount;
  }

  return { success: true, seeded: results };
}

export { currentMongoUri };
