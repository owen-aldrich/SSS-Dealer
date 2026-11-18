// Middleware: verifikasi JWT dari Authorization header atau cookie
const jwt = require("jsonwebtoken");

/**
 * Wajib login — tolak request jika token tidak ada / tidak valid
 */
function requireAuth(req, res, next) {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({ status: "error", message: "Akses ditolak. Silakan login terlebih dahulu." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, username, role, iat, exp }
    next();
  } catch {
    return res.status(401).json({ status: "error", message: "Token tidak valid atau sudah kedaluwarsa." });
  }
}

/**
 * Wajib admin — jalankan setelah requireAuth.
 * Tolak jika role bukan "admin".
 */
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ status: "error", message: "Akses khusus admin." });
  }
  next();
}

/**
 * Opsional login — request tetap lanjut meski tidak login,
 * tapi req.user akan diisi jika token valid.
 */
function optionalAuth(req, res, next) {
  const token = extractToken(req);

  if (token) {
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      // Token invalid diabaikan saja
      req.user = null;
    }
  } else {
    req.user = null;
  }

  next();
}

/**
 * Ambil token dari header Authorization: Bearer <token>
 */
function extractToken(req) {
  const authHeader = req.headers["authorization"];
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  return null;
}

module.exports = { requireAuth, requireAdmin, optionalAuth };
