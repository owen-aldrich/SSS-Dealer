const express = require("express");
const cors = require("cors");

function createApp(name, { parseBody = true } = {}) {
  const app = express();
  app.disable("x-powered-by");
  const origins = (process.env.CORS_ORIGINS || "").split(",").map(value => value.trim()).filter(Boolean);
  app.use(cors({
    origin: origins.length ? origins : process.env.NODE_ENV !== "production",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }));
  if (parseBody) {
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
  }
  app.get("/health", (_req, res) => res.json({ status: "success", service: name }));
  return app;
}

function databaseReadiness(app, db) {
  app.get("/ready", async (_req, res) => {
    try {
      await db.query("SELECT 1");
      res.json({ status: "success" });
    } catch {
      res.status(503).json({ status: "error", message: "Database tidak tersedia." });
    }
  });
}

function finishApp(app) {
  app.use((_req, res) => res.status(404).json({ status: "error", message: "Endpoint tidak ditemukan." }));
  app.use((err, _req, res, _next) => {
    console.error("Unhandled request error:", err.message);
    if (res.headersSent) return res.destroy();
    const status = err.status >= 400 && err.status < 500 ? err.status : 500;
    res.status(status).json({ status: "error", message: "Terjadi kesalahan server." });
  });
  return app;
}

module.exports = { createApp, databaseReadiness, finishApp };
