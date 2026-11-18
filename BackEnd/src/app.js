require("./config/env").loadEnv();
const path = require("node:path");
const express = require("express");
const { createApp, databaseReadiness, finishApp } = require("./lib/http");
const db = require("./lib/db");

function createBackendApp() {
  const app = createApp("backend");
  databaseReadiness(app, db);
  app.use("/uploads", express.static(process.env.UPLOADS_DIR || path.resolve(__dirname, "../uploads")));
  app.use("/api/auth", require("./routes/auth"));
  app.use("/api/account", require("./routes/account"));
  app.use("/api/cars", require("./routes/cars"));
  app.use("/api/favorites", require("./routes/favorites"));
  app.use("/api/compare", require("./routes/compare"));
  app.use("/api/test-drive", require("./routes/testDrive"));
  app.use("/api/leads", require("./routes/leads"));
  return finishApp(app);
}

module.exports = { createBackendApp };
