/**
 * MongoDB Compass Seeder Script
 * Connects to MongoDB (e.g. mongodb://localhost:27017/?directConnection=true)
 * and populates all collections for MongoDB Compass.
 *
 * Usage:
 *   node scripts/seedMongo.js
 */

import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';

// Read URI from environment or server/mongoConfig.json or default
let mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  try {
    const configPath = path.join(process.cwd(), 'server', 'mongoConfig.json');
    if (fs.existsSync(configPath)) {
      const cfg = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      if (cfg.uri) mongoUri = cfg.uri;
    }
  } catch (e) {
    // ignore
  }
}

if (!mongoUri) {
  mongoUri = 'mongodb://localhost:27017/gyutaro_atelier?directConnection=true';
}

console.log('Target MongoDB URI:', mongoUri);

const INITIAL_PRODUCTS = [
  {
    id: 'gc-shirt',
    name: 'GC SHIRT',
    category: 'SHIRT',
    price: 8900,
    originalPrice: 12500,
    tagline: 'Egyptian Cotton & Silk Jacquard Bespoke Dress Shirt',
    description: 'Masterfully woven from ultra-fine 180s two-ply Giza Egyptian cotton enriched with Surat silk zari weave. Finished with hand-carved genuine mother-of-pearl buttons and a structured spread collar.',
    fabric: '85% Giza Long-Staple Cotton, 15% Pure Mulberry Silk.',
    details: [
      'Hand-stitched French seams with 22 stitches per inch',
      'Removable brushed brass collar stays',
      'Curved hem designed for tucking or relaxed drape'
    ],
    badge: 'FLAGSHIP',
    badgeType: 'flagship',
    inStock: true,
    stockCount: 14,
    sizes: ['38 (S)', '40 (M)', '42 (L)', '44 (XL)', '46 (XXL)'],
    rating: 4.95,
    reviewsCount: 38,
    createdAt: new Date().toISOString()
  },
  {
    id: 'gc-oversized-tshirt',
    name: 'GC OVERSIZED T-SHIRT',
    category: 'T-SHIRT',
    price: 4900,
    originalPrice: 6500,
    tagline: 'Heavyweight Supima Cotton Sculptural Drop-Shoulder Tee',
    description: 'Cut from substantial 310 GSM combed Supima cotton with a brushed carbon peach finish. Engineered with a structured boxy drape and reinforced micro-rib collar.',
    fabric: '100% Organic Supima Cotton (310 GSM).',
    details: ['310 GSM heavy luxury knit', 'Reinforced neck ribbing with anti-sag tape', 'Blind-stitched sleeves and hem'],
    badge: 'BESTSELLER',
    badgeType: 'bestseller',
    inStock: true,
    stockCount: 22,
    sizes: ['XS (Relaxed)', 'S', 'M', 'L', 'XL'],
    rating: 4.9,
    reviewsCount: 52,
    createdAt: new Date().toISOString()
  },
  {
    id: 'gc-hoodie',
    name: 'GC HOODIE',
    category: 'HOODIE',
    price: 11500,
    originalPrice: 15000,
    tagline: '480 GSM Heavy French Terry Sculptural Pullover',
    description: 'A monument to tactile luxury. Crafted from 480 GSM organic cotton loopback French terry with double-walled hood construction and matte metallic eyelets.',
    fabric: '100% Organic Loopback French Terry (480 GSM).',
    details: ['480 GSM dense loopback interior', 'Double-lined ergonomic crossover hood', 'Hidden zippered pouch within kangaroo pocket'],
    badge: 'LIMITED EDITION',
    badgeType: 'limited',
    inStock: true,
    stockCount: 8,
    sizes: ['S', 'M', 'L', 'XL'],
    rating: 4.98,
    reviewsCount: 29,
    createdAt: new Date().toISOString()
  },
  {
    id: 'gc-perfume',
    name: 'GC EXTRAIT DE PARFUM',
    category: 'PERFUME',
    price: 14500,
    originalPrice: 18000,
    tagline: '35% Concentration Artisanal Assam Oud & Mysore Sandalwood Extrait',
    description: 'An intoxicating private reserve olfactory creation. Opens with smoky saffron and Damascus rose, descending into rare 25-year aged vintage Assam Agarwood.',
    fabric: '35% Pure Extrait Concentration. Flacon cut from solid hand-polished smoked crystal.',
    details: ['35% pure parfum concentration (14+ hour longevity)', 'Hand-numbered batch bottle with solid brass magnetic cap'],
    badge: 'HAUTE PARFUMERIE',
    badgeType: 'flagship',
    inStock: true,
    stockCount: 11,
    sizes: ['50ml Extrait', '100ml Grand Flacon'],
    rating: 5.0,
    reviewsCount: 64,
    createdAt: new Date().toISOString()
  }
];

const INITIAL_CATEGORIES = [
  { id: 'all', name: 'All Masterpieces', count: 4 },
  { id: 'SHIRT', name: 'Bespoke Shirts', count: 1 },
  { id: 'T-SHIRT', name: 'Oversized Tees', count: 1 },
  { id: 'HOODIE', name: 'Luxury Hoodies', count: 1 },
  { id: 'PERFUME', name: 'Haute Parfumerie', count: 1 }
];

const SAMPLE_ORDERS = [
  {
    orderId: 'ORD-2026-9041',
    customerName: 'Aditya Birla',
    customerEmail: 'aditya.b@luxuryclient.in',
    phone: '+91 98201 55432',
    items: [
      { productId: 'gc-perfume', name: 'GC EXTRAIT DE PARFUM', quantity: 1, price: 14500, size: '50ml Extrait' }
    ],
    totalAmount: 14500,
    shippingFee: 0,
    status: 'Delivered',
    paymentMethod: 'UPI / NetBanking',
    shippingAddress: {
      addressLine: '42, Altamount Road, Cumballa Hill',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400026'
    },
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    orderId: 'ORD-2026-9042',
    customerName: 'Vikram Singhania',
    customerEmail: 'vikram.s@atelier.in',
    phone: '+91 98110 33219',
    items: [
      { productId: 'gc-hoodie', name: 'GC HOODIE', quantity: 1, price: 11500, size: 'L' }
    ],
    totalAmount: 11500,
    shippingFee: 0,
    status: 'Processing',
    paymentMethod: 'Credit Card (Amex)',
    shippingAddress: {
      addressLine: '14 Golf Links',
      city: 'New Delhi',
      state: 'Delhi',
      postalCode: '110003'
    },
    createdAt: new Date().toISOString()
  }
];

const SAMPLE_USERS = [
  {
    id: 'user-admin-01',
    email: 'admin@gyutarocollection.com',
    name: 'Atelier Director',
    role: 'admin',
    registeredAt: new Date().toISOString()
  },
  {
    id: 'user-client-01',
    email: 'raj927222@gmail.com',
    name: 'Raj',
    role: 'client',
    registeredAt: new Date().toISOString()
  }
];

const SAMPLE_SETTINGS = {
  _id: 'default_store_settings',
  storeName: 'GYUTARO ATELIER',
  currency: 'INR',
  currencySymbol: '₹',
  shippingChargesEnabled: true,
  standardShippingFee: 450,
  freeShippingThreshold: 15000,
  shippingLabel: 'White-Glove Express Courier',
  taxRatePercent: 12,
  contactEmail: 'concierge@gyutarocollection.com',
  updatedAt: new Date().toISOString()
};

async function seed() {
  console.log('Connecting to MongoDB...');
  const client = new MongoClient(mongoUri, { connectTimeoutMS: 5000 });
  try {
    await client.connect();
    console.log('✓ Connected successfully!');
    const db = client.db('gyutaro_atelier');

    console.log(`Populating collections in database "${db.databaseName}"...`);

    // 1. Products
    await db.collection('products').deleteMany({});
    await db.collection('products').insertMany(INITIAL_PRODUCTS);
    console.log(`✓ Seeded ${INITIAL_PRODUCTS.length} products`);

    // 2. Categories
    await db.collection('categories').deleteMany({});
    await db.collection('categories').insertMany(INITIAL_CATEGORIES);
    console.log(`✓ Seeded ${INITIAL_CATEGORIES.length} categories`);

    // 3. Orders
    await db.collection('orders').deleteMany({});
    await db.collection('orders').insertMany(SAMPLE_ORDERS);
    console.log(`✓ Seeded ${SAMPLE_ORDERS.length} orders`);

    // 4. Users
    await db.collection('users').deleteMany({});
    await db.collection('users').insertMany(SAMPLE_USERS);
    console.log(`✓ Seeded ${SAMPLE_USERS.length} users`);

    // 5. Store Settings
    await db.collection('store_settings').updateOne(
      { _id: 'default_store_settings' },
      { $set: SAMPLE_SETTINGS },
      { upsert: true }
    );
    console.log('✓ Seeded store_settings');

    // 6. Carts, Wishlists, Reviews empty collections placeholder
    await db.collection('carts').createIndex({ userId: 1 }, { background: true });
    await db.collection('wishlists').createIndex({ userId: 1 }, { background: true });
    await db.collection('reviews').createIndex({ productId: 1 }, { background: true });

    console.log('\n========================================');
    console.log('✓ All collections created and populated in MongoDB!');
    console.log('Open MongoDB Compass and refresh to see:');
    console.log(`Database: ${db.databaseName}`);
    console.log('├── products');
    console.log('├── categories');
    console.log('├── orders');
    console.log('├── users');
    console.log('├── store_settings');
    console.log('├── carts');
    console.log('├── wishlists');
    console.log('└── reviews');
    console.log('========================================\n');
  } catch (err) {
    console.error('Could not connect to MongoDB:', err.message);
    console.log('\nNOTE: If you are running MongoDB Compass on your own computer, run this script locally:');
    console.log('  node scripts/seedMongo.js');
  } finally {
    await client.close();
  }
}

seed();
