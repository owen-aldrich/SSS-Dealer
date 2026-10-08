// =============================================================
// Favorites Controller — get, toggle, check
// =============================================================

const prisma = require("../lib/prisma");

// =============================================================
// GET /api/favorites — ambil semua favorit milik user yang login
// =============================================================
async function getFavorites(req, res) {
  try {
    const userId = req.user.id;

    const favorites = await prisma.userFavorite.findMany({
      where: { userId },
      include: { car: true },
      orderBy: { createdAt: "desc" },
    });

    const cars = favorites.map(f => ({ ...f.car, price: Number(f.car.price) }));

    return res.json({ status: "success", data: cars });
  } catch (err) {
    console.error("getFavorites error:", err);
    return res.status(500).json({ status: "error", message: "Gagal mengambil favorit." });
  }
}

// =============================================================
// POST /api/favorites/toggle — tambah atau hapus favorit
// Body: { car_id: number }
// =============================================================
async function toggleFavorite(req, res) {
  try {
    const userId = req.user.id;
    const carId = parseInt(req.body.car_id);

    if (!carId || carId <= 0) {
      return res.status(400).json({ status: "error", message: "ID mobil tidak valid." });
    }

    // Cek apakah mobil ada
    const car = await prisma.car.findUnique({ where: { id: carId }, select: { id: true } });
    if (!car) {
      return res.status(404).json({ status: "error", message: "Mobil tidak ditemukan." });
    }

    // Cek apakah sudah difavoritkan
    const existing = await prisma.userFavorite.findUnique({
      where: { userId_carId: { userId, carId } },
    });

    if (existing) {
      // Sudah ada → hapus (unfavorite)
      await prisma.userFavorite.delete({
        where: { userId_carId: { userId, carId } },
      });
      return res.json({ status: "success", favorited: false, message: "Dihapus dari favorit." });
    } else {
      // Belum ada → tambah
      await prisma.userFavorite.create({ data: { userId, carId } });
      return res.json({ status: "success", favorited: true, message: "Ditambahkan ke favorit." });
    }
  } catch (err) {
    console.error("toggleFavorite error:", err);
    return res.status(500).json({ status: "error", message: "Gagal memperbarui favorit." });
  }
}

// =============================================================
// GET /api/favorites/check?car_id=1 — cek status favorit satu mobil
// =============================================================
async function checkFavorite(req, res) {
  try {
    const userId = req.user.id;
    const carId = parseInt(req.query.car_id);

    if (!carId || carId <= 0) {
      return res.json({ status: "success", logged_in: true, favorited: false });
    }

    const existing = await prisma.userFavorite.findUnique({
      where: { userId_carId: { userId, carId } },
      select: { id: true },
    });

    return res.json({ status: "success", logged_in: true, favorited: !!existing });
  } catch (err) {
    console.error("checkFavorite error:", err);
    return res.status(500).json({ status: "error", message: "Gagal memeriksa status favorit." });
  }
}

module.exports = { getFavorites, toggleFavorite, checkFavorite };
