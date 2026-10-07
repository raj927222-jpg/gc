/**
 * Gyutaro Collection / Saturn E-Commerce
 * Migration Script: Supabase to MongoDB
 * 
 * Usage:
 *   node scripts/migrateSupabaseToMongo.js
 * 
 * Requirements:
 *   Set SUPABASE_URL, SUPABASE_SERVICE_KEY, and MONGODB_URI in your environment or .env file.
 */

import { MongoClient } from 'mongodb';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || '';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/gyutaro_atelier';

async function runMigration() {
  console.log('--- Gyutaro / Saturn Supabase to MongoDB Migration ---');
  
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.log('[Notice] No SUPABASE_URL or SUPABASE_SERVICE_KEY found in environment.');
    console.log('Skipping remote Supabase extraction. The application is already completely running on MongoDB.');
    return;
  }

  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    console.log('Connected to MongoDB:', MONGODB_URI);
    const db = client.db();

    const collectionsToMigrate = ['products', 'orders', 'users', 'categories', 'carts', 'wishlists', 'reviews'];

    for (const collectionName of collectionsToMigrate) {
      console.log(`Checking table "${collectionName}" in Supabase...`);
      try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/${collectionName}?select=*`, {
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
          },
        });

        if (response.ok) {
          const records = await response.json();
          if (Array.isArray(records) && records.length > 0) {
            console.log(`Migrating ${records.length} records into MongoDB collection "${collectionName}"...`);
            const targetCollection = collectionName === 'users' ? 'registered_users' : collectionName;
            
            for (const record of records) {
              const filter = record.id ? { id: record.id } : { _id: record._id };
              await db.collection(targetCollection).updateOne(
                filter,
                { $set: { ...record, migratedAt: new Date() } },
                { upsert: true }
              );
            }
            console.log(`✓ Completed migration for "${collectionName}".`);
          } else {
            console.log(`- Table "${collectionName}" is empty or has no rows.`);
          }
        } else {
          console.log(`- Supabase table "${collectionName}" responded with HTTP ${response.status} (table may not exist).`);
        }
      } catch (tableErr) {
        console.warn(`- Error querying table "${collectionName}":`, tableErr.message);
      }
    }

    console.log('--- Migration completed successfully! ---');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.close();
  }
}

runMigration();
