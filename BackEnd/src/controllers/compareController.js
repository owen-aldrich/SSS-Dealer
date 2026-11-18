// =============================================================
// Compare Controller — add history, get history
// =============================================================

const db = require("../lib/db");

// =============================================================
// POST /api/compare — simpan riwayat compare
// Body: { car_id_1, car_id_2 }
// =============================================================
async function addCompareHistory(req, res) {
  try {
    if (!req.user) {
      return res.json({ status: "success", saved: false, message: "Tidak login, riwayat tidak disimpan." });
    }

    const userId = req.user.id;
    const carId1 = parseInt(req.body.car_id_1);
    const carId2 = parseInt(req.body.car_id_2);

    if (!carId1 || !carId2 || carId1 <= 0 || carId2 <= 0 || carId1 === carId2) {
      return res.status(400).json({ status: "error", message: "Data mobil untuk compare tidak valid." });
    }

    await db.query(
      "INSERT INTO compare_history (user_id, car_id_1, car_id_2) VALUES (?, ?, ?)",
      [userId, carId1, carId2]
    );

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

    const [rows] = await db.query(
      `SELECT
         ch.id,
         ch.compared_at,
         c1.id    AS car1_id,
         c1.name  AS car1_name,
         c1.brand AS car1_brand,
         c2.id    AS car2_id,
         c2.name  AS car2_name,
         c2.brand AS car2_brand
       FROM compare_history ch
       JOIN cars c1 ON c1.id = ch.car_id_1
       JOIN cars c2 ON c2.id = ch.car_id_2
       WHERE ch.user_id = ?
       ORDER BY ch.compared_at DESC
       LIMIT 20`,
      [userId]
    );

    return res.json({ status: "success", data: rows });
  } catch (err) {
    console.error("getCompareHistory error:", err);
    return res.status(500).json({ status: "error", message: "Gagal mengambil riwayat compare." });
  }
}

module.exports = { addCompareHistory, getCompareHistory };
