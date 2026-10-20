// =============================================================
// Cars Controller — get all (with filter), get by id, get by ids
// =============================================================

const prisma = require("../lib/prisma");

// Helper: konversi Decimal Prisma ke number biasa agar JSON bersih
function serializeCar(car) {
  return { ...car, price: Number(car.price) };
}

// =============================================================
// GET /api/cars — ambil semua mobil, support filter via query params
// Query params: brand, type, drivetrain, powertrain, transmission,
//               performance, price (format: "100000-250000" atau
//               "under-100k" | "100k-250k" | "250k-500k" |
//               "500k-1m" | "above-1m"), search
// =============================================================
async function getCars(req, res) {
  try {
    const { brand, type, drivetrain, powertrain, transmission, performance, price, search } = req.query;

    // Build Prisma where clause
    const where = {};

    if (brand) where.brand = brand;
    if (type) where.type = type;
    if (drivetrain) where.drivetrain = drivetrain;
    if (powertrain) where.powertrain = powertrain;
    if (transmission) where.transmission = transmission;
    if (performance) where.performance = performance;

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { brand: { contains: search, mode: "insensitive" } },
      ];
    }

    // Filter harga
    if (price && price !== "all") {
      const priceFilter = parsePriceFilter(price);
      if (priceFilter) where.price = priceFilter;
    }

    const cars = await prisma.car.findMany({ where, orderBy: { id: "asc" } });

    return res.json({
      status: "success",
      data: cars.map(serializeCar),
    });
  } catch (err) {
    console.error("getCars error:", err);
    return res.status(500).json({ status: "error", message: "Gagal mengambil data mobil." });
  }
}

// =============================================================
// GET /api/cars/:id — ambil satu mobil berdasarkan ID
// =============================================================
async function getCarById(req, res) {
  try {
    const id = parseInt(req.params.id);

    if (!id || id <= 0) {
      return res.status(400).json({ status: "error", message: "ID mobil tidak valid." });
    }

    const car = await prisma.car.findUnique({ where: { id } });

    if (!car) {
      return res.status(404).json({ status: "error", message: "Mobil tidak ditemukan." });
    }

    return res.json({ status: "success", data: serializeCar(car) });
  } catch (err) {
    console.error("getCarById error:", err);
    return res.status(500).json({ status: "error", message: "Gagal mengambil data mobil." });
  }
}

// =============================================================
// GET /api/cars/by-ids?ids=1,2 — ambil beberapa mobil sekaligus (untuk compare)
// =============================================================
async function getCarsByIds(req, res) {
  try {
    const idsParam = req.query.ids || "";
    const ids = [...new Set(
      idsParam.split(",").map(Number).filter(n => Number.isInteger(n) && n > 0)
    )].slice(0, 2); // max 2

    if (ids.length === 0) {
      return res.json({ status: "success", data: [] });
    }

    const cars = await prisma.car.findMany({ where: { id: { in: ids } } });

    return res.json({ status: "success", data: cars.map(serializeCar) });
  } catch (err) {
    console.error("getCarsByIds error:", err);
    return res.status(500).json({ status: "error", message: "Gagal mengambil data mobil." });
  }
}

// =============================================================
// Helper: parse price filter string → Prisma filter object
// =============================================================
function parsePriceFilter(priceStr) {
  switch (priceStr) {
    case "under-100k":  return { lt: 100000 };
    case "100k-250k":   return { gte: 100000, lte: 250000 };
    case "250k-500k":   return { gte: 250000, lte: 500000 };
    case "500k-1m":     return { gte: 500000, lte: 1000000 };
    case "above-1m":    return { gt: 1000000 };
    default:
      if (priceStr.includes("-")) {
        const [min, max] = priceStr.split("-").map(Number);
        if (!isNaN(min) && !isNaN(max)) return { gte: min, lte: max };
      }
      return null;
  }
}

// =============================================================
// Helper: ambil & validasi payload mobil dari body (admin)
// =============================================================
function buildCarData(body, { partial = false } = {}) {
  const data = {};
  const str = (v) => (typeof v === "string" ? v.trim() : v);

  if (body.name !== undefined) data.name = str(body.name);
  if (body.brand !== undefined) data.brand = str(body.brand);
  if (body.type !== undefined) data.type = str(body.type);
  if (body.image !== undefined) data.image = str(body.image);
  if (body.drivetrain !== undefined) data.drivetrain = str(body.drivetrain);
  if (body.powertrain !== undefined) data.powertrain = str(body.powertrain);
  if (body.transmission !== undefined) data.transmission = str(body.transmission);
  if (body.performance !== undefined) data.performance = str(body.performance);
  if (body.description !== undefined) data.description = str(body.description) || null;
  if (body.accel0100 !== undefined) data.accel0100 = str(body.accel0100) || null;

  if (body.price !== undefined) data.price = Number(body.price);
  if (body.horsepower !== undefined) data.horsepower = body.horsepower ? parseInt(body.horsepower) : null;
  if (body.torque !== undefined) data.torque = body.torque ? parseInt(body.torque) : null;
  if (body.topSpeed !== undefined) data.topSpeed = body.topSpeed ? parseInt(body.topSpeed) : null;
  if (body.year !== undefined) data.year = body.year ? parseInt(body.year) : 2024;

  if (body.status !== undefined) {
    const allowed = ["available", "reserved", "sold", "draft"];
    data.status = allowed.includes(body.status) ? body.status : "available";
  }
  return data;
}

// =============================================================
// POST /api/cars — tambah mobil (admin)
// =============================================================
async function createCar(req, res) {
  try {
    const data = buildCarData(req.body);
    const required = ["name", "brand", "type", "price", "image", "drivetrain", "powertrain", "transmission", "performance"];
    for (const f of required) {
      if (data[f] === undefined || data[f] === "" || (f === "price" && Number.isNaN(data.price))) {
        return res.status(400).json({ status: "error", message: `Field "${f}" wajib diisi.` });
      }
    }
    if (data.year === undefined) data.year = 2024;
    if (data.status === undefined) data.status = "available";

    const car = await prisma.car.create({ data });
    return res.status(201).json({ status: "success", message: "Mobil berhasil ditambahkan.", data: serializeCar(car) });
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

    const existing = await prisma.car.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return res.status(404).json({ status: "error", message: "Mobil tidak ditemukan." });

    const data = buildCarData(req.body, { partial: true });
    if (data.price !== undefined && Number.isNaN(data.price)) {
      return res.status(400).json({ status: "error", message: "Harga tidak valid." });
    }

    const car = await prisma.car.update({ where: { id }, data });
    return res.json({ status: "success", message: "Mobil berhasil diperbarui.", data: serializeCar(car) });
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

    const existing = await prisma.car.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return res.status(404).json({ status: "error", message: "Mobil tidak ditemukan." });

    await prisma.car.delete({ where: { id } });
    return res.json({ status: "success", message: "Mobil berhasil dihapus." });
  } catch (err) {
    console.error("deleteCar error:", err);
    return res.status(500).json({ status: "error", message: "Gagal menghapus mobil." });
  }
}

// =============================================================
// POST /api/cars/upload-image — unggah foto mobil (admin)
// Multer + Cloudinary dikonfigurasi di route.
// req.file.path = URL Cloudinary lengkap, req.file.filename = public_id
// =============================================================
async function uploadCarImage(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ status: "error", message: "Tidak ada file foto yang diunggah." });
    }
    // Cloudinary storage menyimpan URL publik di req.file.path
    const imageUrl = req.file.path;
    return res.json({ status: "success", message: "Foto berhasil diunggah.", image: imageUrl });
  } catch (err) {
    console.error("uploadCarImage error:", err);
    return res.status(500).json({ status: "error", message: "Gagal mengunggah foto." });
  }
}

module.exports = { getCars, getCarById, getCarsByIds, createCar, updateCar, deleteCar, uploadCarImage };
