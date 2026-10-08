// =============================================================
// Compare Controller — add history, get history
// =============================================================

const prisma = require("../lib/prisma");

// =============================================================
// POST /api/compare — simpan riwayat compare (hanya kalau login)
// Body: { car_id_1, car_id_2 }
// =============================================================
async function addCompareHistory(req, res) {
  try {
    // Kalau tidak login, kembalikan sukses tapi tidak disimpan
    if (!req.user) {
      return res.json({ status: "success", saved: false, message: "Tidak login, riwayat tidak disimpan." });
    }

    const userId = req.user.id;
    const carId1 = parseInt(req.body.car_id_1);
    const carId2 = parseInt(req.body.car_id_2);

    if (!carId1 || !carId2 || carId1 <= 0 || carId2 <= 0 || carId1 === carId2) {
      return res.status(400).json({ status: "error", message: "Data mobil untuk compare tidak valid." });
    }

    await prisma.compareHistory.create({
      data: { userId, carId1, carId2 },
    });

    return res.json({ status: "success", saved: true });
  } catch (err) {
    console.error("addCompareHistory error:", err);
    return res.status(500).json({ status: "error", message: "Gagal menyimpan riwayat compare." });
  }
}

// =============================================================
// GET /api/compare — ambil riwayat compare milik user (max 20)
// =============================================================
async function getCompareHistory(req, res) {
  try {
    const userId = req.user.id;

    const history = await prisma.compareHistory.findMany({
      where: { userId },
      include: {
        car1: { select: { id: true, name: true, brand: true } },
        car2: { select: { id: true, name: true, brand: true } },
      },
      orderBy: { comparedAt: "desc" },
      take: 20,
    });

    // Format mirip PHP lama agar JS frontend tidak perlu diubah banyak
    const data = history.map(h => ({
      id: h.id,
      compared_at: h.comparedAt,
      car1_id: h.car1.id,
      car1_name: h.car1.name,
      car1_brand: h.car1.brand,
      car2_id: h.car2.id,
      car2_name: h.car2.name,
      car2_brand: h.car2.brand,
    }));

    return res.json({ status: "success", data });
  } catch (err) {
    console.error("getCompareHistory error:", err);
    return res.status(500).json({ status: "error", message: "Gagal mengambil riwayat compare." });
  }
}

module.exports = { addCompareHistory, getCompareHistory };
