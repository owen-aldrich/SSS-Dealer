// =============================================================
// Favorites Routes
// Base: /api/favorites
// Semua route butuh login
// =============================================================

const express = require("express");
const router = express.Router();
const { getFavorites, toggleFavorite, checkFavorite } = require("../controllers/favoritesController");
const { requireAuth, optionalAuth } = require("../middleware/auth");

// GET  /api/favorites — semua favorit user
router.get("/", requireAuth, getFavorites);

// GET  /api/favorites/check?car_id=1 — cek status favorit
router.get("/check", requireAuth, checkFavorite);

// POST /api/favorites/toggle — toggle favorit
router.post("/toggle", requireAuth, toggleFavorite);

module.exports = router;
