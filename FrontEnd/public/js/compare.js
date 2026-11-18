/* ==================================================
   Bandingkan Mobil — Figma "Perbandingan mobil" (4:10448)
   Data /api/cars/by-ids, riwayat /api/compare. ID + Rupiah.
===================================================== */

const container   = document.getElementById("compareContent");
const helpBanner  = document.getElementById("compareHelp");
const overlineEl  = document.getElementById("compareOverline");
const hlToggle    = document.getElementById("highlightToggle");

let highlightOn = true;

function getCompareList() {
  return JSON.parse(localStorage.getItem("compareList") || "[]");
}

function removeFromCompare(id) {
  const list = getCompareList().filter((cid) => cid !== String(id));
  localStorage.setItem("compareList", JSON.stringify(list));
  render();
}

function fmtRupiah(v) {
  return "Rp " + Number(v || 0).toLocaleString("id-ID");
}

/* Grup baris spesifikasi. getter null = tidak ada di DB -> "—". */
const SPEC_GROUPS = [
  {
    title: "PERFORMA & MESIN",
    rows: [
      { label: "Mesin",              get: () => "—" },
      { label: "Tenaga maksimum",    get: (c) => (c.horsepower ? c.horsepower + " PS" : "—") },
      { label: "Torsi maksimum",     get: (c) => (c.torque ? c.torque + " Nm" : "—") },
      { label: "0–100 km/jam",       get: (c) => (c.accel0100 || c.accel_0_100 || "—") },
      { label: "Kecepatan maksimum", get: (c) => (c.topSpeed ? c.topSpeed + " km/jam" : "—") },
      { label: "Transmisi",          get: (c) => (c.transmission || "—") },
      { label: "Penggerak",          get: (c) => (c.drivetrain || "—") },
    ],
  },
  {
    title: "DIMENSI & KENYAMANAN",
    rows: [
      { label: "Tipe bodi",       get: (c) => (c.type || "—") },
      { label: "Powertrain",      get: (c) => (c.powertrain || "—") },
      { label: "Kelas performa",  get: (c) => (c.performance || "—") },
      { label: "Tempat duduk",    get: () => "—" },
      { label: "Warna",           get: () => "Sesuai unit" },
      { label: "Tahun",           get: () => "2024" },
    ],
  },
];

function render() {
  const list = getCompareList();
  overlineEl.textContent = `BANDINGKAN / ${String(list.length).padStart(2, "0")} MOBIL`;

  if (list.length === 0) {
    helpBanner.style.display = "none";
    container.innerHTML = `
      <div class="empty-compare">
        <p>Belum ada mobil yang dipilih untuk dibandingkan.</p>
        <p>Buka koleksi atau halaman detail, lalu klik "Tambah ke perbandingan" (maksimal 2 mobil).</p>
        <a href="cars.html">Jelajahi koleksi</a>
      </div>`;
    return;
  }

  fetch(`/api/cars/by-ids?ids=${list.join(",")}`)
    .then((res) => res.json())
    .then((result) => {
      if (result.status !== "success" || result.data.length === 0) {
        helpBanner.style.display = "none";
        container.innerHTML = `
          <div class="empty-compare">
            <p>Data mobil tidak ditemukan.</p>
            <a href="cars.html">Jelajahi koleksi</a>
          </div>`;
        return;
      }

      renderTable(result.data);
      helpBanner.style.display = "flex";
      maybeSaveHistory(result.data);
    })
    .catch(() => {
      helpBanner.style.display = "none";
      container.innerHTML = '<div class="empty-compare"><p>Gagal terhubung ke server.</p></div>';
    });
}

function renderTable(cars) {
  const cols = cars.length;

  // Header mobil
  const carHeads = cars.map((car) => {
    return `
      <div class="car-head">
        <button class="car-close" type="button" onclick="removeFromCompare(${car.id})" title="Hapus">
          <img src="images/icons/x.svg" alt="Hapus">
        </button>
        <div class="car-photo"><img src="${car.image}" alt="${car.brand} ${car.name}"></div>
        <span class="car-brand">${car.brand.toUpperCase()}</span>
        <span class="car-name">${car.name}</span>
        <span class="car-price">${fmtRupiah(car.price)}</span>
        <a class="btn btn-primary" href="test-drive.html?id=${car.id}">
          Pesan test drive
          <img src="images/icons/arrow-up-right-dark.svg" alt="">
        </a>
      </div>`;
  }).join("");

  // Grup + baris spesifikasi
  const groupsHtml = SPEC_GROUPS.map((group) => {
    const rows = group.rows.map((row) => {
      const values = cars.map((c) => String(row.get(c)));
      const isDiff = new Set(values).size > 1;
      const cells = values.map((v) => `<div class="cmp-cell cmp-val">${v}</div>`).join("");
      return `
        <div class="cmp-row cmp-spec ${isDiff ? "diff" : ""}" style="--cols:${cols}">
          <div class="cmp-cell cmp-key">${row.label}</div>
          ${cells}
        </div>`;
    }).join("");
    return `<div class="cmp-group-title">${group.title}</div>${rows}`;
  }).join("");

  container.innerHTML = `
    <div class="compare-grid ${highlightOn ? "highlight" : ""}" id="compareGrid">
      <div class="cmp-row cmp-head" style="--cols:${cols}">
        <div class="cmp-label-cell">
          <p class="overline">PILIHAN ANDA</p>
          <p class="pick-title">Temukan yang paling selaras.</p>
          <p class="pick-note">Maksimal 2 mobil dalam satu perbandingan.</p>
        </div>
        ${carHeads}
      </div>
      ${groupsHtml}
    </div>
    <p class="compare-note">
      Harga indikatif OTR Jakarta. Konfigurasi dan ketersediaan dikonfirmasi konsultan.
      Untuk membeli, chat via WhatsApp — tanpa checkout atau pembayaran di aplikasi.
    </p>`;
}

function maybeSaveHistory(cars) {
  if (cars.length !== 2) return;
  const key = [cars[0].id, cars[1].id].sort().join("-");
  if (sessionStorage.getItem("compare_saved_" + key)) return;

  const headers = isLoggedIn() ? authHeaders() : { "Content-Type": "application/json" };
  fetch("/api/compare", {
    method: "POST",
    headers,
    body: JSON.stringify({ car_id_1: cars[0].id, car_id_2: cars[1].id }),
  })
    .then((res) => res.json())
    .then((r) => { if (r.saved) sessionStorage.setItem("compare_saved_" + key, "1"); })
    .catch(() => {});
}

/* Toggle sorot perbedaan */
hlToggle.addEventListener("click", () => {
  highlightOn = !highlightOn;
  hlToggle.classList.toggle("active", highlightOn);
  const grid = document.getElementById("compareGrid");
  if (grid) grid.classList.toggle("highlight", highlightOn);
});

render();
