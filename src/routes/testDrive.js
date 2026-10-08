// =============================================================
// Test Drive Routes
// Base: /api/test-drive
// =============================================================

const express = require("express");
const router = express.Router();
const { bookTestDrive, myTestDrives, listTestDrives, updateTestDrive } = require("../controllers/testDriveController");
const { optionalAuth, requireAuth, requireAdmin } = require("../middleware/auth");

// GET /api/test-drive/me — riwayat test drive user login
router.get("/me", requireAuth, myTestDrives);

// GET /api/test-drive — semua booking (admin)
router.get("/", requireAuth, requireAdmin, listTestDrives);

// PATCH /api/test-drive/:id — update status/jadwal (admin)
router.patch("/:id", requireAuth, requireAdmin, updateTestDrive);

// POST /api/test-drive — booking (login opsional)
router.post("/", optionalAuth, bookTestDrive);

module.exports = router;
