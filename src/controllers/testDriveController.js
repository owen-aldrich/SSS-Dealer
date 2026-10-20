// =============================================================
// Test Drive Controller — book test drive
// =============================================================

const prisma = require("../lib/prisma");

// =============================================================
// POST /api/test-drive — booking test drive
// Bisa dilakukan tanpa login (user_id nullable)
// Body: { car_id, name, email, phone, preferred_date, preferred_time, message }
// =============================================================
async function bookTestDrive(req, res) {
  try {
    const { car_id, name, email, phone, preferred_date, preferred_time, message } = req.body;

    const carId = parseInt(car_id);

    // Validasi wajib
    if (!carId || carId <= 0 || !name || !email || !phone) {
      return res.status(400).json({ status: "error", message: "Nama, email, dan nomor telepon wajib diisi." });
    }

    // Validasi format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ status: "error", message: "Format email tidak valid." });
    }

    // Cek mobil ada
    const car = await prisma.car.findUnique({ where: { id: carId }, select: { id: true } });
    if (!car) {
      return res.status(404).json({ status: "error", message: "Mobil tidak ditemukan." });
    }

    // Cek bentrok jadwal: 1 mobil tidak boleh dipesan 2x di tanggal+jam sama.
    // Hanya hitung booking yang masih aktif (pending/approved); yang ditolak diabaikan.
    if (preferred_date && preferred_time) {
      const bentrok = await prisma.testDrive.findFirst({
        where: {
          carId,
          preferredDate: new Date(preferred_date),
          preferredTime: preferred_time,
          status: { in: ["pending", "approved"] },
        },
        select: { id: true },
      });
      if (bentrok) {
        return res.status(409).json({
          status: "error",
          message: "Maaf, slot waktu ini untuk mobil tersebut sudah dipesan. Silakan pilih tanggal atau jam lain.",
        });
      }
    }

    // user_id dari JWT kalau sudah login, null kalau tidak
    const userId = req.user ? req.user.id : null;

    await prisma.testDrive.create({
      data: {
        userId,
        carId,
        name,
        email,
        phone,
        preferredDate: preferred_date ? new Date(preferred_date) : null,
        preferredTime: preferred_time || null,
        message: message || null,
      },
    });

    return res.json({
      status: "success",
      message: "Booking test drive berhasil! Tim sales kami akan menghubungi Anda segera.",
    });
  } catch (err) {
    console.error("bookTestDrive error:", err);
    return res.status(500).json({ status: "error", message: "Gagal menyimpan booking." });
  }
}

// =============================================================
// GET /api/test-drive/me — riwayat test drive milik user login
// Butuh auth (requireAuth). Join data mobil untuk tampilan.
// =============================================================
async function myTestDrives(req, res) {
  try {
    const userId = req.user.id;

    const rows = await prisma.testDrive.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        car: { select: { id: true, name: true, brand: true, image: true } },
      },
    });

    const data = rows.map((td) => ({
      id: td.id,
      car_id: td.carId,
      car_name: td.car ? td.car.name : null,
      car_brand: td.car ? td.car.brand : null,
      car_image: td.car ? td.car.image : null,
      name: td.name,
      email: td.email,
      phone: td.phone,
      preferred_date: td.preferredDate,
      preferred_time: td.preferredTime,
      message: td.message,
      created_at: td.createdAt,
      // Schema belum punya kolom status; default statis sampai Phase admin.
      status: "Menunggu konfirmasi",
    }));

    return res.json({ status: "success", data });
  } catch (err) {
    console.error("myTestDrives error:", err);
    return res.status(500).json({ status: "error", message: "Gagal memuat riwayat test drive." });
  }
}

// =============================================================
// GET /api/test-drive — semua booking (admin). Join car.
// =============================================================
async function listTestDrives(req, res) {
  try {
    const rows = await prisma.testDrive.findMany({
      orderBy: { createdAt: "desc" },
      include: { car: { select: { id: true, name: true, brand: true, image: true } } },
    });

    const data = rows.map((td) => ({
      id: td.id,
      car_id: td.carId,
      car_name: td.car ? td.car.name : null,
      car_brand: td.car ? td.car.brand : null,
      name: td.name,
      email: td.email,
      phone: td.phone,
      preferred_date: td.preferredDate,
      preferred_time: td.preferredTime,
      message: td.message,
      status: td.status,
      created_at: td.createdAt,
    }));

    return res.json({ status: "success", data });
  } catch (err) {
    console.error("listTestDrives error:", err);
    return res.status(500).json({ status: "error", message: "Gagal memuat data test drive." });
  }
}

// =============================================================
// PATCH /api/test-drive/:id — update status / jadwal (admin)
// Body: { status?, preferred_date?, preferred_time? }
// =============================================================
async function updateTestDrive(req, res) {
  try {
    const id = parseInt(req.params.id);
    if (!id || id <= 0) return res.status(400).json({ status: "error", message: "ID tidak valid." });

    const existing = await prisma.testDrive.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return res.status(404).json({ status: "error", message: "Data test drive tidak ditemukan." });

    const { status, preferred_date, preferred_time } = req.body;
    const data = {};
    if (status !== undefined) {
      const allowed = ["pending", "approved", "rejected"];
      if (!allowed.includes(status)) {
        return res.status(400).json({ status: "error", message: "Status tidak valid." });
      }
      data.status = status;
    }
    if (preferred_date !== undefined) data.preferredDate = preferred_date ? new Date(preferred_date) : null;
    if (preferred_time !== undefined) data.preferredTime = preferred_time || null;

    const td = await prisma.testDrive.update({ where: { id }, data });
    return res.json({ status: "success", message: "Test drive diperbarui.", data: { id: td.id, status: td.status } });
  } catch (err) {
    console.error("updateTestDrive error:", err);
    return res.status(500).json({ status: "error", message: "Gagal memperbarui test drive." });
  }
}

// =============================================================
// GET /api/test-drive/booked-slots?car_id=X&date=YYYY-MM-DD
// Return daftar jam yang sudah terisi (pending/approved) untuk
// mobil + tanggal tertentu. Dipakai frontend untuk disable tombol slot.
// =============================================================
async function bookedSlots(req, res) {
  try {
    const carId = parseInt(req.query.car_id);
    const date  = req.query.date; // format: YYYY-MM-DD

    if (!carId || carId <= 0 || !date) {
      return res.json({ status: "success", booked: [] });
    }

    const rows = await prisma.testDrive.findMany({
      where: {
        carId,
        preferredDate: new Date(date),
        status: { in: ["pending", "approved"] },
        preferredTime: { not: null },
      },
      select: { preferredTime: true },
    });

    const booked = rows.map((r) => r.preferredTime);
    return res.json({ status: "success", booked });
  } catch (err) {
    console.error("bookedSlots error:", err);
    return res.status(500).json({ status: "error", booked: [] });
  }
}

module.exports = { bookTestDrive, myTestDrives, listTestDrives, updateTestDrive, bookedSlots };
