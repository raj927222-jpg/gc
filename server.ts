import dotenv from "dotenv";
dotenv.config();

import express from "express";
import http from "http";
import path from "path";
import { createServer as createViteServer } from "vite";
import { createAndSendOtp, verifyOtpCode } from "./server/otpService";
import { getMongoDb, getMongoStatus, setMongoUri } from "./server/mongodb";
import { fallbackStore } from "./server/fallbackStore";
import adminRoutes from "./server/adminRoutes";

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // ---------------------------------------------------------------------------
  // PROTECTED ADMIN API ROUTES (/api/admin/*)
  // ---------------------------------------------------------------------------
  app.use("/api/admin", adminRoutes);

  // ---------------------------------------------------------------------------
  // PUBLIC CUSTOMER API ROUTES (/api/products, /api/orders)
  // ---------------------------------------------------------------------------
  app.get("/api/products", async (req, res) => {
    try {
      const db = await getMongoDb();
      if (!db) {
        const fallback = fallbackStore.getProducts().filter((p) => p.inStock !== false);
        return res.json({ success: true, data: fallback });
      }
      const products = await db.collection("products").find({ inStock: { $ne: false } }).toArray();
      const clean = products.map(({ _id, ...rest }) => rest);
      return res.json({ success: true, data: clean });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const db = await getMongoDb();
      if (!db) {
        const product = fallbackStore.getProductById(req.params.id);
        if (!product) {
          return res.status(404).json({ success: false, message: "Product not found" });
        }
        return res.json({ success: true, data: product });
      }
      const product = await db.collection("products").findOne({ id: req.params.id });
      if (!product) {
        return res.status(404).json({ success: false, message: "Product not found" });
      }
      const { _id, ...clean } = product;
      return res.json({ success: true, data: clean });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message });
    }
  });

  app.post("/api/orders", async (req, res) => {
    try {
      const db = await getMongoDb();
      const order = req.body;
      if (!order || !order.id) {
        return res.status(400).json({ success: false, message: "Valid order payload required" });
      }
      if (db) {
        await db.collection("orders").updateOne(
          { id: order.id },
          { $set: { ...order, createdAt: new Date() } },
          { upsert: true }
        );
      } else {
        fallbackStore.saveOrder(order);
      }
      return res.status(201).json({ success: true, orderId: order.id });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message });
    }
  });

  // Health check endpoint
  app.get("/api/health", async (req, res) => {
    const mongoStatus = await getMongoStatus();
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      database: "MongoDB",
      mongodb: {
        connected: mongoStatus.connected,
        databaseName: mongoStatus.databaseName,
      },
    });
  });

  // ---------------------------------------------------------------------------
  // MONGODB CONFIG & STATUS API ROUTES
  // ---------------------------------------------------------------------------
  app.get("/api/mongodb/status", async (req, res) => {
    try {
      const status = await getMongoStatus();
      return res.json(status);
    } catch (err: any) {
      return res.status(500).json({
        connected: false,
        error: err?.message || "Failed to query MongoDB status",
      });
    }
  });

  app.post("/api/mongodb/config", async (req, res) => {
    try {
      const { uri } = req.body || {};
      if (!uri || typeof uri !== "string") {
        return res.status(400).json({
          success: false,
          message: "A valid MongoDB connection string (e.g. mongodb+srv://...) is required.",
        });
      }

      const result = await setMongoUri(uri);
      return res.status(result.success ? 200 : 400).json(result);
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err?.message || "Failed to configure MongoDB URI",
      });
    }
  });

  // ---------------------------------------------------------------------------
  // MONGODB DATABASE CRUD API ROUTES
  // ---------------------------------------------------------------------------

  // --- PRODUCTS ---
  app.get("/api/db/products", async (req, res) => {
    try {
      const db = await getMongoDb();
      if (!db) {
        return res.json({ success: true, data: fallbackStore.getProducts() });
      }
      const products = await db.collection("products").find({}).toArray();
      // Remove mongo _id for clean frontend compatibility
      const clean = products.map(({ _id, ...rest }) => rest);
      return res.json({ success: true, data: clean });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message });
    }
  });

  app.post("/api/db/products", async (req, res) => {
    try {
      const db = await getMongoDb();
      const product = req.body;
      if (!product || !product.id) {
        return res.status(400).json({ success: false, message: "Product must have an id" });
      }
      if (db) {
        await db.collection("products").updateOne(
          { id: product.id },
          { $set: { ...product, updatedAt: new Date() } },
          { upsert: true }
        );
      } else {
        fallbackStore.saveProduct(product);
      }
      return res.json({ success: true, id: product.id });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message });
    }
  });

  app.delete("/api/db/products/:id", async (req, res) => {
    try {
      const db = await getMongoDb();
      if (db) {
        await db.collection("products").deleteOne({ id: req.params.id });
      } else {
        fallbackStore.deleteProduct(req.params.id);
      }
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message });
    }
  });

  app.post("/api/db/products/sync-all", async (req, res) => {
    try {
      const db = await getMongoDb();
      const { products } = req.body;
      if (!Array.isArray(products)) {
        return res.status(400).json({ success: false, message: "Products array is required" });
      }
      if (db) {
        const collection = db.collection("products");
        for (const p of products) {
          if (p && p.id) {
            await collection.updateOne(
              { id: p.id },
              { $set: { ...p, updatedAt: new Date() } },
              { upsert: true }
            );
          }
        }
      } else {
        fallbackStore.syncAllProducts(products);
      }
      return res.json({ success: true, count: products.length });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message });
    }
  });

  // --- ORDERS ---
  app.get("/api/db/orders", async (req, res) => {
    try {
      const db = await getMongoDb();
      if (!db) {
        return res.json({ success: true, data: fallbackStore.getOrders() });
      }
      const orders = await db
        .collection("orders")
        .find({})
        .sort({ created_at: -1 })
        .toArray();
      const clean = orders.map(({ _id, ...rest }) => rest);
      return res.json({ success: true, data: clean });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message });
    }
  });

  app.post("/api/db/orders", async (req, res) => {
    try {
      const db = await getMongoDb();
      const order = req.body;
      if (!order || !order.id) {
        return res.status(400).json({ success: false, message: "Order must have an id" });
      }
      if (db) {
        await db.collection("orders").updateOne(
          { id: order.id },
          { $set: { ...order, syncedAt: new Date() } },
          { upsert: true }
        );
      } else {
        fallbackStore.saveOrder(order);
      }
      return res.json({ success: true, id: order.id });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message });
    }
  });

  app.patch("/api/db/orders/:id/status", async (req, res) => {
    try {
      const db = await getMongoDb();
      const { status } = req.body;
      if (db) {
        await db.collection("orders").updateOne(
          { id: req.params.id },
          { $set: { status, updatedAt: new Date() } }
        );
      } else {
        fallbackStore.updateOrderStatus(req.params.id, status);
      }
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message });
    }
  });

  // --- REGISTERED USERS ---
  app.get("/api/db/users", async (req, res) => {
    try {
      const db = await getMongoDb();
      if (!db) {
        return res.json({ success: true, data: fallbackStore.getUsers() });
      }
      const users = await db
        .collection("registered_users")
        .find({})
        .sort({ createdAt: -1 })
        .toArray();
      const clean = users.map(({ _id, ...rest }) => rest);
      return res.json({ success: true, data: clean });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message });
    }
  });

  app.post("/api/db/users", async (req, res) => {
    try {
      const db = await getMongoDb();
      const user = req.body;
      if (!user || (!user.id && !user.email)) {
        return res.status(400).json({ success: false, message: "User must have id or email" });
      }
      if (db) {
        const identifier = user.id ? { id: user.id } : { email: user.email };
        await db.collection("registered_users").updateOne(
          identifier,
          { $set: { ...user, updatedAt: new Date() } },
          { upsert: true }
        );
      } else {
        fallbackStore.saveUser(user);
      }
      return res.json({ success: true, user: user.email });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message });
    }
  });

  // --- STORE SETTINGS (Shipping, etc.) ---
  app.get("/api/db/settings/:key", async (req, res) => {
    try {
      const db = await getMongoDb();
      if (!db) {
        return res.json({ success: true, data: fallbackStore.getSettings() });
      }
      const record = await db.collection("store_settings").findOne({ key: req.params.key });
      return res.json({ success: true, data: record ? record.value : fallbackStore.getSettings() });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message });
    }
  });

  app.post("/api/db/settings/:key", async (req, res) => {
    try {
      const db = await getMongoDb();
      const { value } = req.body;
      if (db) {
        await db.collection("store_settings").updateOne(
          { key: req.params.key },
          { $set: { key: req.params.key, value, updatedAt: new Date() } },
          { upsert: true }
        );
      } else {
        fallbackStore.saveSettings(value);
      }
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message });
    }
  });

  // ---------------------------------------------------------------------------
  // BACKEND OTP API ROUTES
  // ---------------------------------------------------------------------------
  app.post("/api/otp/send", (req, res) => {
    try {
      const { identifier, type = "LOGIN" } = req.body || {};
      if (!identifier) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid email or mobile number.",
        });
      }
      const result = createAndSendOtp(identifier, type);
      return res.status(result.success ? 200 : 429).json(result);
    } catch (err: any) {
      console.error("[OTP SEND ERROR]", err);
      return res.status(500).json({
        success: false,
        message: "An internal server error occurred while dispatching OTP.",
      });
    }
  });

  app.post("/api/otp/verify", (req, res) => {
    try {
      const { identifier, otp, type } = req.body || {};
      if (!identifier || !otp) {
        return res.status(400).json({
          success: false,
          verified: false,
          message: "Both identifier and 6-digit OTP passcode are required.",
        });
      }
      const result = verifyOtpCode(identifier, otp, type);
      return res.status(result.verified ? 200 : 400).json(result);
    } catch (err: any) {
      console.error("[OTP VERIFY ERROR]", err);
      return res.status(500).json({
        success: false,
        verified: false,
        message: "An internal server error occurred during OTP verification.",
      });
    }
  });

  app.post("/api/otp/resend", (req, res) => {
    try {
      const { identifier, type = "LOGIN" } = req.body || {};
      if (!identifier) {
        return res.status(400).json({
          success: false,
          message: "Identifier is required.",
        });
      }
      const result = createAndSendOtp(identifier, type);
      return res.status(result.success ? 200 : 429).json(result);
    } catch (err: any) {
      console.error("[OTP RESEND ERROR]", err);
      return res.status(500).json({
        success: false,
        message: "An internal server error occurred while resending OTP.",
      });
    }
  });

  app.get("/api/otp/status", (req, res) => {
    res.json({
      status: "online",
      service: "Gyutaro Atelier OTP Gateway",
      channels: ["SMS", "Email", "WhatsApp"],
      expirySeconds: 300,
      timestamp: new Date().toISOString(),
    });
  });

  // ---------------------------------------------------------------------------
  // VITE & STATIC SERVE
  // ---------------------------------------------------------------------------
  if (process.env.NODE_ENV !== "production") {
    const isHmrDisabled = process.env.DISABLE_HMR === "true";
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: "0.0.0.0",
        port: 3000,
        hmr: isHmrDisabled ? false : { server: httpServer },
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
