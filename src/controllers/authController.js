// =============================================================
// Auth Controller — signup, signin, logout, me, checkIdentifier
// =============================================================

const bcrypt = require("bcryptjs");
const jwt    = require("jsonwebtoken");
const db     = require("../lib/db");

// Helper: buat JWT token
function signToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

// Helper: buang password dari response
function safeUser(user) {
  const { password, ...rest } = user;
  return rest;
}

// =============================================================
// POST /api/auth/signup
// =============================================================
async function signup(req, res) {
  try {
    const { fullname, email, username, password, confirm_password, age, address } = req.body;

    if (!fullname || !email || !username || !password) {
      return res.status(400).json({ status: "error", message: "Nama lengkap, email, username, dan password wajib diisi." });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ status: "error", message: "Format email tidak valid." });
    }

    if (password.length < 6) {
      return res.status(400).json({ status: "error", message: "Password minimal 6 karakter." });
    }

    if (confirm_password && password !== confirm_password) {
      return res.status(400).json({ status: "error", message: "Konfirmasi password tidak cocok." });
    }

    // Cek duplikat email atau username
    const [rows] = await db.query(
      "SELECT id FROM users WHERE email = ? OR username = ? LIMIT 1",
      [email, username]
    );
    if (rows.length > 0) {
      return res.status(409).json({ status: "error", message: "Email atau username sudah terdaftar." });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await db.query(
      "INSERT INTO users (fullname, email, username, password, age, address, role) VALUES (?, ?, ?, ?, ?, ?, 'user')",
      [fullname, email, username, hashedPassword, age ? parseInt(age) : null, address || null]
    );

    return res.status(201).json({ status: "success", message: "Pendaftaran berhasil! Silakan login." });
  } catch (err) {
    console.error("signup error:", err);
    return res.status(500).json({ status: "error", message: "Gagal mendaftar. Coba lagi." });
  }
}

// =============================================================
// POST /api/auth/signin
// =============================================================
async function signin(req, res) {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ status: "error", message: "Email/username dan password wajib diisi." });
    }

    const [rows] = await db.query(
      "SELECT * FROM users WHERE email = ? OR username = ? LIMIT 1",
      [identifier, identifier]
    );

    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ status: "error", message: "Email/username atau password salah." });
    }

    const token = signToken(user);

    return res.json({
      status: "success",
      message: "Login berhasil!",
      token,
      user: safeUser(user),
    });
  } catch (err) {
    console.error("signin error:", err);
    return res.status(500).json({ status: "error", message: "Gagal login. Coba lagi." });
  }
}

// =============================================================
// POST /api/auth/logout
// =============================================================
function logout(req, res) {
  return res.json({ status: "success", message: "Logout berhasil." });
}

// =============================================================
// GET /api/auth/me
// =============================================================
async function me(req, res) {
  try {
    const [rows] = await db.query("SELECT * FROM users WHERE id = ? LIMIT 1", [req.user.id]);
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ status: "success", logged_in: false });
    }

    return res.json({ status: "success", logged_in: true, user: safeUser(user) });
  } catch (err) {
    console.error("me error:", err);
    return res.status(500).json({ status: "error", message: "Gagal mengambil data user." });
  }
}

// =============================================================
// POST /api/auth/check-identifier
// =============================================================
async function checkIdentifier(req, res) {
  try {
    const { identifier } = req.body;

    if (!identifier) {
      return res.status(400).json({ status: "error", exists: false, message: "Username atau email wajib diisi." });
    }

    const [rows] = await db.query(
      "SELECT id FROM users WHERE email = ? OR username = ? LIMIT 1",
      [identifier, identifier]
    );

    return res.json({ exists: rows.length > 0 });
  } catch (err) {
    console.error("checkIdentifier error:", err);
    return res.status(500).json({ status: "error", message: "Gagal memeriksa identifier." });
  }
}

module.exports = { signup, signin, logout, me, checkIdentifier };
