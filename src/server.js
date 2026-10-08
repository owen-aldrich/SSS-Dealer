// =============================================================
// SSS+Dealer — Express Server
// Backend: Node.js + Express + Prisma + PostgreSQL (Neon)
// =============================================================

const { PUBLIC_DIR, UPLOADS_DIR, ENV_FILE } = require("./config/paths");

// Muat .env dari root project (tidak bergantung folder tempat perintah dijalankan)
require("dotenv").config({ path: ENV_FILE });

const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// =============================================================
// MIDDLEWARE GLOBAL
// =============================================================

// Parse JSON body
app.use(express.json());

// Parse URL-encoded body (form submit)
app.use(express.urlencoded({ extended: true }));

// CORS — izinkan frontend static HTML mengakses API
app.use(
  cors({
    origin: process.env.NODE_ENV === "production" ? false : "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// =============================================================
// STATIC FILES
// Hanya folder public/ yang dilayani ke browser — kode backend
// (src/), schema (prisma/), dan .env TIDAK bisa diakses dari luar.
// =============================================================
app.use(express.static(PUBLIC_DIR));

// Folder upload (foto profil user & foto mobil)
app.use("/uploads", express.static(UPLOADS_DIR));

// =============================================================
// API ROUTES
// =============================================================
const authRoutes       = require("./routes/auth");
const carsRoutes       = require("./routes/cars");
const favoritesRoutes  = require("./routes/favorites");
const compareRoutes    = require("./routes/compare");
const accountRoutes    = require("./routes/account");
const testDriveRoutes  = require("./routes/testDrive");
const leadsRoutes      = require("./routes/leads");

app.use("/api/auth",       authRoutes);
app.use("/api/cars",       carsRoutes);
app.use("/api/favorites",  favoritesRoutes);
app.use("/api/compare",    compareRoutes);
app.use("/api/account",    accountRoutes);
app.use("/api/test-drive", testDriveRoutes);
app.use("/api/leads",      leadsRoutes);

// =============================================================
// FALLBACK — semua route non-API dikembalikan ke index.html
// (agar navigasi langsung ke /cars.html, dll tetap bekerja)
// =============================================================
app.get("*", (req, res) => {
  // Kalau request ke /api/* yang tidak dikenal, kembalikan 404 JSON
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ status: "error", message: "Endpoint tidak ditemukan." });
  }
  // Permintaan file (ada ekstensi, mis. /foo.css) yang tidak ada -> 404 sungguhan,
  // supaya file hilang tidak diam-diam diganti halaman beranda.
  if (path.extname(req.path)) {
    return res.status(404).send("Tidak ditemukan.");
  }
  // Selain itu: serve index.html
  res.sendFile(path.join(PUBLIC_DIR, "index.html"));
});

// =============================================================
// GLOBAL ERROR HANDLER
// =============================================================
app.use((err, req, res, _next) => {
  console.error("❌ Unhandled error:", err);
  res.status(500).json({ status: "error", message: "Terjadi kesalahan server." });
});

// =============================================================
// START SERVER
// =============================================================
app.listen(PORT, () => {
  console.log(`✅ SSS+Dealer server running at http://localhost:${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || "development"}`);
});
