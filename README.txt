# SSS+DEALER

## Apa itu SSS+Dealer?

SSS+Dealer adalah platform dealership mobil sport dan luxury.
Dibangun untuk para penggemar otomotif — dari browsing koleksi hingga booking test drive.

---

## Tech Stack

| Layer       | Teknologi                                      |
|-------------|------------------------------------------------|
| Frontend    | HTML, CSS, Vanilla JavaScript                  |
| Backend     | Node.js + Express.js                           |
| ORM         | Prisma                                         |
| Database    | PostgreSQL (Neon — cloud)                      |
| Auth        | JWT (jsonwebtoken + bcryptjs)                  |
| File Upload | Multer (lokal, folder uploads/)                |

---

## Fitur

- Browse & filter mobil (brand, tipe, harga, drivetrain, dll)
- Halaman detail mobil lengkap (spesifikasi, WhatsApp CTA)
- Compare 2 mobil side-by-side
- Favorit mobil (butuh login)
- Riwayat compare (butuh login)
- Booking test drive (tanpa login pun bisa)
- Akun: register, login, edit profil, upload foto profil
- Navbar menampilkan nama user jika sudah login

---

## Struktur Project

```
project/
├── src/                        # Backend (Express)
│   ├── server.js               # Entry point server
│   ├── config/paths.js         # Path penting (public, uploads, .env)
│   ├── controllers/            # Logika tiap fitur (auth, cars, favorites, compare, account, testDrive, lead)
│   ├── routes/                 # Definisi endpoint /api/*
│   ├── middleware/auth.js      # JWT (requireAuth, optionalAuth, requireAdmin)
│   └── lib/prisma.js           # Singleton Prisma Client
├── public/                     # Frontend (satu-satunya folder yang dilayani ke browser)
│   ├── *.html                  # index, cars, car-detail, compare, guides, signin, signup, account, test-drive, role
│   ├── admin/                  # Panel admin: index (/admin/), car-form, test-drive, leads
│   ├── css/                    # Stylesheet
│   ├── js/                     # JavaScript frontend (js/admin/ untuk panel admin)
│   └── images/                 # cars/ (foto mobil), logos/ (logo merek), guides/, icons/, hero.jpg
├── prisma/
│   ├── schema.prisma           # Skema database PostgreSQL
│   └── seed.js                 # Seed data mobil
├── uploads/                    # File unggahan (foto mobil & profil), tidak di-commit
├── package.json
├── .env.example                # Template environment variables
└── .env                        # Environment variables lokal (JANGAN di-commit)
```

---

## Setup & Instalasi

### Prasyarat
- Node.js v18+
- Akun Neon (gratis): https://neon.tech
- npm

---

### 1. CLONE / COPY PROJECT

Pastikan semua file sudah ada di folder project kamu.

---

### 2. INSTALL DEPENDENCIES

```bash
npm install
```

---

### 3. BUAT DATABASE DI NEON

1. Buka https://console.neon.tech dan login/daftar
2. Buat project baru → beri nama (misal: sss-dealer)
3. Buka project → tab **Connection Details**
4. Salin dua string koneksi:
   - **Pooled connection** → untuk DATABASE_URL
   - **Direct connection** → untuk DIRECT_URL

---

### 4. KONFIGURASI .env

Salin file template:
```bash
copy .env.example .env
```

Buka `.env` dan isi:
```
DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/sss_dealer?sslmode=require&pgbouncer=true
DIRECT_URL=postgresql://user:pass@ep-xxx.neon.tech/sss_dealer?sslmode=require
JWT_SECRET=isi_dengan_string_random_panjang_minimal_32_karakter
JWT_EXPIRES_IN=7d
PORT=3000
NODE_ENV=development
```

Untuk generate JWT_SECRET yang aman, jalankan:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

### 5. PUSH SCHEMA KE DATABASE

```bash
npm run db:push
```

Perintah ini membuat semua tabel di Neon sesuai schema Prisma.

---

### 6. ISI DATA MOBIL (SEED)

```bash
npm run db:seed
```

Mengisi 18 data mobil ke database. Aman dijalankan ulang (upsert).

---

### 7. JALANKAN SERVER

```bash
npm start
```

Atau mode development dengan auto-restart:
```bash
npm run dev
```

Buka browser: http://localhost:3000

---

### 8. TESTING

Setelah server berjalan, coba urutan berikut:

- [ ] Buka http://localhost:3000 → homepage tampil
- [ ] Buka cars.html → daftar 18 mobil muncul, filter berfungsi
- [ ] Klik salah satu mobil → car-detail.html tampil dengan spesifikasi lengkap
- [ ] Daftar akun baru di signup.html
- [ ] Login di signin.html → nama muncul di navbar
- [ ] Klik "Add to Favorites" di halaman detail → berhasil
- [ ] Buka account.html → lihat favorit, riwayat compare, edit profil
- [ ] Pilih 2 mobil → buka compare.html → tabel perbandingan muncul
- [ ] Isi form Test Drive di car-detail.html → berhasil tersimpan

---

## API Endpoints

### Auth
| Method | Endpoint                     | Auth | Deskripsi               |
|--------|------------------------------|------|-------------------------|
| POST   | /api/auth/signup             | —    | Daftar akun baru        |
| POST   | /api/auth/signin             | —    | Login, dapat JWT token  |
| POST   | /api/auth/logout             | ✓    | Logout (client hapus token) |
| GET    | /api/auth/me                 | ✓    | Cek session / ambil user |
| POST   | /api/auth/check-identifier   | —    | Cek email/username duplikat |

### Cars
| Method | Endpoint                  | Auth | Deskripsi                  |
|--------|---------------------------|------|----------------------------|
| GET    | /api/cars                 | —    | Semua mobil (support filter) |
| GET    | /api/cars/:id             | —    | Detail satu mobil          |
| GET    | /api/cars/by-ids?ids=1,2  | —    | Beberapa mobil (compare)   |

### Favorites
| Method | Endpoint                        | Auth | Deskripsi            |
|--------|---------------------------------|------|----------------------|
| GET    | /api/favorites                  | ✓    | Daftar favorit user  |
| GET    | /api/favorites/check?car_id=1   | ✓    | Status favorit       |
| POST   | /api/favorites/toggle           | ✓    | Toggle favorit       |

### Compare
| Method | Endpoint      | Auth    | Deskripsi                  |
|--------|---------------|---------|----------------------------|
| POST   | /api/compare  | opsional| Simpan riwayat compare     |
| GET    | /api/compare  | ✓       | Ambil riwayat compare      |

### Account
| Method | Endpoint             | Auth | Deskripsi             |
|--------|----------------------|------|-----------------------|
| GET    | /api/account         | ✓    | Ambil profil          |
| PUT    | /api/account         | ✓    | Update profil         |
| POST   | /api/account/photo   | ✓    | Upload foto profil    |

### Test Drive
| Method | Endpoint          | Auth     | Deskripsi             |
|--------|-------------------|----------|-----------------------|
| POST   | /api/test-drive   | opsional | Booking test drive    |

---

## Autentikasi (JWT)

Token JWT dikirim dari client via header:
```
Authorization: Bearer <token>
```

Token disimpan di `localStorage` oleh frontend JS.
Saat login berhasil, `token` dan `user` disimpan otomatis.
Saat logout, keduanya dihapus dari `localStorage`.

---

## Catatan Penting

- **Nomor WhatsApp** di `js/car-detail.js` masih dummy (`+62 81234567890`).
  Ganti di baris `whatsappBtn.href` dengan nomor asli.

- **Compare** dibatasi maksimal **2 mobil** sekaligus.

- **File `.env`** berisi kredensial sensitif. Pastikan sudah ada di `.gitignore`.

- **Foto profil** tersimpan lokal di `uploads/profile_photos/`.
  Untuk production, pertimbangkan migrasi ke cloud storage (Cloudinary, S3, dll).

- **Featured Cars di homepage** masih statis/hardcode, tidak dari database.
  Tombol favorit & compare berfungsi penuh di `cars.html`.

- **Forgot Password** tidak tersedia di versi ini.

---

## Navbar Reference

| Item      | Tujuan                                        |
|-----------|-----------------------------------------------|
| HOME      | index.html                                    |
| CARS      | cars.html                                     |
| COMPARE   | compare.html                                  |
| GUIDES    | guides.html                                   |
| ABOUT US  | index.html#about-section                      |
| CONTACT   | index.html#contact-section (footer)           |
| Account   | signin.html (belum login) / account.html (sudah login) |
