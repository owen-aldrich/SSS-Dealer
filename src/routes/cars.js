// =============================================================
// Cars Routes
// Base: /api/cars
// =============================================================

const express = require("express");
const router = express.Router();
const multer = require("multer");
const { carStorage } = require("../config/cloudinary");
const {
  getCars, getCarById, getCarsByIds,
  createCar, updateCar, deleteCar, uploadCarImage,
} = require("../controllers/carsController");
const { requireAuth, requireAdmin } = require("../middleware/auth");

// =============================================================
// Konfigurasi Multer untuk upload foto mobil (Cloudinary)
// =============================================================
const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Format foto harus JPG, PNG, atau WEBP."), false);
};

const uploadCar = multer({
  storage: carStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// GET /api/cars/by-ids?ids=1,2  — HARUS sebelum /:id agar tidak tertangkap sebagai id
router.get("/by-ids", getCarsByIds);

// GET /api/cars
router.get("/", getCars);

// GET /api/cars/:id
router.get("/:id", getCarById);

// --- Admin: upload foto mobil (sebelum /:id POST agar jelas) ---
router.post(
  "/upload-image",
  requireAuth,
  requireAdmin,
  (req, res, next) => {
    uploadCar.single("image")(req, res, (err) => {
      if (err) return res.status(400).json({ status: "error", message: err.message });
      next();
    });
  },
  uploadCarImage
);

// --- Admin CRUD (butuh login + role admin) ---
router.post("/", requireAuth, requireAdmin, createCar);
router.put("/:id", requireAuth, requireAdmin, updateCar);
router.delete("/:id", requireAuth, requireAdmin, deleteCar);

module.exports = router;
