const path = require("node:path");

const ROOT_DIR = path.resolve(__dirname, "../../..");

function loadEnv() {
  require("dotenv").config({ path: process.env.ENV_FILE || path.join(ROOT_DIR, ".env") });
}

function getPort(name, fallback) {
  const value = process.env[`${name}_PORT`] || (name === "FRONTEND" && process.env.PORT) || fallback;
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`${name}_PORT must be an integer between 1 and 65535.`);
  }
  return port;
}

function requireJwtSecret() {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is required for the backend.");
}

module.exports = { ROOT_DIR, loadEnv, getPort, requireJwtSecret };
