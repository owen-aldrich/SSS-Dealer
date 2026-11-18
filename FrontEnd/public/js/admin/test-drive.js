// =============================================================
// Admin — Kelola Test Drive (34:24811)
// GET /api/test-drive (list) + PATCH /api/test-drive/:id (status/jadwal)
// =============================================================

let allTD = [];
let activeStatus = "all";

const rowsEl = document.getElementById("tdRows");
const emptyEl = document.getElementById("tdEmpty");
const countEl = document.getElementById("tdCount");
const searchEl = document.getElementById("tdSearch");

const TD_STATUS = { pending: "Menunggu", approved: "Disetujui", rejected: "Ditolak" };

function tdCode(td) {
  const d = td.preferred_date ? new Date(td.preferred_date) : new Date(td.created_at);
  const ymd = d.toISOString().slice(2, 10).replace(/-/g, "");
  return "SSS-TD-" + ymd + "-" + String(td.id).padStart(3, "0");
}

function loadTD() {
  fetch("/api/test-drive", { headers: authHeaders() })
    .then((res) => res.json())
    .then((result) => {
      if (result.status === "success") { allTD = result.data; updateChips(); render(); }
      else { emptyEl.style.display = "block"; emptyEl.textContent = result.message || "Gagal memuat."; }
    })
    .catch(() => { emptyEl.style.display = "block"; emptyEl.textContent = "Gagal terhubung ke server."; });
}

function updateChips() {
  const counts = { all: allTD.length, pending: 0, approved: 0, rejected: 0 };
  allTD.forEach((t) => { if (counts[t.status] !== undefined) counts[t.status]++; });
  document.querySelectorAll("#tdChips .chip").forEach((chip) => {
    const s = chip.dataset.status;
    const label = { all: "Semua", pending: "Menunggu", approved: "Disetujui", rejected: "Ditolak" }[s];
    chip.textContent = `${label} (${counts[s] ?? 0})`;
  });
}

function render() {
  const q = (searchEl.value || "").toLowerCase().trim();
  const list = allTD.filter((t) => {
    const ms = activeStatus === "all" || t.status === activeStatus;
    const mq = !q || (t.name || "").toLowerCase().includes(q) ||
      (`${t.car_brand} ${t.car_name}`).toLowerCase().includes(q) ||
      tdCode(t).toLowerCase().includes(q);
    return ms && mq;
  });

  rowsEl.innerHTML = "";
  countEl.textContent = `${list.length} permintaan`;
  if (list.length === 0) { emptyEl.style.display = "block"; return; }
  emptyEl.style.display = "none";

  list.forEach((t) => {
    const sched = (t.preferred_date ? adminDate(t.preferred_date) : "Fleksibel") + " · " + (t.preferred_time || "—");
    let actions;
    if (t.status === "pending") {
      actions = `<div class="act-inline">
           <button class="link-action" data-approve="${t.id}">Terima</button>
           <button class="link-action" data-reject="${t.id}" style="color:var(--color-error);">Tolak</button>
         </div>`;
    } else if (t.status === "approved") {
      actions = `<button class="link-action" data-reject="${t.id}" style="color:var(--color-error);">Tolak</button>`;
    } else { // rejected
      actions = `<button class="link-action" data-approve="${t.id}">Terima</button>`;
    }

    const row = document.createElement("div");
    row.className = "t-row";
    row.style.gridTemplateColumns = "1.6fr 1.6fr 1.2fr 1fr 1.4fr";
    row.innerHTML = `
      <div class="cell">
        <div class="c-name" style="color:var(--color-ivory);">${t.name || "—"}</div>
        <div class="c-code" style="font-size:11px;color:var(--color-muted);">${tdCode(t)}</div>
      </div>
      <div class="cell">${t.car_brand || ""} ${t.car_name || ""}</div>
      <div class="cell cell-muted">${sched}</div>
      <div class="cell"><span class="status-badge ${t.status}">${TD_STATUS[t.status] || t.status}</span></div>
      <div class="td-row-actions">${actions}</div>
    `;
    rowsEl.appendChild(row);
  });

  bindActions();
}

function patchTD(id, body, done) {
  fetch(`/api/test-drive/${id}`, { method: "PATCH", headers: authHeaders(), body: JSON.stringify(body) })
    .then((res) => res.json())
    .then((r) => { if (r.status === "success") { loadTD(); done && done(); } else alert(r.message); })
    .catch(() => alert("Gagal memperbarui."));
}

function bindActions() {
  rowsEl.querySelectorAll("[data-approve]").forEach((b) => b.addEventListener("click", () => patchTD(b.dataset.approve, { status: "approved" })));
  rowsEl.querySelectorAll("[data-reject]").forEach((b) => b.addEventListener("click", () => patchTD(b.dataset.reject, { status: "rejected" })));
}

// Filters
document.querySelectorAll("#tdChips .chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    document.querySelectorAll("#tdChips .chip").forEach((c) => c.classList.remove("active"));
    chip.classList.add("active");
    activeStatus = chip.dataset.status;
    render();
  });
});
searchEl.addEventListener("input", render);

document.addEventListener("admin:ready", loadTD);
if (document.body.dataset.adminReady === "1") loadTD();
