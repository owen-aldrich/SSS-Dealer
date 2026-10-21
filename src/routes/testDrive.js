// =============================================================
// Test Drive Routes
// Base: /api/test-drive
// =============================================================

const express = require("express");
const router = express.Router();
const { bookTestDrive, myTestDrives, listTestDrives, updateTestDrive, bookedSlots } = require("../controllers/testDriveController");
const { optionalAuth, requireAuth, requireAdmin } = require("../middleware/auth");

// GET /api/test-drive/booked-slots?car_id=X&date=YYYY-MM-DD — slot yang sudah terisi (publik)
router.get("/booked-slots", bookedSlots);

// GET /api/test-drive/me — riwayat test drive user login
router.get("/me", requireAuth, myTestDrives);

// GET /api/test-drive — semua booking (admin)
router.get("/", requireAuth, requireAdmin, listTestDrives);

// PATCH /api/test-drive/:id — update status/jadwal (admin)
router.patch("/:id", requireAuth, requireAdmin, updateTestDrive);

// POST /api/test-drive — booking (wajib login)
router.post("/", requireAuth, bookTestDrive);

module.exports = router;
