const { loadEnv, getBackendUrl } = require("./config");
loadEnv();
const path = require("node:path");
const express = require("express");
const { createProxy } = require("./proxy");

function createFrontendApp({ backendUrl = getBackendUrl() } = {}) {
  const app = express();
  app.disable("x-powered-by");
  const publicDir = path.resolve(__dirname, "../public");
  app.get("/health", (_req, res) => res.json({ status: "success", service: "frontend" }));
  app.use(["/api", "/uploads"], createProxy(backendUrl));
  app.use(express.static(publicDir));
  app.get("*", (req, res) => {
    if (path.extname(req.path) || req.path.split("/").some(part => part.startsWith("."))) {
      return res.status(404).send("Tidak ditemukan.");
    }
    res.sendFile(path.join(publicDir, "index.html"));
  });
  app.use((_req, res) => res.status(404).json({ status: "error", message: "Endpoint tidak ditemukan." }));
  app.use((err, _req, res, _next) => {
    console.error("Frontend request error:", err.message);
    if (res.headersSent) return res.destroy();
    res.status(500).json({ status: "error", message: "Terjadi kesalahan server." });
  });
  return app;
}

module.exports = { createFrontendApp };
