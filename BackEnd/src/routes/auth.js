// =============================================================
// Auth Routes
// Base: /api/auth
// =============================================================

const express = require("express");
const router = express.Router();

const { signup, signin, logout, me, checkIdentifier } = require("../controllers/authController");
const { requireAuth } = require("../middleware/auth");

// POST /api/auth/signup
router.post("/signup", signup);

// POST /api/auth/signin
router.post("/signin", signin);

// POST /api/auth/logout
router.post("/logout", requireAuth, logout);

// GET  /api/auth/me — verifikasi token & ambil data user (pengganti check_session.php)
router.get("/me", requireAuth, me);

// POST /api/auth/check-identifier — cek duplikat email/username (pengganti check_identifier.php)
router.post("/check-identifier", checkIdentifier);

module.exports = router;
