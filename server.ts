import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { createAndSendOtp, verifyOtpCode, normalizeIdentifier } from "./server/otpService";
import { serverSupabase, SUPABASE_PROJECT_ID, SUPABASE_URL } from "./server/supabase";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check endpoint for Cloud Run container lifecycle & deployment checks
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      supabase: {
        projectId: SUPABASE_PROJECT_ID,
        url: SUPABASE_URL,
      },
    });
  });

  // ---------------------------------------------------------------------------
  // SUPABASE BACKEND API ROUTES
  // ---------------------------------------------------------------------------
  app.get("/api/supabase/status", async (req, res) => {
    try {
      const { data: prodData, error: prodErr } = await serverSupabase.from("products").select("id", { count: "exact" }).limit(1);
      const { data: orderData, error: orderErr } = await serverSupabase.from("orders").select("id", { count: "exact" }).limit(1);
      const { data: userData, error: userErr } = await serverSupabase.from("registered_users").select("id", { count: "exact" }).limit(1);
      const { data: settingsData, error: settingsErr } = await serverSupabase.from("store_settings").select("key").limit(1);

      const isConnected = !prodErr || prodErr.code === "PGRST205" || prodErr.code === "42P01" || !orderErr;

      return res.json({
        connected: isConnected,
        projectId: SUPABASE_PROJECT_ID,
        url: SUPABASE_URL,
        tables: {
          products: !prodErr,
          orders: !orderErr,
          registered_users: !userErr,
          store_settings: !settingsErr,
        },
        counts: {
          products: prodData?.length ?? 0,
          orders: orderData?.length ?? 0,
          registered_users: userData?.length ?? 0,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      return res.status(500).json({
        connected: false,
        error: err?.message || "Failed to query Supabase",
        projectId: SUPABASE_PROJECT_ID,
      });
    }
  });

  // ---------------------------------------------------------------------------
  // BACKEND OTP API ROUTES
  // ---------------------------------------------------------------------------

  // 1. Send / Generate OTP
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

  // 2. Verify OTP
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

  // 3. Resend OTP
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

  // 4. OTP Service Status
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
  // Vite middleware for development vs static serve for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: "0.0.0.0",
        port: 3000,
        hmr: process.env.DISABLE_HMR !== "true",
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
