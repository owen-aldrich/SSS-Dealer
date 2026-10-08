// =============================================================
// Auth Controller — signup, signin, logout, me, checkIdentifier
// =============================================================

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../lib/prisma");

// Helper: buat JWT token
function signToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

// Helper: format user untuk response (buang password)
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

    // Validasi wajib
    if (!fullname || !email || !username || !password) {
      return res.status(400).json({ status: "error", message: "Nama lengkap, email, username, dan password wajib diisi." });
    }

    // Validasi format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ status: "error", message: "Format email tidak valid." });
    }

    // Validasi panjang password
    if (password.length < 6) {
      return res.status(400).json({ status: "error", message: "Password minimal 6 karakter." });
    }

    // Validasi konfirmasi password
    if (confirm_password && password !== confirm_password) {
      return res.status(400).json({ status: "error", message: "Konfirmasi password tidak cocok." });
    }

    // Cek duplikat email atau username
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });

    if (existing) {
      return res.status(409).json({ status: "error", message: "Email atau username sudah terdaftar." });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Buat user baru
    const user = await prisma.user.create({
      data: {
        fullname,
        email,
        username,
        password: hashedPassword,
        age: age ? parseInt(age) : null,
        address: address || null,
        role: "user",
      },
    });

    return res.status(201).json({
      status: "success",
      message: "Pendaftaran berhasil! Silakan login.",
    });
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

    // Cari user berdasarkan email ATAU username
    const user = await prisma.user.findFirst({
      where: { OR: [{ email: identifier }, { username: identifier }] },
    });

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
// (JWT stateless — client harus hapus token sendiri)
// =============================================================
function logout(req, res) {
  return res.json({ status: "success", message: "Logout berhasil." });
}

// =============================================================
// GET /api/auth/me — cek session (verifikasi token + ambil data user terbaru)
// =============================================================
async function me(req, res) {
  try {
    // req.user sudah diisi oleh requireAuth middleware
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      return res.status(401).json({ status: "success", logged_in: false });
    }

    return res.json({
      status: "success",
      logged_in: true,
      user: safeUser(user),
    });
  } catch (err) {
    console.error("me error:", err);
    return res.status(500).json({ status: "error", message: "Gagal mengambil data user." });
  }
}

// =============================================================
// POST /api/auth/check-identifier — cek apakah email/username sudah ada
// =============================================================
async function checkIdentifier(req, res) {
  try {
    const { identifier } = req.body;

    if (!identifier) {
      return res.status(400).json({ status: "error", exists: false, message: "Username atau email wajib diisi." });
    }

    const user = await prisma.user.findFirst({
      where: { OR: [{ email: identifier }, { username: identifier }] },
      select: { id: true },
    });

    return res.json({ exists: !!user });
  } catch (err) {
    console.error("checkIdentifier error:", err);
    return res.status(500).json({ status: "error", message: "Gagal memeriksa identifier." });
  }
}

module.exports = { signup, signin, logout, me, checkIdentifier };
