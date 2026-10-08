// =============================================================
// Katalog Mobil — Figma "Katalog mobil" (4:9998)
// Sidebar filter (checkbox merek + tipe + rentang harga Rupiah),
// sort, grid .v-card 2 kolom, compare tray.
// Data dari /api/cars (Node.js), JWT untuk favorit.
// =============================================================

let carsData = [];

const searchInput    = document.getElementById("searchInput");
const brandList      = document.getElementById("filterBrandList");
const typeList       = document.getElementById("filterTypeList");
const priceMin       = document.getElementById("priceMin");
const priceMax       = document.getElementById("priceMax");
const sortBy         = document.getElementById("sortBy");
const resetBtn       = document.getElementById("resetFilters");

const carsGrid       = document.getElementById("carsGrid");
const resultsCount   = document.getElementById("resultsCount");
const noResults      = document.getElementById("noResults");

const compareTray    = document.getElementById("compareTray");
const trayCount      = document.getElementById("trayCount");
const trayNames      = document.getElementById("trayNames");

const WA_NUMBER = "622150881900";

/* -------------------------------------------------
   Util: format & parse Rupiah
-------------------------------------------------- */
function formatRupiah(num) {
  return "Rp " + Number(num || 0).toLocaleString("id-ID");
}
function parseRupiah(str) {
  const digits = String(str).replace(/[^\d]/g, "");
  return digits ? Number(digits) : null;
}

/* -------------------------------------------------
   Bangun checkbox opsi filter (merek / tipe bodi)
-------------------------------------------------- */
function buildCheckboxOptions(container, field) {
  const counts = {};
  carsData.forEach((c) => {
    const v = c[field];
    if (v) counts[v] = (counts[v] || 0) + 1;
  });

  container.innerHTML = "";
  Object.keys(counts)
    .sort((a, b) => a.localeCompare(b))
    .forEach((value) => {
      const label = document.createElement("label");
      label.className = "filter-opt";
      label.innerHTML = `
        <input type="checkbox" value="${value}" data-field="${field}">
        <span class="box"></span>
        <span class="opt-name">${value}</span>
        <span class="opt-count">${counts[value]}</span>
      `;
      container.appendChild(label);
    });

  container.querySelectorAll("input").forEach((cb) =>
    cb.addEventListener("change", applyFilters)
  );
}

function getChecked(container) {
  return [...container.querySelectorAll("input:checked")].map((cb) => cb.value);
}

/* -------------------------------------------------
   Filter + sort
-------------------------------------------------- */
function applyFilters() {
  const searchText = searchInput.value.toLowerCase().trim();
  const brands = getChecked(brandList);
  const types  = getChecked(typeList);
  const min    = parseRupiah(priceMin.value);
  const max    = parseRupiah(priceMax.value);

  let filtered = carsData.filter((car) => {
    const matchesSearch =
      car.name.toLowerCase().includes(searchText) ||
      car.brand.toLowerCase().includes(searchText);
    const matchesBrand = brands.length === 0 || brands.includes(car.brand);
    const matchesType  = types.length === 0 || types.includes(car.type);

    const price = Number(car.price);
    const matchesMin = min === null || price >= min;
    const matchesMax = max === null || price <= max;

    return matchesSearch && matchesBrand && matchesType && matchesMin && matchesMax;
  });

  switch (sortBy.value) {
    case "price-asc":  filtered.sort((a, b) => Number(a.price) - Number(b.price)); break;
    case "price-desc": filtered.sort((a, b) => Number(b.price) - Number(a.price)); break;
    case "hp-desc":    filtered.sort((a, b) => (b.horsepower || 0) - (a.horsepower || 0)); break;
    case "name-asc":   filtered.sort((a, b) => a.name.localeCompare(b.name)); break;
    case "brand-asc":  filtered.sort((a, b) => a.brand.localeCompare(b.brand)); break;
    default: break;
  }

  renderCars(filtered);
}

/* -------------------------------------------------
   Render grid .v-card
-------------------------------------------------- */
function renderCars(cars) {
  carsGrid.innerHTML = "";
  resultsCount.textContent = `Menampilkan ${cars.length} mobil`;

  if (cars.length === 0) {
    noResults.style.display = "block";
    updateCompareTray();
    return;
  }
  noResults.style.display = "none";

  const compareList = JSON.parse(localStorage.getItem("compareList") || "[]");
  const year = 2024;

  cars.forEach((car) => {
    const inCompare = compareList.includes(String(car.id));
    const specBits = [
      car.type,
      car.horsepower ? car.horsepower + " PS" : null,
      car.accel0100 ? car.accel0100 + " (0–100)" : null,
    ].filter(Boolean).join(" · ");

    const waMsg = encodeURIComponent(`Halo SSS+Dealer, saya tertarik dengan ${car.brand} ${car.name}.`);

    const card = document.createElement("article");
    card.className = "v-card" + (inCompare ? " selected" : "");
    card.innerHTML = `
      <div class="v-visual">
        <img class="photo" src="${car.image}" alt="${car.brand} ${car.name}" loading="lazy">
        ${FavStore.buttonHtml(car.id)}
        <span class="avail-badge">TERSEDIA</span>
      </div>
      <div class="v-info">
        <p class="brand-year">${car.brand.toUpperCase()} · ${year}</p>
        <h3>${car.name}</h3>
        <p class="v-spec">${specBits || "&nbsp;"}</p>
        <p class="v-price">${formatRupiah(car.price)}</p>
        <hr class="hr-hair">
        <div class="v-actions catalog-actions">
          <button class="v-compare quick-compare-btn ${inCompare ? "active" : ""}" data-id="${car.id}" type="button">
            <img src="images/icons/${inCompare ? "square-check" : "square"}.svg" alt="">
            ${inCompare ? "Dibandingkan" : "Bandingkan"}
          </button>
          <a class="v-wa" href="https://wa.me/${WA_NUMBER}?text=${waMsg}" target="_blank" rel="noopener">
            <img src="images/icons/message-circle.svg" alt="">
            Chat via WhatsApp
          </a>
          <a href="car-detail.html?id=${car.id}" class="v-detail">Lihat detail ↗</a>
        </div>
      </div>
    `;
    carsGrid.appendChild(card);
  });

  FavStore.bind(carsGrid, "cars.html");
  bindCompareButtons();
  updateCompareTray();
}

/* -------------------------------------------------
   Compare (localStorage, maksimal 2)
-------------------------------------------------- */
function bindCompareButtons() {
  document.querySelectorAll(".quick-compare-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const carId = String(btn.dataset.id);
      let list = JSON.parse(localStorage.getItem("compareList") || "[]");

      if (list.includes(carId)) {
        list = list.filter((id) => id !== carId);
      } else {
        if (list.length >= 2) {
          alert("Bandingkan maksimal 2 mobil. Hapus salah satu untuk menambah yang lain.");
          return;
        }
        list.push(carId);
      }
      localStorage.setItem("compareList", JSON.stringify(list));
      applyFilters(); // re-render untuk sinkron state kartu + tray
    });
  });
}

function updateCompareTray() {
  const list = JSON.parse(localStorage.getItem("compareList") || "[]");
  if (!compareTray) return;

  if (list.length === 0) {
    compareTray.style.display = "none";
    return;
  }

  compareTray.style.display = "flex";
  trayCount.textContent = `${list.length} mobil siap dibandingkan`;
  const names = list
    .map((id) => {
      const c = carsData.find((car) => String(car.id) === id);
      return c ? c.name : null;
    })
    .filter(Boolean);
  trayNames.textContent = names.join(" · ");
}

/* -------------------------------------------------
   Price input: format Rupiah saat mengetik
-------------------------------------------------- */
function attachRupiahMask(input) {
  input.addEventListener("input", () => {
    const num = parseRupiah(input.value);
    input.value = num === null ? "" : formatRupiah(num);
    input.setSelectionRange(input.value.length, input.value.length);
  });
  input.addEventListener("change", applyFilters);
}

/* -------------------------------------------------
   Event listeners
-------------------------------------------------- */
searchInput.addEventListener("input", applyFilters);
sortBy.addEventListener("change", applyFilters);
attachRupiahMask(priceMin);
attachRupiahMask(priceMax);

resetBtn.addEventListener("click", () => {
  searchInput.value = "";
  priceMin.value = "";
  priceMax.value = "";
  sortBy.value = "default";
  brandList.querySelectorAll("input:checked").forEach((cb) => (cb.checked = false));
  typeList.querySelectorAll("input:checked").forEach((cb) => (cb.checked = false));
  applyFilters();
});

/* -------------------------------------------------
   Ambil data dari API
-------------------------------------------------- */
fetch("/api/cars")
  .then((res) => res.json())
  .then((result) => {
    if (result.status !== "success") {
      carsGrid.innerHTML = '<p class="no-results">Gagal mengambil data dari server.</p>';
      return;
    }
    carsData = result.data;

    buildCheckboxOptions(brandList, "brand");
    buildCheckboxOptions(typeList, "type");

    // Overline jumlah mobil (mengikuti Figma "KOLEKSI / 06 MOBIL PILIHAN")
    const overline = document.getElementById("catalogOverline");
    if (overline) {
      overline.textContent = `KOLEKSI / ${String(carsData.length).padStart(2, "0")} MOBIL PILIHAN`;
    }

    // URL params dari homepage: ?brand= / ?type= / ?price=
    const params = new URLSearchParams(window.location.search);
    const urlBrand = params.get("brand");
    const urlType  = params.get("type");
    const urlPrice = params.get("price");

    if (urlBrand) {
      const cb = brandList.querySelector(`input[value="${urlBrand}"]`);
      if (cb) cb.checked = true;
    }
    if (urlType) {
      const cb = typeList.querySelector(`input[value="${urlType}"]`);
      if (cb) cb.checked = true;
    }
    if (urlPrice) applyPricePreset(urlPrice);

    // Muat daftar favorit user dulu (kalau login) agar status hati benar saat render
    FavStore.load().then(applyFilters);
  })
  .catch(() => {
    carsGrid.innerHTML = '<p class="no-results">Gagal terhubung ke server.</p>';
  });


/* Preset harga dari homepage (data-price lama, nilai USD -> set min/max) */
function applyPricePreset(preset) {
  // Nilai disimpan dalam satuan harga mentah DB (lihat catatan seed).
  const map = {
    "under-100k": [null, 100000],
    "100k-250k": [100000, 250000],
    "250k-500k": [250000, 500000],
    "500k-1m": [500000, 1000000],
    "above-1m": [1000000, null],
  };
  const range = map[preset];
  if (!range) return;
  if (range[0] !== null) priceMin.value = formatRupiah(range[0]);
  if (range[1] !== null) priceMax.value = formatRupiah(range[1]);
}
