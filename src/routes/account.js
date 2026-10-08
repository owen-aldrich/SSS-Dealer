// =============================================================
// Account Routes
// Base: /api/account
// Semua route wajib login
// =============================================================

const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { getProfile, updateProfile, uploadPhoto } = require("../controllers/accountController");
const { requireAuth } = require("../middleware/auth");

// =============================================================
// Konfigurasi Multer untuk upload foto profil
// =============================================================
const storage = multer.diskStorage({
  destination(req, file, cb) {
    const uploadDir = path.join(require("../config/paths").UPLOADS_DIR, "profile_photos");
    // Buat folder kalau belum ada
    const fs = require("fs");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `user_${req.user.id}_${Date.now()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Format foto harus JPG, PNG, atau WEBP."), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 3 * 1024 * 1024 }, // 3MB
});

// =============================================================
// Routes
// =============================================================

// GET  /api/account
router.get("/", requireAuth, getProfile);

// PUT  /api/account
router.put("/", requireAuth, updateProfile);

// POST /api/account/photo
router.post(
  "/photo",
  requireAuth,
  (req, res, next) => {
    upload.single("photo")(req, res, (err) => {
      if (err) {
        return res.status(400).json({ status: "error", message: err.message });
      }
      next();
    });
  },
  uploadPhoto
);

module.exports = router;
