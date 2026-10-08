// =============================================================
// Lead Routes — admin only
// Base: /api/leads
// =============================================================

const express = require("express");
const router = express.Router();
const { listLeads, createLead, updateLead, deleteLead } = require("../controllers/leadController");
const { requireAuth, requireAdmin } = require("../middleware/auth");

router.get("/", requireAuth, requireAdmin, listLeads);
router.post("/", requireAuth, requireAdmin, createLead);
router.put("/:id", requireAuth, requireAdmin, updateLead);
router.delete("/:id", requireAuth, requireAdmin, deleteLead);

module.exports = router;
