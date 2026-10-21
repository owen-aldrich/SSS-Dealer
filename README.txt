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
| Database    | MySQL / TiDB Cloud Serverless                  |
| ORM         | mysql2 (query langsung, tanpa ORM)             |
| Auth        | JWT (jsonwebtoken + bcryptjs)                  |
| File Upload | Multer + Cloudinary (cloud storage)            |

---

## Fitur

- Browse & filter mobil (brand, tipe, harga, dll)
- Badge status mobil: TERSEDIA / RESERVED di kartu katalog
- Halaman detail mobil lengkap (spesifikasi, WhatsApp CTA)
- Compare 2 mobil side-by-side
- Favorit mobil (butuh login)
- Booking test drive (butuh login)
- Status mobil: available, reserved, sold, draft
  - Sold & Draft tidak tampil di halaman publik
  - Reserved tampil dengan badge, test drive tidak bisa
- Akun: register, login, edit profil, upload foto profil
- Panel admin: kelola mobil, test drive, leads
- Navbar menampilkan nama user jika sudah login

---

## Struktur Project

```
sss-dealer-final/
├── src/                        # Backend (Express)
│   ├── server.js               # Entry point server
│   ├── config/                 # Konfigurasi (paths, cloudinary)
│   ├── controllers/            # Logika tiap fitur
│   │   ├── authController.js
│   │   ├── carsController.js
│   │   ├── accountController.js
│   │   ├── favoritesController.js
│   │   ├── compareController.js
│   │   ├── testDriveController.js
│   │   └── leadController.js
│   ├── routes/                 # Definisi endpoint /api/*
│   │   ├── auth.js
│   │   ├── cars.js
│   │   ├── account.js
│   │   ├── favorites.js
│   │   ├── compare.js
│   │   ├── testDrive.js
│   │   └── leads.js
│   ├── middleware/auth.js      # JWT (requireAuth, optionalAuth, requireAdmin)
│   └── lib/db.js               # Singleton mysql2 connection pool
├── public/                     # Frontend (dilayani ke browser)
│   ├── index.html              # Homepage
│   ├── cars.html               # Katalog mobil
│   ├── car-detail.html         # Detail mobil
│   ├── compare.html            # Perbandingan 2 mobil
│   ├── guides.html             # Panduan membeli
│   ├── test-drive.html         # Form booking test drive
│   ├── account.html            # Profil user
│   ├── signin.html / signup.html
│   ├── admin/                  # Panel admin (index, car-form, test-drive, leads)
│   ├── css/                    # Stylesheet per halaman
│   ├── js/                     # JavaScript frontend
│   │   ├── admin/              # JS khusus panel admin
│   │   └── *.js                # JS per halaman publik
│   └── images/                 # cars/, logos/, guides/, icons/
├── database/
│   ├── schema.sql              # Definisi tabel (referensi & source of truth)
│   ├── schema-init.js          # Script jalankan schema.sql ke database
│   └── seed.js                 # Data awal 18 mobil
├── package.json
├── .env.example                # Template environment variables
└── .env                        # Environment variables lokal (JANGAN di-commit)
```

---

## Setup & Instalasi

### Prasyarat
- Node.js v18+
- Akun TiDB Cloud (gratis): https://tidbcloud.com
- npm

---

### 1. CLONE / COPY PROJECT

Pastikan semua file sudah ada di folder project.

---

### 2. INSTALL DEPENDENCIES

```bash
npm install
```

---

### 3. BUAT DATABASE DI TIDB CLOUD

1. Buka https://tidbcloud.com dan login/daftar
2. Buat cluster Serverless baru
3. Buka cluster → **Connect** → salin kredensial koneksi

---

### 4. KONFIGURASI .env

Salin file template:
```bash
copy .env.example .env
```

Buka `.env` dan isi:
```
DB_HOST=gateway01.ap-southeast-1.prod.aws.tidbcloud.com
DB_PORT=4000
DB_USER=username.root
DB_PASSWORD=password_kamu
DB_NAME=sss_dealer
DB_SSL=true

JWT_SECRET=isi_dengan_string_random_panjang_minimal_32_karakter
JWT_EXPIRES_IN=7d

PORT=3000
NODE_ENV=development

CLOUDINARY_CLOUD_NAME=nama_cloud_kamu
CLOUDINARY_API_KEY=api_key_kamu
CLOUDINARY_API_SECRET=api_secret_kamu
```

Untuk generate JWT_SECRET yang aman:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

### 5. BUAT TABEL DI DATABASE

```bash
npm run db:init
```

Script ini membaca `database/schema.sql` dan menjalankannya ke TiDB Cloud.
Aman dijalankan ulang karena semua tabel pakai `CREATE TABLE IF NOT EXISTS`.

---

### 6. ISI DATA MOBIL (SEED)

```bash
npm run db:seed
```

Mengisi 18 data mobil ke database.

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
- [ ] Buka cars.html → daftar mobil muncul, filter berfungsi
- [ ] Klik salah satu mobil → car-detail.html tampil dengan spesifikasi lengkap
- [ ] Daftar akun baru di signup.html
- [ ] Login di signin.html → nama muncul di navbar
- [ ] Klik "Add to Favorites" di halaman detail → berhasil
- [ ] Buka account.html → lihat favorit, riwayat compare, edit profil
- [ ] Pilih 2 mobil → buka compare.html → tabel perbandingan muncul
- [ ] Isi form Test Drive → berhasil tersimpan (harus login)
- [ ] Buka /admin/ dengan akun admin → panel tampil

---

## Mengubah Struktur Database

Edit `database/schema.sql` langsung, lalu jalankan SQL-nya ke TiDB Cloud.

Untuk perubahan besar (setup ulang dari awal):
```bash
npm run db:init
```

Untuk perubahan kecil (tambah kolom, dll) — jalankan langsung di TiDB Cloud Console → SQL Editor.

---

## API Endpoints

### Auth
| Method | Endpoint                     | Auth | Deskripsi                    |
|--------|------------------------------|------|------------------------------|
| POST   | /api/auth/signup             | —    | Daftar akun baru             |
| POST   | /api/auth/signin             | —    | Login, dapat JWT token       |
| POST   | /api/auth/logout             | ✓    | Logout (client hapus token)  |
| GET    | /api/auth/me                 | ✓    | Cek session / ambil user     |
| POST   | /api/auth/check-identifier   | —    | Cek email/username duplikat  |

### Cars
| Method | Endpoint                  | Auth  | Deskripsi                                        |
|--------|---------------------------|-------|--------------------------------------------------|
| GET    | /api/cars                 | —     | Semua mobil status available & reserved          |
| GET    | /api/cars/:id             | —     | Detail mobil (404 jika draft/sold)               |
| GET    | /api/cars/by-ids?ids=1,2  | —     | Beberapa mobil sekaligus (untuk compare)         |
| POST   | /api/cars/upload-image    | Admin | Upload foto mobil ke Cloudinary                  |
| POST   | /api/cars                 | Admin | Tambah mobil baru                                |
| PUT    | /api/cars/:id             | Admin | Edit data mobil                                  |
| DELETE | /api/cars/:id             | Admin | Hapus mobil                                      |

### Favorites
| Method | Endpoint                        | Auth | Deskripsi           |
|--------|---------------------------------|------|---------------------|
| GET    | /api/favorites                  | ✓    | Daftar favorit user |
| GET    | /api/favorites/check?car_id=1   | ✓    | Status favorit      |
| POST   | /api/favorites/toggle           | ✓    | Toggle favorit      |

### Compare
| Method | Endpoint      | Auth     | Deskripsi              |
|--------|---------------|----------|------------------------|
| POST   | /api/compare  | opsional | Simpan riwayat compare |
| GET    | /api/compare  | ✓        | Ambil riwayat compare  |

### Account
| Method | Endpoint             | Auth | Deskripsi          |
|--------|----------------------|------|--------------------|
| GET    | /api/account         | ✓    | Ambil profil       |
| PUT    | /api/account         | ✓    | Update profil      |
| POST   | /api/account/photo   | ✓    | Upload foto profil |

### Test Drive
| Method | Endpoint                     | Auth  | Deskripsi                       |
|--------|------------------------------|-------|---------------------------------|
| POST   | /api/test-drive              | ✓     | Booking test drive (wajib login)|
| GET    | /api/test-drive/me           | ✓     | Riwayat test drive user         |
| GET    | /api/test-drive/booked-slots | —     | Slot jam terisi (per mobil+tgl) |
| GET    | /api/test-drive              | Admin | Semua booking (admin)           |
| PATCH  | /api/test-drive/:id          | Admin | Update status/jadwal (admin)    |

### Leads
| Method | Endpoint        | Auth  | Deskripsi         |
|--------|-----------------|-------|-------------------|
| GET    | /api/leads      | Admin | Semua leads       |
| POST   | /api/leads      | —     | Tambah lead baru  |
| PATCH  | /api/leads/:id  | Admin | Update lead       |
| DELETE | /api/leads/:id  | Admin | Hapus lead        |

---

## Status Mobil

| Status    | Tampil di Publik | Badge          | Test Drive |
|-----------|------------------|----------------|------------|
| available | ✓                | TERSEDIA       | ✓          |
| reserved  | ✓                | RESERVED       | ✗          |
| sold      | ✗                | —              | ✗          |
| draft     | ✗ (404)          | —              | ✗          |

---

## Autentikasi (JWT)

Token JWT dikirim dari client via header:
```
Authorization: Bearer <token>
```

Token disimpan di `localStorage` oleh frontend.
Saat login berhasil, `token` dan `user` disimpan otomatis.
Saat logout, keduanya dihapus dari `localStorage`.

---

## Catatan Penting

- **Nomor WhatsApp** di `js/car-detail.js` ganti dengan nomor asli di baris `const WA_NUMBER`.

- **Compare** dibatasi maksimal **2 mobil** sekaligus.

- **File `.env`** berisi kredensial sensitif. Pastikan sudah ada di `.gitignore`.

- **Foto profil & foto mobil** tersimpan di **Cloudinary** — tidak hilang saat redeploy.

- **Forgot Password** tidak tersedia di versi ini.

---

## Navbar Reference

| Item      | Tujuan                                                        |
|-----------|---------------------------------------------------------------|
| HOME      | index.html                                                    |
| CARS      | cars.html                                                     |
| COMPARE   | compare.html                                                  |
| GUIDES    | guides.html                                                   |
| ABOUT US  | index.html#about-section                                      |
| CONTACT   | index.html#contact-section (footer)                           |
| Account   | signin.html (belum login) / account.html (sudah login)        |
| Admin     | /admin/ (hanya role admin)                                    |
