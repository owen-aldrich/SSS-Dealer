// =============================================================
// Account Controller — get profile, update profile, upload photo
// =============================================================

const bcrypt = require("bcryptjs");
const path = require("path");
const fs = require("fs");
const prisma = require("../lib/prisma");

// Helper: buang password dari response
function safeUser(user) {
  const { password, ...rest } = user;
  return rest;
}

// =============================================================
// GET /api/account — ambil profil user yang sedang login
// =============================================================
async function getProfile(req, res) {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    if (!user) {
      return res.status(404).json({ status: "error", message: "User tidak ditemukan." });
    }

    return res.json({ status: "success", user: safeUser(user) });
  } catch (err) {
    console.error("getProfile error:", err);
    return res.status(500).json({ status: "error", message: "Gagal mengambil profil." });
  }
}

// =============================================================
// PUT /api/account — update profil (nama, username, usia, alamat, password)
// =============================================================
async function updateProfile(req, res) {
  try {
    const userId = req.user.id;
    const { fullname, username, age, address, current_password, new_password } = req.body;

    if (!fullname || !username) {
      return res.status(400).json({ status: "error", message: "Nama lengkap dan username wajib diisi." });
    }

    // Cek username tidak dipakai user lain
    const conflict = await prisma.user.findFirst({
      where: { username, NOT: { id: userId } },
      select: { id: true },
    });

    if (conflict) {
      return res.status(409).json({ status: "error", message: "Username sudah dipakai user lain." });
    }

    const updateData = {
      fullname,
      username,
      age: age ? parseInt(age) : null,
      address: address || null,
    };

    // Kalau user mau ganti password
    if (new_password) {
      if (new_password.length < 6) {
        return res.status(400).json({ status: "error", message: "Password baru minimal 6 karakter." });
      }

      // Verifikasi password lama
      const currentUser = await prisma.user.findUnique({ where: { id: userId }, select: { password: true } });
      const isMatch = await bcrypt.compare(current_password || "", currentUser.password);

      if (!isMatch) {
        return res.status(401).json({ status: "error", message: "Password saat ini salah." });
      }

      updateData.password = await bcrypt.hash(new_password, 12);
    }

    await prisma.user.update({ where: { id: userId }, data: updateData });

    return res.json({ status: "success", message: "Profil berhasil diperbarui." });
  } catch (err) {
    console.error("updateProfile error:", err);
    return res.status(500).json({ status: "error", message: "Gagal memperbarui profil." });
  }
}

// =============================================================
// POST /api/account/photo — upload foto profil
// Menggunakan multer (dikonfigurasi di route)
// =============================================================
async function uploadPhoto(req, res) {
  try {
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ status: "error", message: "Tidak ada file foto yang diupload." });
    }

    // Path relatif yang disimpan di DB (dari root project)
    const relativePath = "uploads/profile_photos/" + req.file.filename;

    // Hapus foto lama kalau ada
    const currentUser = await prisma.user.findUnique({ where: { id: userId }, select: { photo: true } });
    if (currentUser?.photo) {
      const oldPath = path.join(require("../config/paths").ROOT_DIR, currentUser.photo);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    // Simpan path baru ke DB
    await prisma.user.update({ where: { id: userId }, data: { photo: relativePath } });

    return res.json({
      status: "success",
      message: "Foto profil berhasil diperbarui.",
      photo: relativePath,
    });
  } catch (err) {
    console.error("uploadPhoto error:", err);
    return res.status(500).json({ status: "error", message: "Gagal mengupload foto." });
  }
}

module.exports = { getProfile, updateProfile, uploadPhoto };
