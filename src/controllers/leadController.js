// =============================================================
// Lead Controller — kelola lead (calon pembeli) — admin only
// =============================================================

const prisma = require("../lib/prisma");

const STATUSES = ["new", "contacted", "negotiation", "closing"];

function serializeLead(lead) {
  return {
    id: lead.id,
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    car_id: lead.carId,
    car_name: lead.car ? lead.car.name : null,
    car_brand: lead.car ? lead.car.brand : null,
    status: lead.status,
    consultant: lead.consultant,
    note: lead.note,
    created_at: lead.createdAt,
    updated_at: lead.updatedAt,
  };
}

// =============================================================
// GET /api/leads — semua lead + ringkasan per status
// =============================================================
async function listLeads(req, res) {
  try {
    const rows = await prisma.lead.findMany({
      orderBy: { updatedAt: "desc" },
      include: { car: { select: { id: true, name: true, brand: true } } },
    });

    const counts = { new: 0, contacted: 0, negotiation: 0, closing: 0 };
    rows.forEach((l) => { if (counts[l.status] !== undefined) counts[l.status]++; });

    return res.json({ status: "success", data: rows.map(serializeLead), counts });
  } catch (err) {
    console.error("listLeads error:", err);
    return res.status(500).json({ status: "error", message: "Gagal memuat data lead." });
  }
}

// =============================================================
// POST /api/leads — tambah lead (admin)
// =============================================================
async function createLead(req, res) {
  try {
    const { name, email, phone, car_id, status, consultant, note } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ status: "error", message: "Nama dan nomor HP wajib diisi." });
    }
    const lead = await prisma.lead.create({
      data: {
        name: name.trim(),
        email: email ? email.trim() : "",
        phone: phone ? phone.trim() : null,
        carId: car_id ? parseInt(car_id) : null,
        status: STATUSES.includes(status) ? status : "new",
        consultant: consultant || null,
        note: note || null,
      },
      include: { car: { select: { id: true, name: true, brand: true } } },
    });
    return res.status(201).json({ status: "success", message: "Lead ditambahkan.", data: serializeLead(lead) });
  } catch (err) {
    console.error("createLead error:", err);
    return res.status(500).json({ status: "error", message: "Gagal menambahkan lead." });
  }
}

// =============================================================
// PUT /api/leads/:id — ubah lead (admin)
// =============================================================
async function updateLead(req, res) {
  try {
    const id = parseInt(req.params.id);
    if (!id || id <= 0) return res.status(400).json({ status: "error", message: "ID tidak valid." });

    const existing = await prisma.lead.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return res.status(404).json({ status: "error", message: "Lead tidak ditemukan." });

    const { name, email, phone, car_id, status, consultant, note } = req.body;
    const data = {};
    if (name !== undefined) data.name = name.trim();
    if (email !== undefined) data.email = email ? email.trim() : "";
    if (phone !== undefined) data.phone = phone ? phone.trim() : null;
    if (car_id !== undefined) data.carId = car_id ? parseInt(car_id) : null;
    if (status !== undefined) {
      if (!STATUSES.includes(status)) return res.status(400).json({ status: "error", message: "Status tidak valid." });
      data.status = status;
    }
    if (consultant !== undefined) data.consultant = consultant || null;
    if (note !== undefined) data.note = note || null;

    const lead = await prisma.lead.update({
      where: { id },
      data,
      include: { car: { select: { id: true, name: true, brand: true } } },
    });
    return res.json({ status: "success", message: "Lead diperbarui.", data: serializeLead(lead) });
  } catch (err) {
    console.error("updateLead error:", err);
    return res.status(500).json({ status: "error", message: "Gagal memperbarui lead." });
  }
}

// =============================================================
// DELETE /api/leads/:id — hapus lead (admin)
// =============================================================
async function deleteLead(req, res) {
  try {
    const id = parseInt(req.params.id);
    if (!id || id <= 0) return res.status(400).json({ status: "error", message: "ID tidak valid." });

    const existing = await prisma.lead.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return res.status(404).json({ status: "error", message: "Lead tidak ditemukan." });

    await prisma.lead.delete({ where: { id } });
    return res.json({ status: "success", message: "Lead dihapus." });
  } catch (err) {
    console.error("deleteLead error:", err);
    return res.status(500).json({ status: "error", message: "Gagal menghapus lead." });
  }
}

module.exports = { listLeads, createLead, updateLead, deleteLead };
