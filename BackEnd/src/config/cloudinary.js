// =============================================================
// Cloudinary Config — satu sumber konfigurasi untuk semua upload
// =============================================================

const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Storage untuk foto mobil → folder sss-dealer/cars
const carStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:         "sss-dealer/cars",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 1200, height: 800, crop: "limit", quality: "auto" }],
  },
});

// Storage untuk foto profil → folder sss-dealer/profiles
const profileStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:         "sss-dealer/profiles",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 400, height: 400, crop: "fill", gravity: "face", quality: "auto" }],
  },
});

module.exports = { cloudinary, carStorage, profileStorage };
