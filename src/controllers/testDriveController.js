// =============================================================
// Test Drive Controller
// =============================================================

const db = require("../lib/db");

// =============================================================
// POST /api/test-drive — booking test drive
// =============================================================
async function bookTestDrive(req, res) {
  try {
    const { car_id, name, email, phone, preferred_date, preferred_time, message } = req.body;
    const carId = parseInt(car_id);

    if (!carId || carId <= 0 || !name || !email || !phone) {
      return res.status(400).json({ status: "error", message: "Nama, email, dan nomor telepon wajib diisi." });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ status: "error", message: "Format email tidak valid." });
    }

    const [carRows] = await db.query("SELECT id, status FROM cars WHERE id = ? LIMIT 1", [carId]);
    if (carRows.length === 0) {
      return res.status(404).json({ status: "error", message: "Mobil tidak ditemukan." });
    }
    if (carRows[0].status !== "available") {
      return res.status(400).json({ status: "error", message: "Mobil ini tidak tersedia untuk test drive." });
    }

    // Cek bentrok jadwal
    if (preferred_date && preferred_time) {
      const [bentrok] = await db.query(
        `SELECT id FROM test_drives
          WHERE car_id = ? AND preferred_date = ? AND preferred_time = ?
            AND status IN ('pending', 'approved')
          LIMIT 1`,
        [carId, preferred_date, preferred_time]
      );
      if (bentrok.length > 0) {
        return res.status(409).json({
          status: "error",
          message: "Maaf, slot waktu ini untuk mobil tersebut sudah dipesan. Silakan pilih tanggal atau jam lain.",
        });
      }
    }

    const userId = req.user ? req.user.id : null;

    await db.query(
      `INSERT INTO test_drives (user_id, car_id, name, email, phone, preferred_date, preferred_time, message)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, carId, name, email, phone, preferred_date || null, preferred_time || null, message || null]
    );

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
// =============================================================
async function myTestDrives(req, res) {
  try {
    const userId = req.user.id;

    const [rows] = await db.query(
      `SELECT td.*, c.name AS car_name, c.brand AS car_brand, c.image AS car_image
         FROM test_drives td
         LEFT JOIN cars c ON c.id = td.car_id
        WHERE td.user_id = ?
        ORDER BY td.created_at DESC`,
      [userId]
    );

    const data = rows.map(td => ({
      id:             td.id,
      car_id:         td.car_id,
      car_name:       td.car_name,
      car_brand:      td.car_brand,
      car_image:      td.car_image,
      name:           td.name,
      email:          td.email,
      phone:          td.phone,
      preferred_date: td.preferred_date,
      preferred_time: td.preferred_time,
      message:        td.message,
      created_at:     td.created_at,
      status:         td.status || "pending",
    }));

    return res.json({ status: "success", data });
  } catch (err) {
    console.error("myTestDrives error:", err);
    return res.status(500).json({ status: "error", message: "Gagal memuat riwayat test drive." });
  }
}

// =============================================================
// GET /api/test-drive — semua booking (admin)
// =============================================================
async function listTestDrives(req, res) {
  try {
    const [rows] = await db.query(
      `SELECT td.*, c.name AS car_name, c.brand AS car_brand, c.image AS car_image
         FROM test_drives td
         LEFT JOIN cars c ON c.id = td.car_id
        ORDER BY td.created_at DESC`
    );

    const data = rows.map(td => ({
      id:             td.id,
      car_id:         td.car_id,
      car_name:       td.car_name,
      car_brand:      td.car_brand,
      name:           td.name,
      email:          td.email,
      phone:          td.phone,
      preferred_date: td.preferred_date,
      preferred_time: td.preferred_time,
      message:        td.message,
      status:         td.status,
      created_at:     td.created_at,
    }));

    return res.json({ status: "success", data });
  } catch (err) {
    console.error("listTestDrives error:", err);
    return res.status(500).json({ status: "error", message: "Gagal memuat data test drive." });
  }
}

// =============================================================
// PATCH /api/test-drive/:id — update status (admin)
// =============================================================
async function updateTestDrive(req, res) {
  try {
    const id = parseInt(req.params.id);
    if (!id || id <= 0) return res.status(400).json({ status: "error", message: "ID tidak valid." });

    const [existing] = await db.query("SELECT id FROM test_drives WHERE id = ? LIMIT 1", [id]);
    if (existing.length === 0) return res.status(404).json({ status: "error", message: "Data test drive tidak ditemukan." });

    const { status, preferred_date, preferred_time } = req.body;
    const fields = [];
    const values = [];

    if (status !== undefined) {
      const allowed = ["pending", "approved", "rejected"];
      if (!allowed.includes(status)) {
        return res.status(400).json({ status: "error", message: "Status tidak valid." });
      }
      fields.push("status = ?");
      values.push(status);
    }
    if (preferred_date !== undefined) { fields.push("preferred_date = ?"); values.push(preferred_date || null); }
    if (preferred_time !== undefined) { fields.push("preferred_time = ?"); values.push(preferred_time || null); }

    if (fields.length === 0) {
      return res.status(400).json({ status: "error", message: "Tidak ada data yang diperbarui." });
    }

    values.push(id);
    await db.query(`UPDATE test_drives SET ${fields.join(", ")} WHERE id = ?`, values);

    const [rows] = await db.query("SELECT id, status FROM test_drives WHERE id = ? LIMIT 1", [id]);
    return res.json({ status: "success", message: "Test drive diperbarui.", data: rows[0] });
  } catch (err) {
    console.error("updateTestDrive error:", err);
    return res.status(500).json({ status: "error", message: "Gagal memperbarui test drive." });
  }
}

// =============================================================
// GET /api/test-drive/booked-slots?car_id=X&date=YYYY-MM-DD
// =============================================================
async function bookedSlots(req, res) {
  try {
    const carId = parseInt(req.query.car_id);
    const date  = req.query.date;

    if (!carId || carId <= 0 || !date) {
      return res.json({ status: "success", booked: [] });
    }

    const [rows] = await db.query(
      `SELECT preferred_time FROM test_drives
        WHERE car_id = ? AND preferred_date = ? AND status IN ('pending', 'approved')
          AND preferred_time IS NOT NULL`,
      [carId, date]
    );

    return res.json({ status: "success", booked: rows.map(r => r.preferred_time) });
  } catch (err) {
    console.error("bookedSlots error:", err);
    return res.status(500).json({ status: "error", booked: [] });
  }
}

module.exports = { bookTestDrive, myTestDrives, listTestDrives, updateTestDrive, bookedSlots };
