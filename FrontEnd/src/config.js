const path = require("node:path");

function loadEnv() {
  require("dotenv").config({ path: process.env.ENV_FILE || path.resolve(__dirname, "../../.env") });
}

function getPort(name, fallback) {
  const value = process.env[`${name}_PORT`] || (name === "FRONTEND" && process.env.PORT) || fallback;
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`${name}_PORT must be an integer between 1 and 65535.`);
  }
  return port;
}

function getBackendUrl() {
  return process.env.BACKEND_URL || `http://127.0.0.1:${getPort("BACKEND", 3001)}`;
}

module.exports = { loadEnv, getPort, getBackendUrl };
