const mysql = require("mysql2/promise");

const config = {
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "sss_dealer",
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_POOL_SIZE || 10),
  queueLimit: 0,
  connectTimeout: Number(process.env.DB_CONNECT_TIMEOUT_MS || 10000),
  timezone: "+00:00",
};

if (process.env.DB_SSL === "true") config.ssl = { minVersion: "TLSv1.2" };

// The backend owns one pool. Importing it does not connect to MySQL.
module.exports = mysql.createPool(config);
