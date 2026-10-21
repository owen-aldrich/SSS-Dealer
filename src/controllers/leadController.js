// =============================================================
// Lead Controller — admin only
// =============================================================

const db = require("../lib/db");

const STATUSES = ["new", "contacted", "negotiation", "closing"];

function serializeLead(lead) {
  return {
    id:         lead.id,
    name:       lead.name,
    email:      lead.email,
    phone:      lead.phone,
    car_id:     lead.car_id,
    car_name:   lead.car_name  || null,
    car_brand:  lead.car_brand || null,
    status:     lead.status,
    consultant: lead.consultant,
    note:       lead.note,
    created_at: lead.created_at,
    updated_at: lead.updated_at,
  };
}

// =============================================================
// GET /api/leads
// =============================================================
async function listLeads(req, res) {
  try {
    const [rows] = await db.query(
      `SELECT l.*, c.name AS car_name, c.brand AS car_brand
         FROM leads l
         LEFT JOIN cars c ON c.id = l.car_id
        ORDER BY l.updated_at DESC`
    );

    const counts = { new: 0, contacted: 0, negotiation: 0, closing: 0 };
    rows.forEach(l => { if (counts[l.status] !== undefined) counts[l.status]++; });

    return res.json({ status: "success", data: rows.map(serializeLead), counts });
  } catch (err) {
    console.error("listLeads error:", err);
    return res.status(500).json({ status: "error", message: "Gagal memuat data lead." });
  }
}

// =============================================================
// POST /api/leads
// =============================================================
async function createLead(req, res) {
  try {
    const { name, email, phone, car_id, status, consultant, note } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ status: "error", message: "Nama dan nomor HP wajib diisi." });
    }

    const leadStatus = STATUSES.includes(status) ? status : "new";
    const carId      = car_id ? parseInt(car_id) : null;

    const [result] = await db.query(
      `INSERT INTO leads (name, email, phone, car_id, status, consultant, note)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name.trim(), email ? email.trim() : "", phone ? phone.trim() : null, carId, leadStatus, consultant || null, note || null]
    );

    const [rows] = await db.query(
      `SELECT l.*, c.name AS car_name, c.brand AS car_brand
         FROM leads l LEFT JOIN cars c ON c.id = l.car_id
        WHERE l.id = ? LIMIT 1`,
      [result.insertId]
    );

    return res.status(201).json({ status: "success", message: "Lead ditambahkan.", data: serializeLead(rows[0]) });
  } catch (err) {
    console.error("createLead error:", err);
    return res.status(500).json({ status: "error", message: "Gagal menambahkan lead." });
  }
}

// =============================================================
// PUT /api/leads/:id
// =============================================================
async function updateLead(req, res) {
  try {
    const id = parseInt(req.params.id);
    if (!id || id <= 0) return res.status(400).json({ status: "error", message: "ID tidak valid." });

    const [existing] = await db.query("SELECT id FROM leads WHERE id = ? LIMIT 1", [id]);
    if (existing.length === 0) return res.status(404).json({ status: "error", message: "Lead tidak ditemukan." });

    const { name, email, phone, car_id, status, consultant, note } = req.body;
    const fields = [];
    const values = [];

    if (name       !== undefined) { fields.push("name = ?");       values.push(name.trim()); }
    if (email      !== undefined) { fields.push("email = ?");      values.push(email ? email.trim() : ""); }
    if (phone      !== undefined) { fields.push("phone = ?");      values.push(phone ? phone.trim() : null); }
    if (car_id     !== undefined) { fields.push("car_id = ?");     values.push(car_id ? parseInt(car_id) : null); }
    if (consultant !== undefined) { fields.push("consultant = ?"); values.push(consultant || null); }
    if (note       !== undefined) { fields.push("note = ?");       values.push(note || null); }
    if (status !== undefined) {
      if (!STATUSES.includes(status)) return res.status(400).json({ status: "error", message: "Status tidak valid." });
      fields.push("status = ?");
      values.push(status);
    }

    if (fields.length === 0) return res.status(400).json({ status: "error", message: "Tidak ada data yang diperbarui." });

    values.push(id);
    await db.query(`UPDATE leads SET ${fields.join(", ")} WHERE id = ?`, values);

    const [rows] = await db.query(
      `SELECT l.*, c.name AS car_name, c.brand AS car_brand
         FROM leads l LEFT JOIN cars c ON c.id = l.car_id
        WHERE l.id = ? LIMIT 1`,
      [id]
    );

    return res.json({ status: "success", message: "Lead diperbarui.", data: serializeLead(rows[0]) });
  } catch (err) {
    console.error("updateLead error:", err);
    return res.status(500).json({ status: "error", message: "Gagal memperbarui lead." });
  }
}

// =============================================================
// DELETE /api/leads/:id
// =============================================================
async function deleteLead(req, res) {
  try {
    const id = parseInt(req.params.id);
    if (!id || id <= 0) return res.status(400).json({ status: "error", message: "ID tidak valid." });

    const [existing] = await db.query("SELECT id FROM leads WHERE id = ? LIMIT 1", [id]);
    if (existing.length === 0) return res.status(404).json({ status: "error", message: "Lead tidak ditemukan." });

    await db.query("DELETE FROM leads WHERE id = ?", [id]);
    return res.json({ status: "success", message: "Lead dihapus." });
  } catch (err) {
    console.error("deleteLead error:", err);
    return res.status(500).json({ status: "error", message: "Gagal menghapus lead." });
  }
}

module.exports = { listLeads, createLead, updateLead, deleteLead };
