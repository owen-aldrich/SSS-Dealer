// =============================================================
// Admin — Daftar Mobil (34:24363). CRUD via /api/cars (admin).
// =============================================================

let allCars = [];
let activeStatus = "all";

const rowsEl = document.getElementById("carsRows");
const emptyEl = document.getElementById("carsEmpty");
const countEl = document.getElementById("carsCount");
const searchEl = document.getElementById("adminSearch");

document.getElementById("adminTimestamp").textContent =
  "Terakhir diperbarui " + new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

function loadCars() {
  fetch("/api/cars")
    .then((res) => res.json())
    .then((result) => {
      if (result.status === "success") {
        allCars = result.data;
        updateChipCounts();
        render();
      }
    })
    .catch(() => { rowsEl.innerHTML = ""; emptyEl.style.display = "block"; emptyEl.textContent = "Gagal memuat data."; });
}

function updateChipCounts() {
  const counts = { all: allCars.length, available: 0, reserved: 0, sold: 0, draft: 0 };
  allCars.forEach((c) => { if (counts[c.status] !== undefined) counts[c.status]++; });
  document.querySelectorAll("#statusChips .chip").forEach((chip) => {
    const s = chip.dataset.status;
    const label = { all: "Semua", available: "Tersedia", reserved: "Dipesan", sold: "Terjual", draft: "Draft" }[s];
    chip.textContent = `${label} (${counts[s] ?? 0})`;
  });
}

function render() {
  const q = (searchEl.value || "").toLowerCase().trim();
  let list = allCars.filter((c) => {
    const matchStatus = activeStatus === "all" || c.status === activeStatus;
    const matchSearch = !q ||
      c.name.toLowerCase().includes(q) ||
      c.brand.toLowerCase().includes(q) ||
      unitCode(c.id).toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  rowsEl.innerHTML = "";
  countEl.textContent = `Menampilkan ${list.length} dari ${allCars.length} mobil`;

  if (list.length === 0) { emptyEl.style.display = "block"; return; }
  emptyEl.style.display = "none";

  list.forEach((car) => {
    const row = document.createElement("div");
    row.className = "t-row";
    row.innerHTML = `
      <div class="cell-car">
        <img src="${adminImg(car.image)}" alt="${car.name}">
        <div>
          <div class="c-name">${car.brand.toUpperCase()} ${car.name}</div>
          <div class="c-code">${unitCode(car.id)}</div>
        </div>
      </div>
      <div class="cell">${adminRupiah(car.price)}</div>
      <div class="cell cell-muted">${car.year || 2024}</div>
      <div class="cell"><span class="status-badge ${car.status}">${carStatusLabel(car.status)}</span></div>
      <div class="cell cell-muted">${adminDate(car.updatedAt)}</div>
      <div class="row-actions">
        <a class="row-action" href="/admin/car-form.html?id=${car.id}"><img src="/images/icons/square-pen.svg" alt="">Edit</a>
        <button class="row-action" data-dup="${car.id}"><img src="/images/icons/copy.svg" alt="">Duplikat</button>
        <button class="row-action danger" data-del="${car.id}"><img src="/images/icons/trash.svg" alt="">Hapus</button>
      </div>
    `;
    rowsEl.appendChild(row);
  });

  bindRowActions();
}

function bindRowActions() {
  rowsEl.querySelectorAll("[data-del]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.del;
      const car = allCars.find((c) => String(c.id) === String(id));
      if (!confirm(`Hapus "${car.brand} ${car.name}" dari koleksi? Tindakan ini tidak dapat dibatalkan.`)) return;
      fetch(`/api/cars/${id}`, { method: "DELETE", headers: authHeaders() })
        .then((res) => res.json())
        .then((r) => { if (r.status === "success") loadCars(); else alert(r.message); })
        .catch(() => alert("Gagal menghapus."));
    });
  });

  rowsEl.querySelectorAll("[data-dup]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.dup;
      const car = allCars.find((c) => String(c.id) === String(id));
      if (!car) return;
      if (!confirm(`Duplikat "${car.brand} ${car.name}" sebagai draft baru?`)) return;
      const copy = { ...car, name: car.name + " (Salinan)", status: "draft" };
      delete copy.id; delete copy.updatedAt;
      fetch("/api/cars", { method: "POST", headers: authHeaders(), body: JSON.stringify(copy) })
        .then((res) => res.json())
        .then((r) => { if (r.status === "success") loadCars(); else alert(r.message); })
        .catch(() => alert("Gagal menduplikat."));
    });
  });
}

// Chip filter
document.querySelectorAll("#statusChips .chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    document.querySelectorAll("#statusChips .chip").forEach((c) => c.classList.remove("active"));
    chip.classList.add("active");
    activeStatus = chip.dataset.status;
    render();
  });
});

searchEl.addEventListener("input", render);

document.addEventListener("admin:ready", loadCars);
// fallback kalau event sudah lewat
if (document.body.dataset.adminReady === "1") loadCars();
