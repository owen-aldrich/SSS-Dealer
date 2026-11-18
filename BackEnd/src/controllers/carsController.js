// =============================================================
// Cars Controller — get all (with filter), get by id, CRUD admin
// =============================================================

const db = require("../lib/db");

// Helper: pastikan price selalu number (bukan string dari MySQL DECIMAL)
function serializeCar(car) {
  return { ...car, price: Number(car.price) };
}

// =============================================================
// GET /api/cars — ambil semua mobil, support filter via query params
// =============================================================
async function getCars(req, res) {
  try {
    const { brand, type, drivetrain, powertrain, transmission, performance, price, search } = req.query;

    let sql    = "SELECT * FROM cars WHERE status IN ('available', 'reserved')";
    const params = [];

    if (brand)        { sql += " AND brand = ?";        params.push(brand); }
    if (type)         { sql += " AND type = ?";         params.push(type); }
    if (drivetrain)   { sql += " AND drivetrain = ?";   params.push(drivetrain); }
    if (powertrain)   { sql += " AND powertrain = ?";   params.push(powertrain); }
    if (transmission) { sql += " AND transmission = ?"; params.push(transmission); }
    if (performance)  { sql += " AND performance = ?";  params.push(performance); }

    if (search) {
      sql += " AND (name LIKE ? OR brand LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

    if (price && price !== "all") {
      const priceClause = buildPriceClause(price);
      if (priceClause) {
        sql += ` AND ${priceClause.sql}`;
        params.push(...priceClause.params);
      }
    }

    sql += " ORDER BY id ASC";

    const [rows] = await db.query(sql, params);
    return res.json({ status: "success", data: rows.map(serializeCar) });
  } catch (err) {
    console.error("getCars error:", err);
    return res.status(500).json({ status: "error", message: "Gagal mengambil data mobil." });
  }
}

// =============================================================
// GET /api/cars/:id
// =============================================================
async function getCarById(req, res) {
  try {
    const id = parseInt(req.params.id);
    if (!id || id <= 0) {
      return res.status(400).json({ status: "error", message: "ID mobil tidak valid." });
    }

    const [rows] = await db.query("SELECT * FROM cars WHERE id = ? LIMIT 1", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ status: "error", message: "Mobil tidak ditemukan." });
    }

    const car = rows[0];
    // Draft dan Sold tidak boleh sampai ke browser publik
    if (car.status === "draft" || car.status === "sold") {
      return res.status(404).json({ status: "error", message: "Mobil tidak ditemukan." });
    }

    return res.json({ status: "success", data: serializeCar(car) });
  } catch (err) {
    console.error("getCarById error:", err);
    return res.status(500).json({ status: "error", message: "Gagal mengambil data mobil." });
  }
}

// =============================================================
// GET /api/cars/by-ids?ids=1,2 — untuk compare
// =============================================================
async function getCarsByIds(req, res) {
  try {
    const idsParam = req.query.ids || "";
    const ids = [...new Set(
      idsParam.split(",").map(Number).filter(n => Number.isInteger(n) && n > 0)
    )].slice(0, 2);

    if (ids.length === 0) {
      return res.json({ status: "success", data: [] });
    }

    const placeholders = ids.map(() => "?").join(", ");
    const [rows] = await db.query(`SELECT * FROM cars WHERE id IN (${placeholders})`, ids);

    return res.json({ status: "success", data: rows.map(serializeCar) });
  } catch (err) {
    console.error("getCarsByIds error:", err);
    return res.status(500).json({ status: "error", message: "Gagal mengambil data mobil." });
  }
}

// =============================================================
// POST /api/cars — tambah mobil (admin)
// =============================================================
async function createCar(req, res) {
  try {
    const data = buildCarData(req.body);

    const required = ["name", "brand", "type", "price", "image", "drivetrain", "powertrain", "transmission", "performance"];
    for (const f of required) {
      if (data[f] === undefined || data[f] === "" || (f === "price" && isNaN(data.price))) {
        return res.status(400).json({ status: "error", message: `Field "${f}" wajib diisi.` });
      }
    }
    if (data.year === undefined)   data.year   = 2024;
    if (data.status === undefined) data.status = "available";

    const [result] = await db.query(
      `INSERT INTO cars (name, brand, type, price, image, drivetrain, powertrain, transmission,
        performance, horsepower, torque, top_speed, accel_0_100, description, year, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.name, data.brand, data.type, data.price, data.image,
        data.drivetrain, data.powertrain, data.transmission, data.performance,
        data.horsepower ?? null, data.torque ?? null, data.topSpeed ?? null,
        data.accel0100 ?? null, data.description ?? null,
        data.year, data.status,
      ]
    );

    const [rows] = await db.query("SELECT * FROM cars WHERE id = ? LIMIT 1", [result.insertId]);
    return res.status(201).json({ status: "success", message: "Mobil berhasil ditambahkan.", data: serializeCar(rows[0]) });
  } catch (err) {
    console.error("createCar error:", err);
    return res.status(500).json({ status: "error", message: "Gagal menambahkan mobil." });
  }
}

// =============================================================
// PUT /api/cars/:id — edit mobil (admin)
// =============================================================
async function updateCar(req, res) {
  try {
    const id = parseInt(req.params.id);
    if (!id || id <= 0) return res.status(400).json({ status: "error", message: "ID mobil tidak valid." });

    const [existing] = await db.query("SELECT id FROM cars WHERE id = ? LIMIT 1", [id]);
    if (existing.length === 0) return res.status(404).json({ status: "error", message: "Mobil tidak ditemukan." });

    const data = buildCarData(req.body, { partial: true });
    if (data.price !== undefined && isNaN(data.price)) {
      return res.status(400).json({ status: "error", message: "Harga tidak valid." });
    }
    if (Object.keys(data).length === 0) {
      return res.status(400).json({ status: "error", message: "Tidak ada data yang diperbarui." });
    }

    // Build SET clause dinamis
    const setClause = Object.keys(data).map(k => `${toColumn(k)} = ?`).join(", ");
    const values    = [...Object.values(data), id];

    await db.query(`UPDATE cars SET ${setClause} WHERE id = ?`, values);

    const [rows] = await db.query("SELECT * FROM cars WHERE id = ? LIMIT 1", [id]);
    return res.json({ status: "success", message: "Mobil berhasil diperbarui.", data: serializeCar(rows[0]) });
  } catch (err) {
    console.error("updateCar error:", err);
    return res.status(500).json({ status: "error", message: "Gagal memperbarui mobil." });
  }
}

// =============================================================
// DELETE /api/cars/:id — hapus mobil (admin)
// =============================================================
async function deleteCar(req, res) {
  try {
    const id = parseInt(req.params.id);
    if (!id || id <= 0) return res.status(400).json({ status: "error", message: "ID mobil tidak valid." });

    const [existing] = await db.query("SELECT id FROM cars WHERE id = ? LIMIT 1", [id]);
    if (existing.length === 0) return res.status(404).json({ status: "error", message: "Mobil tidak ditemukan." });

    await db.query("DELETE FROM cars WHERE id = ?", [id]);
    return res.json({ status: "success", message: "Mobil berhasil dihapus." });
  } catch (err) {
    console.error("deleteCar error:", err);
    return res.status(500).json({ status: "error", message: "Gagal menghapus mobil." });
  }
}

// =============================================================
// POST /api/cars/upload-image — unggah foto mobil (Cloudinary)
// =============================================================
async function uploadCarImage(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ status: "error", message: "Tidak ada file foto yang diunggah." });
    }
    return res.json({ status: "success", message: "Foto berhasil diunggah.", image: req.file.path });
  } catch (err) {
    console.error("uploadCarImage error:", err);
    return res.status(500).json({ status: "error", message: "Gagal mengunggah foto." });
  }
}

// =============================================================
// Helpers
// =============================================================

// Map camelCase field → kolom SQL
function toColumn(key) {
  const map = {
    topSpeed:     "top_speed",
    accel0100:    "accel_0_100",
    // sisanya sama persis
  };
  return map[key] || key;
}

function buildCarData(body, { partial = false } = {}) {
  const data = {};
  const str  = (v) => (typeof v === "string" ? v.trim() : v);

  if (body.name         !== undefined) data.name         = str(body.name);
  if (body.brand        !== undefined) data.brand        = str(body.brand);
  if (body.type         !== undefined) data.type         = str(body.type);
  if (body.image        !== undefined) data.image        = str(body.image);
  if (body.drivetrain   !== undefined) data.drivetrain   = str(body.drivetrain);
  if (body.powertrain   !== undefined) data.powertrain   = str(body.powertrain);
  if (body.transmission !== undefined) data.transmission = str(body.transmission);
  if (body.performance  !== undefined) data.performance  = str(body.performance);
  if (body.description  !== undefined) data.description  = str(body.description) || null;
  if (body.accel0100    !== undefined) data.accel0100    = str(body.accel0100)   || null;

  if (body.price      !== undefined) data.price      = Number(body.price);
  if (body.horsepower !== undefined) data.horsepower = body.horsepower ? parseInt(body.horsepower) : null;
  if (body.torque     !== undefined) data.torque     = body.torque     ? parseInt(body.torque)     : null;
  if (body.topSpeed   !== undefined) data.topSpeed   = body.topSpeed   ? parseInt(body.topSpeed)   : null;
  if (body.year       !== undefined) data.year       = body.year       ? parseInt(body.year)       : 2024;

  if (body.status !== undefined) {
    const allowed = ["available", "reserved", "sold", "draft"];
    data.status = allowed.includes(body.status) ? body.status : "available";
  }

  return data;
}

function buildPriceClause(priceStr) {
  switch (priceStr) {
    case "under-100k":  return { sql: "price < ?",             params: [100000] };
    case "100k-250k":   return { sql: "price >= ? AND price <= ?", params: [100000, 250000] };
    case "250k-500k":   return { sql: "price >= ? AND price <= ?", params: [250000, 500000] };
    case "500k-1m":     return { sql: "price >= ? AND price <= ?", params: [500000, 1000000] };
    case "above-1m":    return { sql: "price > ?",             params: [1000000] };
    default:
      if (priceStr.includes("-")) {
        const [min, max] = priceStr.split("-").map(Number);
        if (!isNaN(min) && !isNaN(max)) return { sql: "price >= ? AND price <= ?", params: [min, max] };
      }
      return null;
  }
}

module.exports = { getCars, getCarById, getCarsByIds, createCar, updateCar, deleteCar, uploadCarImage };
