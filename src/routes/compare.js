// =============================================================
// Compare Routes
// Base: /api/compare
// =============================================================

const express = require("express");
const router = express.Router();
const { addCompareHistory, getCompareHistory } = require("../controllers/compareController");
const { requireAuth, optionalAuth } = require("../middleware/auth");

// POST /api/compare — simpan riwayat (wajib login)
router.post("/", requireAuth, addCompareHistory);

// GET  /api/compare — ambil riwayat (wajib login)
router.get("/", requireAuth, getCompareHistory);

module.exports = router;
