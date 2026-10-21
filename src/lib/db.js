// =============================================================
// MySQL Connection Pool — mysql2/promise
// Support TiDB Cloud Serverless (SSL TLSv1.2) & MySQL lokal
// =============================================================

const mysql = require("mysql2/promise");

const poolConfig = {
  host:     process.env.DB_HOST     || "127.0.0.1",
  port:     parseInt(process.env.DB_PORT || "3306"),
  user:     process.env.DB_USER     || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME     || "sss_dealer",
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  timezone: "+00:00",
};

// TiDB Cloud Serverless wajib SSL TLSv1.2 (tanpa file CA karena pakai trusted public cert)
if (process.env.DB_SSL === "true") {
  poolConfig.ssl = { minVersion: "TLSv1.2" };
}

const pool = mysql.createPool(poolConfig);

// Uji koneksi saat server start
pool.getConnection()
  .then((conn) => {
    console.log("✅ MySQL connected successfully.");
    conn.release();
  })
  .catch((err) => {
    console.error("❌ MySQL connection failed:", err.message);
  });

module.exports = pool;
