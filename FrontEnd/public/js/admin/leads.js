// =============================================================
// Admin — Kelola Lead (34:25100) + Ubah Lead (42:24, modal)
// GET /api/leads + PUT /api/leads/:id
// =============================================================

let allLeads = [];
let activeStatus = "all";
let modalId = null;

const rowsEl = document.getElementById("leadRows");
const emptyEl = document.getElementById("leadEmpty");
const countEl = document.getElementById("leadCount");
const searchEl = document.getElementById("leadSearch");

const LEAD_STATUS = { new: "Baru", contacted: "Dihubungi", negotiation: "Negosiasi", closing: "Closing" };

// Ubah nomor lokal jadi format internasional WhatsApp: 0812.. -> 62812..
function normalizePhone(raw) {
  if (!raw) return "";
  let digits = String(raw).replace(/[^\d]/g, "");
  if (!digits) return "";
  if (digits.startsWith("0")) digits = "62" + digits.slice(1);
  else if (digits.startsWith("62")) { /* sudah internasional */ }
  else if (digits.startsWith("8")) digits = "62" + digits;
  return digits;
}

function loadLeads() {
  fetch("/api/leads", { headers: authHeaders() })
    .then((res) => res.json())
    .then((result) => {
      if (result.status === "success") {
        allLeads = result.data;
        const c = result.counts || {};
        document.getElementById("statNew").textContent = c.new || 0;
        document.getElementById("statContacted").textContent = c.contacted || 0;
        document.getElementById("statNegotiation").textContent = c.negotiation || 0;
        document.getElementById("statClosing").textContent = c.closing || 0;
        updateChips();
        render();
      } else {
        emptyEl.style.display = "block"; emptyEl.textContent = result.message || "Gagal memuat.";
      }
    })
    .catch(() => { emptyEl.style.display = "block"; emptyEl.textContent = "Gagal terhubung ke server."; });
}

function updateChips() {
  const counts = { all: allLeads.length, new: 0, contacted: 0, negotiation: 0, closing: 0 };
  allLeads.forEach((l) => { if (counts[l.status] !== undefined) counts[l.status]++; });
  document.querySelectorAll("#leadChips .chip").forEach((chip) => {
    const s = chip.dataset.status;
    const label = { all: "Semua", ...LEAD_STATUS }[s];
    chip.textContent = `${label} (${counts[s] ?? 0})`;
  });
}

function render() {
  const q = (searchEl.value || "").toLowerCase().trim();
  const list = allLeads.filter((l) => {
    const ms = activeStatus === "all" || l.status === activeStatus;
    const mq = !q || (l.name || "").toLowerCase().includes(q) ||
      (l.email || "").toLowerCase().includes(q) ||
      (`${l.car_brand || ""} ${l.car_name || ""}`).toLowerCase().includes(q);
    return ms && mq;
  });

  rowsEl.innerHTML = "";
  countEl.textContent = `${list.length} lead`;
  if (list.length === 0) { emptyEl.style.display = "block"; return; }
  emptyEl.style.display = "none";

  list.forEach((l) => {
    const waMsg = encodeURIComponent(`Halo ${l.name}, terima kasih atas minat Anda pada ${l.car_brand || ""} ${l.car_name || ""} di SSS+Dealer.`);
    const waNum = normalizePhone(l.phone);
    const row = document.createElement("div");
    row.className = "t-row";
    row.style.gridTemplateColumns = "1.6fr 1.6fr 1fr 1.2fr 1.4fr";
    row.innerHTML = `
      <div class="cell">
        <div class="c-name" style="color:var(--color-ivory);">${l.name}</div>
        <div class="c-code" style="font-size:11px;color:var(--color-muted);">${l.phone || l.email || "—"}</div>
      </div>
      <div class="cell">${l.car_brand ? l.car_brand + " " + l.car_name : "—"}</div>
      <div class="cell"><span class="status-badge ${l.status}">${LEAD_STATUS[l.status] || l.status}</span></div>
      <div class="cell cell-muted">${l.consultant || "Belum ditugaskan"}</div>
      <div class="td-row-actions">
        ${waNum
          ? `<a class="link-action" href="https://wa.me/${waNum}?text=${waMsg}" target="_blank" rel="noopener">Chat via WhatsApp ↗</a>`
          : `<span class="link-action" style="color:var(--color-muted);cursor:default;">No. HP belum ada</span>`}
        <button class="link-action" data-edit="${l.id}">Ubah Lead</button>
      </div>
    `;
    rowsEl.appendChild(row);
  });

  rowsEl.querySelectorAll("[data-edit]").forEach((b) => b.addEventListener("click", () => openModal(b.dataset.edit)));
}

// ----- Modal Tambah / Ubah Lead -----
const modal = document.getElementById("leadModal");
const mTitle = document.getElementById("leadModalTitle");
const mSub = document.getElementById("leadModalSub");
const mName = document.getElementById("leadModalName");
const mPhone = document.getElementById("leadModalPhone");
const mEmail = document.getElementById("leadModalEmail");
const mCar = document.getElementById("leadModalCar");
const mStatus = document.getElementById("leadModalStatus");
const mConsultant = document.getElementById("leadModalConsultant");
const mNote = document.getElementById("leadModalNote");

// Isi dropdown mobil dari /api/cars
function loadCarOptions() {
  fetch("/api/cars")
    .then((res) => res.json())
    .then((result) => {
      if (result.status !== "success") return;
      result.data.forEach((c) => {
        const opt = document.createElement("option");
        opt.value = c.id;
        opt.textContent = `${c.brand} ${c.name}`;
        mCar.appendChild(opt);
      });
    })
    .catch(() => {});
}

function openModalCreate() {
  modalId = null;
  mTitle.textContent = "Tambah Lead";
  mSub.textContent = "Catat calon pembeli yang menghubungi via WhatsApp.";
  mName.value = "";
  mPhone.value = "";
  mEmail.value = "";
  mCar.value = "";
  mStatus.value = "new";
  mConsultant.value = "";
  mNote.value = "";
  modal.style.display = "flex";
  mName.focus();
}

function openModal(id) {
  const l = allLeads.find((x) => String(x.id) === String(id));
  if (!l) return;
  modalId = id;
  mTitle.textContent = "Ubah Lead";
  mSub.textContent = `Perbarui data ${l.name}.`;
  mName.value = l.name || "";
  mPhone.value = l.phone || "";
  mEmail.value = l.email || "";
  mCar.value = l.car_id || "";
  mStatus.value = l.status;
  mConsultant.value = l.consultant || "";
  mNote.value = l.note || "";
  modal.style.display = "flex";
}

document.getElementById("addLeadBtn").addEventListener("click", openModalCreate);
document.getElementById("leadModalCancel").addEventListener("click", () => { modal.style.display = "none"; });
modal.addEventListener("click", (e) => { if (e.target === modal) modal.style.display = "none"; });

document.getElementById("leadModalSave").addEventListener("click", () => {
  const name = mName.value.trim();
  const phone = mPhone.value.trim();
  if (!name || !phone) {
    alert("Nama dan nomor HP wajib diisi.");
    return;
  }
  const body = {
    name,
    phone,
    email: mEmail.value.trim(),
    car_id: mCar.value || null,
    status: mStatus.value,
    consultant: mConsultant.value.trim(),
    note: mNote.value.trim(),
  };

  const url = modalId ? `/api/leads/${modalId}` : "/api/leads";
  const method = modalId ? "PUT" : "POST";

  fetch(url, { method, headers: authHeaders(), body: JSON.stringify(body) })
    .then((res) => res.json())
    .then((r) => { if (r.status === "success") { modal.style.display = "none"; loadLeads(); } else alert(r.message); })
    .catch(() => alert("Gagal menyimpan lead."));
});

// Filters
document.querySelectorAll("#leadChips .chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    document.querySelectorAll("#leadChips .chip").forEach((c) => c.classList.remove("active"));
    chip.classList.add("active");
    activeStatus = chip.dataset.status;
    render();
  });
});
searchEl.addEventListener("input", render);

function initLeads() { loadLeads(); loadCarOptions(); }
document.addEventListener("admin:ready", initLeads);
if (document.body.dataset.adminReady === "1") initLeads();
