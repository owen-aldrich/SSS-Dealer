// =============================================================
// Favorites Controller — get, toggle, check
// =============================================================

const db = require("../lib/db");

// =============================================================
// GET /api/favorites
// =============================================================
async function getFavorites(req, res) {
  try {
    const userId = req.user.id;

    const [rows] = await db.query(
      `SELECT c.*, uf.created_at AS fav_created_at
         FROM user_favorites uf
         JOIN cars c ON c.id = uf.car_id
        WHERE uf.user_id = ?
        ORDER BY uf.created_at DESC`,
      [userId]
    );

    const cars = rows.map(r => {
      const { fav_created_at, ...car } = r;
      return { ...car, price: Number(car.price) };
    });

    return res.json({ status: "success", data: cars });
  } catch (err) {
    console.error("getFavorites error:", err);
    return res.status(500).json({ status: "error", message: "Gagal mengambil favorit." });
  }
}

// =============================================================
// POST /api/favorites/toggle
// Body: { car_id }
// =============================================================
async function toggleFavorite(req, res) {
  try {
    const userId = req.user.id;
    const carId  = parseInt(req.body.car_id);

    if (!carId || carId <= 0) {
      return res.status(400).json({ status: "error", message: "ID mobil tidak valid." });
    }

    // Cek mobil ada
    const [carRows] = await db.query("SELECT id FROM cars WHERE id = ? LIMIT 1", [carId]);
    if (carRows.length === 0) {
      return res.status(404).json({ status: "error", message: "Mobil tidak ditemukan." });
    }

    // Cek sudah difavoritkan?
    const [existing] = await db.query(
      "SELECT id FROM user_favorites WHERE user_id = ? AND car_id = ? LIMIT 1",
      [userId, carId]
    );

    if (existing.length > 0) {
      await db.query("DELETE FROM user_favorites WHERE user_id = ? AND car_id = ?", [userId, carId]);
      return res.json({ status: "success", favorited: false, message: "Dihapus dari favorit." });
    } else {
      await db.query("INSERT INTO user_favorites (user_id, car_id) VALUES (?, ?)", [userId, carId]);
      return res.json({ status: "success", favorited: true, message: "Ditambahkan ke favorit." });
    }
  } catch (err) {
    console.error("toggleFavorite error:", err);
    return res.status(500).json({ status: "error", message: "Gagal memperbarui favorit." });
  }
}

// =============================================================
// GET /api/favorites/check?car_id=1
// =============================================================
async function checkFavorite(req, res) {
  try {
    const userId = req.user.id;
    const carId  = parseInt(req.query.car_id);

    if (!carId || carId <= 0) {
      return res.json({ status: "success", logged_in: true, favorited: false });
    }

    const [rows] = await db.query(
      "SELECT id FROM user_favorites WHERE user_id = ? AND car_id = ? LIMIT 1",
      [userId, carId]
    );

    return res.json({ status: "success", logged_in: true, favorited: rows.length > 0 });
  } catch (err) {
    console.error("checkFavorite error:", err);
    return res.status(500).json({ status: "error", message: "Gagal memeriksa status favorit." });
  }
}

module.exports = { getFavorites, toggleFavorite, checkFavorite };
