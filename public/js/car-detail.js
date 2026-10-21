// =============================================================
// Detail Mobil — Figma "Detail Porsche 911" (4:10227)
// Data dari /api/cars/:id (Node.js), JWT untuk favorit.
// Harga Rupiah, bahasa Indonesia.
// =============================================================

const urlParams = new URLSearchParams(window.location.search);
const carId = urlParams.get("id");
const WA_NUMBER = "622150881900";

let currentCar = null;

const detailContent = document.getElementById("detailContent");

function showMissing() {
  detailContent.innerHTML =
    '<p class="detail-missing">Mobil tidak ditemukan. <a href="cars.html">Kembali ke koleksi</a>.</p>';
}

if (!carId) {
  showMissing();
} else {
  loadCarDetail();
}

function loadCarDetail() {
  fetch(`/api/cars/${carId}`)
    .then((res) => res.json())
    .then((result) => {
      if (result.status !== "success") {
        showMissing();
        return;
      }
      currentCar = result.data;
      renderCar(currentCar);
      initGallery(currentCar);
      initTabs();
      checkFavoriteStatus();
      updateCompareButtonState();
      saveRecentlyViewed(currentCar);
    })
    .catch(() => {
      detailContent.innerHTML =
        '<p class="detail-missing">Gagal terhubung ke server.</p>';
    });
}

function fmtRupiah(v) {
  return "Rp " + Number(v || 0).toLocaleString("id-ID");
}

function renderCar(car) {
  document.title = `${car.brand} ${car.name} | SSS+Dealer`;

  document.getElementById("bcBrand").textContent = car.brand;
  document.getElementById("bcName").textContent = car.name;

  document.getElementById("carImage").src = car.image;
  document.getElementById("carImage").alt = `${car.brand} ${car.name}`;
  const statusLabel = car.status === "reserved" ? "DIPESAN" : "TERSEDIA";
  document.getElementById("carBrand").textContent =
    `${car.brand.toUpperCase()} · 2024 · ${statusLabel}`;
  document.getElementById("carName").textContent = car.name;
  document.getElementById("carPrice").textContent = fmtRupiah(car.price);
  document.getElementById("carDescription").textContent =
    car.description ||
    `${car.brand} ${car.name} — ikon performa dalam koleksi SSS+Dealer.`;

  // Metrik ringkas (offer panel)
  document.getElementById("specHorsepower").textContent = car.horsepower ? car.horsepower + " PS" : "-";
  document.getElementById("specAccel").textContent      = car.accel0100 || car.accel_0_100 || "-";
  document.getElementById("specTopSpeed").textContent   = car.topSpeed ? car.topSpeed + " km/j" : "-";

  // Tabel spesifikasi
  setText("rowHp",          car.horsepower ? car.horsepower + " PS" : "-");
  setText("rowTorque",      car.torque ? car.torque + " Nm" : "-");
  setText("rowTransmission", car.transmission || "-");
  setText("rowDrivetrain",  car.drivetrain || "-");
  setText("rowAccel",       car.accel0100 || car.accel_0_100 || "-");
  setText("rowTopSpeed",    car.topSpeed ? car.topSpeed + " km/jam" : "-");
  setText("rowType",        car.type || "-");
  setText("rowPowertrain",  car.powertrain || "-");
  setText("rowPerformance", car.performance || "-");
  setText("rowFuel",        powertrainToFuel(car.powertrain));

  // WhatsApp prefill
  const waMsg = encodeURIComponent(
    `Halo SSS+Dealer, saya tertarik dengan ${car.brand} ${car.name}. Bisa minta info lebih lanjut?`
  );
  document.getElementById("whatsappBtn").href = `https://wa.me/${WA_NUMBER}?text=${waMsg}`;

  // Tautan test drive -> halaman pemesanan (hanya jika available)
  const tdBtn   = document.getElementById("testDriveBtn");
  const unitTd  = document.getElementById("unitTestDriveBtn");

  if (car.status === "available") {
    const tdHref = `test-drive.html?id=${car.id}`;
    tdBtn.href = tdHref;
    if (unitTd) unitTd.href = tdHref;
  } else {
    // Nonaktifkan tombol test drive
    tdBtn.removeAttribute("href");
    tdBtn.style.pointerEvents = "none";
    tdBtn.style.opacity = "0.4";
    tdBtn.title = "Mobil ini sedang tidak tersedia untuk test drive.";
    if (unitTd) {
      unitTd.removeAttribute("href");
      unitTd.style.pointerEvents = "none";
      unitTd.style.opacity = "0.4";
      unitTd.title = "Mobil ini sedang tidak tersedia untuk test drive.";
    }
  }
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function powertrainToFuel(pt) {
  if (!pt) return "Bensin";
  const p = pt.toLowerCase();
  if (p.includes("electric")) return "Listrik";
  if (p.includes("hybrid")) return "Hybrid";
  return "Bensin";
}

// ---------- GALLERY ----------
function initGallery(car) {
  const thumbs = document.getElementById("galleryThumbs");
  if (!thumbs) return;
  // DB hanya menyimpan satu foto; tampilkan sebagai thumbnail aktif tunggal.
  thumbs.innerHTML = "";
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "thumb active";
  btn.innerHTML = `<img src="${car.image}" alt="${car.brand} ${car.name}">`;
  thumbs.appendChild(btn);
  document.getElementById("galleryIndex").textContent = "01 / 01 · Eksterior";
}

// ---------- TABS ----------
function initTabs() {
  const tabs = document.querySelectorAll(".detail-tabs .tab");
  const panels = document.querySelectorAll("[data-panel]");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      const target = tab.dataset.tab;
      panels.forEach((p) => {
        p.hidden = p.dataset.panel !== target;
      });
    });
  });
}

// ---------- FAVORITE ----------
document.getElementById("favoriteBtn").addEventListener("click", () => {
  if (!isLoggedIn()) {
    sessionStorage.setItem("redirectAfterLogin", `car-detail.html?id=${carId}`);
    window.location.href = "signin.html";
    return;
  }
  fetch("/api/favorites/toggle", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ car_id: carId }),
  })
    .then((res) => res.json())
    .then((result) => {
      if (result.status === "success") setFavoriteButtonState(result.favorited);
    });
});

function checkFavoriteStatus() {
  if (!isLoggedIn()) {
    setFavoriteButtonState(false);
    return;
  }
  fetch(`/api/favorites/check?car_id=${carId}`, { headers: authHeaders() })
    .then((res) => res.json())
    .then((result) => setFavoriteButtonState(result.favorited))
    .catch(() => {});
}

function setFavoriteButtonState(isFav) {
  const btn = document.getElementById("favoriteBtn");
  const label = document.getElementById("favLabel");
  btn.classList.toggle("active", isFav);
  label.textContent = isFav ? "Tersimpan di favorit" : "Tambah ke favorit";
}

// ---------- COMPARE ----------
function getCompareList() {
  return JSON.parse(localStorage.getItem("compareList") || "[]");
}

function updateCompareButtonState() {
  const list = getCompareList();
  const btn = document.getElementById("compareBtn");
  btn.textContent = list.includes(String(carId))
    ? "✓ Ada di perbandingan"
    : "+ Tambah ke perbandingan";
}

document.getElementById("compareBtn").addEventListener("click", () => {
  let list = getCompareList();
  if (list.includes(String(carId))) {
    list = list.filter((id) => id !== String(carId));
    localStorage.setItem("compareList", JSON.stringify(list));
    updateCompareButtonState();
    return;
  }
  if (list.length >= 2) {
    alert("Bandingkan maksimal 2 mobil. Hapus salah satu dulu di halaman Bandingkan.");
    return;
  }
  list.push(String(carId));
  localStorage.setItem("compareList", JSON.stringify(list));
  updateCompareButtonState();
  if (list.length === 2) {
    if (confirm("2 mobil sudah dipilih. Buka halaman Bandingkan sekarang?")) {
      window.location.href = "compare.html";
    }
  }
});

// ---------- RECENTLY VIEWED ----------
function saveRecentlyViewed(car) {
  const MAX = 6;
  let recent = JSON.parse(localStorage.getItem("recentlyViewed") || "[]");
  recent = recent.filter((item) => String(item.id) !== String(car.id));
  recent.unshift({ id: car.id, brand: car.brand, name: car.name, price: car.price, image: car.image });
  if (recent.length > MAX) recent = recent.slice(0, MAX);
  localStorage.setItem("recentlyViewed", JSON.stringify(recent));
}
