const { createBackendApp } = require("./app");
const { getPort, requireJwtSecret } = require("./config/env");
const { startServer } = require("./lib/runtime");
const db = require("./lib/db");

requireJwtSecret();
startServer(createBackendApp(), { name: "backend", port: getPort("BACKEND", 3001), close: [() => db.end()] });
