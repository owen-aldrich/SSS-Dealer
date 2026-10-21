// =============================================================
// Account Controller — get profile, update profile, upload photo
// =============================================================

const bcrypt     = require("bcryptjs");
const db         = require("../lib/db");
const { cloudinary } = require("../config/cloudinary");

function safeUser(user) {
  const { password, ...rest } = user;
  return rest;
}

// =============================================================
// GET /api/account
// =============================================================
async function getProfile(req, res) {
  try {
    const [rows] = await db.query("SELECT * FROM users WHERE id = ? LIMIT 1", [req.user.id]);
    if (rows.length === 0) {
      return res.status(404).json({ status: "error", message: "User tidak ditemukan." });
    }
    return res.json({ status: "success", user: safeUser(rows[0]) });
  } catch (err) {
    console.error("getProfile error:", err);
    return res.status(500).json({ status: "error", message: "Gagal mengambil profil." });
  }
}

// =============================================================
// PUT /api/account
// =============================================================
async function updateProfile(req, res) {
  try {
    const userId = req.user.id;
    const { fullname, username, age, address, current_password, new_password } = req.body;

    if (!fullname || !username) {
      return res.status(400).json({ status: "error", message: "Nama lengkap dan username wajib diisi." });
    }

    // Cek username tidak dipakai user lain
    const [conflict] = await db.query(
      "SELECT id FROM users WHERE username = ? AND id != ? LIMIT 1",
      [username, userId]
    );
    if (conflict.length > 0) {
      return res.status(409).json({ status: "error", message: "Username sudah dipakai user lain." });
    }

    const updateFields = { fullname, username, age: age ? parseInt(age) : null, address: address || null };

    if (new_password) {
      if (new_password.length < 6) {
        return res.status(400).json({ status: "error", message: "Password baru minimal 6 karakter." });
      }

      const [userRows] = await db.query("SELECT password FROM users WHERE id = ? LIMIT 1", [userId]);
      const isMatch = await bcrypt.compare(current_password || "", userRows[0].password);
      if (!isMatch) {
        return res.status(401).json({ status: "error", message: "Password saat ini salah." });
      }

      updateFields.password = await bcrypt.hash(new_password, 12);
    }

    const setClause = Object.keys(updateFields).map(k => `${k} = ?`).join(", ");
    await db.query(`UPDATE users SET ${setClause} WHERE id = ?`, [...Object.values(updateFields), userId]);

    return res.json({ status: "success", message: "Profil berhasil diperbarui." });
  } catch (err) {
    console.error("updateProfile error:", err);
    return res.status(500).json({ status: "error", message: "Gagal memperbarui profil." });
  }
}

// =============================================================
// POST /api/account/photo
// =============================================================
async function uploadPhoto(req, res) {
  try {
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ status: "error", message: "Tidak ada file foto yang diupload." });
    }

    const photoUrl = req.file.path;

    // Hapus foto lama dari Cloudinary
    const [rows] = await db.query("SELECT photo FROM users WHERE id = ? LIMIT 1", [userId]);
    const oldPhoto = rows[0]?.photo;
    if (oldPhoto && oldPhoto.includes("cloudinary.com")) {
      const matches = oldPhoto.match(/sss-dealer\/profiles\/[^.]+/);
      if (matches) await cloudinary.uploader.destroy(matches[0]).catch(() => {});
    }

    await db.query("UPDATE users SET photo = ? WHERE id = ?", [photoUrl, userId]);

    return res.json({ status: "success", message: "Foto profil berhasil diperbarui.", photo: photoUrl });
  } catch (err) {
    console.error("uploadPhoto error:", err);
    return res.status(500).json({ status: "error", message: "Gagal mengupload foto." });
  }
}

module.exports = { getProfile, updateProfile, uploadPhoto };
