// =============================================================
// Path penting project — satu sumber kebenaran.
// Semua file yang butuh lokasi folder harus mengimpor dari sini,
// jangan menulis "../uploads" manual (rapuh kalau struktur berubah).
// =============================================================

const path = require("path");

// src/config/paths.js -> naik 2 level = root project
const ROOT_DIR = path.join(__dirname, "..", "..");

module.exports = {
  ROOT_DIR,
  PUBLIC_DIR: path.join(ROOT_DIR, "public"),   // frontend (satu-satunya yang dilayani ke browser)
  UPLOADS_DIR: path.join(ROOT_DIR, "uploads"), // file hasil upload (foto profil & foto mobil)
  ENV_FILE: path.join(ROOT_DIR, ".env"),
};
