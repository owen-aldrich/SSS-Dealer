// =============================================================
// db:init — Jalankan schema.sql langsung ke database
// Jalankan: npm run db:init
// =============================================================

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const mysql = require("mysql2/promise");
const fs    = require("fs");
const path  = require("path");

async function init() {
  const config = {
    host:     process.env.DB_HOST     || "127.0.0.1",
    port:     parseInt(process.env.DB_PORT || "3306"),
    user:     process.env.DB_USER     || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME     || "sss_dealer",
    multipleStatements: true,
  };
  if (process.env.DB_SSL === "true") config.ssl = { minVersion: "TLSv1.2" };

  const sql = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");

  console.log("🔧 Menjalankan schema.sql ...");
  const conn = await mysql.createConnection(config);
  await conn.query(sql);
  await conn.end();
  console.log("✅ Schema berhasil dijalankan!");
}

init().catch(err => {
  console.error("❌ db:init error:", err.message);
  process.exit(1);
});
