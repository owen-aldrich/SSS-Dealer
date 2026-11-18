const http = require("node:http");
const https = require("node:https");

function endToEndHeaders(headers) {
  const filtered = { ...headers };
  const connectionHeaders = String(headers.connection || "").split(",").map(value => value.trim().toLowerCase());
  for (const name of ["connection", "keep-alive", "proxy-authenticate", "proxy-authorization", "te", "trailer", "transfer-encoding", "upgrade", ...connectionHeaders]) {
    delete filtered[name];
  }
  return filtered;
}

function createProxy(target, { timeout = Number(process.env.PROXY_TIMEOUT_MS || 30000) } = {}) {
  const upstream = new URL(target);
  if (!["http:", "https:"].includes(upstream.protocol) || upstream.pathname !== "/" || upstream.search || upstream.hash || upstream.username || upstream.password) {
    throw new Error("BACKEND_URL must be an HTTP(S) origin without a path or credentials.");
  }
  if (!Number.isFinite(timeout) || timeout <= 0) throw new Error("PROXY_TIMEOUT_MS must be positive.");
  const transport = upstream.protocol === "https:" ? https : http;

  // Stream API requests and uploads to the backend without changing their bodies.
  return (req, res) => {
    let timedOut = false;
    const headers = endToEndHeaders(req.headers);
    headers.host = upstream.host;
    const outgoing = transport.request({
      protocol: upstream.protocol,
      hostname: upstream.hostname,
      port: upstream.port,
      method: req.method,
      path: req.originalUrl,
      headers,
    }, incoming => {
      res.writeHead(incoming.statusCode, endToEndHeaders(incoming.headers));
      incoming.on("error", () => res.destroy());
      incoming.on("aborted", () => res.destroy());
      incoming.pipe(res);
    });

    outgoing.setTimeout(timeout, () => {
      timedOut = true;
      outgoing.destroy(new Error("Upstream timeout"));
    });
    outgoing.on("error", () => {
      if (res.destroyed) return;
      if (res.headersSent) return res.destroy();
      res.status(timedOut ? 504 : 502).json({
        status: "error",
        message: timedOut ? "Layanan tidak merespons tepat waktu." : "Layanan sementara tidak tersedia.",
      });
    });
    req.on("aborted", () => outgoing.destroy());
    req.on("error", () => outgoing.destroy());
    res.on("close", () => {
      if (!res.writableFinished) outgoing.destroy();
    });
    req.pipe(outgoing);
  };
}

module.exports = { createProxy };
