// =============================================================
// Admin — Tambah / Edit Mobil (34:24612)
// POST /api/cars (buat) | PUT /api/cars/:id (edit)
// =============================================================

const editId = new URLSearchParams(window.location.search).get("id");
const F = (id) => document.getElementById(id);
const msg = F("formMsg");

function parseRp(str) {
  const d = String(str).replace(/[^\d]/g, "");
  return d ? Number(d) : "";
}
function fmtRp(n) { return n === "" || n == null ? "" : "Rp " + Number(n).toLocaleString("id-ID"); }

// Rupiah mask
F("f_price").addEventListener("input", () => {
  const n = parseRp(F("f_price").value);
  F("f_price").value = n === "" ? "" : fmtRp(n);
});

// ----- Upload foto mobil -----
const dropzone = F("dropzone");
const photoFile = F("photoFile");
const dzEmpty = F("dzEmpty");
const dzPreview = F("dzPreview");
const uploadHint = F("uploadHint");

function showPreview(src) {
  F("imgPreviewImg").src = src;
  dzPreview.style.display = "block";
  dzEmpty.style.display = "none";
}

photoFile.addEventListener("change", () => {
  const file = photoFile.files[0];
  if (!file) return;

  // Preview lokal langsung (instan), lalu unggah ke server
  const localUrl = URL.createObjectURL(file);
  showPreview(localUrl);

  const formData = new FormData();
  formData.append("image", file);

  dropzone.classList.add("uploading");
  uploadHint.textContent = "Mengunggah foto...";
  uploadHint.style.color = "var(--color-muted)";

  fetch("/api/cars/upload-image", {
    method: "POST",
    headers: { Authorization: "Bearer " + getToken() }, // JANGAN set Content-Type, biar boundary multipart otomatis
    body: formData,
  })
    .then((res) => res.json())
    .then((result) => {
      dropzone.classList.remove("uploading");
      if (result.status === "success") {
        F("f_image").value = result.image;       // path server disimpan utk submit
        showPreview("/" + result.image);
        uploadHint.textContent = "Foto siap. Klik untuk mengganti.";
      } else {
        uploadHint.textContent = result.message || "Gagal mengunggah foto.";
        uploadHint.style.color = "var(--color-error)";
      }
    })
    .catch(() => {
      dropzone.classList.remove("uploading");
      uploadHint.textContent = "Gagal terhubung ke server.";
      uploadHint.style.color = "var(--color-error)";
    });
});

// Edit mode: prefill
function initEdit() {
  if (!editId) return;
  F("formTitle").textContent = "Edit Mobil";
  fetch(`/api/cars/${editId}`)
    .then((res) => res.json())
    .then((result) => {
      if (result.status !== "success") { msg.textContent = "Mobil tidak ditemukan."; msg.className = "admin-msg error"; return; }
      const c = result.data;
      F("formDesc").textContent = `Edit unit ${unitCode(c.id)} · ${c.brand} ${c.name}. Lengkapi detail sebelum diterbitkan.`;
      F("f_brand").value = c.brand || "";
      F("f_name").value = c.name || "";
      F("f_year").value = c.year || 2024;
      F("f_price").value = fmtRp(c.price);
      F("f_type").value = c.type || "";
      F("f_performance").value = c.performance || "";
      F("f_transmission").value = c.transmission || "";
      F("f_powertrain").value = c.powertrain || "Petrol";
      F("f_horsepower").value = c.horsepower || "";
      F("f_torque").value = c.torque || "";
      F("f_accel").value = c.accel0100 || "";
      F("f_topspeed").value = c.topSpeed || "";
      F("f_drivetrain").value = c.drivetrain || "";
      F("f_description").value = c.description || "";
      F("f_image").value = c.image || "";
      F("f_status").value = c.status || "available";
      if (c.image) {
        // Foto lama bisa dari images/ (seed) atau uploads/ (upload). Tampilkan apa adanya.
        const src = c.image.startsWith("http") ? c.image : "/" + c.image.replace(/^\//, "");
        showPreview(src);
        uploadHint.textContent = "Foto saat ini. Klik untuk mengganti.";
      }
    });
}

// Submit
F("carForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const saveBtn = F("saveBtn");
  if (saveBtn.disabled) return;

  if (!F("f_image").value.trim()) {
    msg.textContent = "Mohon unggah foto mobil terlebih dahulu.";
    msg.className = "admin-msg error";
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  const payload = {
    brand: F("f_brand").value.trim(),
    name: F("f_name").value.trim(),
    year: F("f_year").value,
    price: parseRp(F("f_price").value),
    type: F("f_type").value.trim(),
    performance: F("f_performance").value.trim(),
    transmission: F("f_transmission").value.trim(),
    powertrain: F("f_powertrain").value,
    drivetrain: F("f_drivetrain").value.trim(),
    horsepower: F("f_horsepower").value,
    torque: F("f_torque").value,
    accel0100: F("f_accel").value.trim(),
    topSpeed: F("f_topspeed").value,
    description: F("f_description").value.trim(),
    image: F("f_image").value.trim(),
    status: F("f_status").value,
  };

  saveBtn.disabled = true;
  saveBtn.textContent = "Menyimpan...";
  msg.textContent = "";
  msg.className = "admin-msg";

  const url = editId ? `/api/cars/${editId}` : "/api/cars";
  const method = editId ? "PUT" : "POST";

  fetch(url, { method, headers: authHeaders(), body: JSON.stringify(payload) })
    .then((res) => res.json())
    .then((result) => {
      if (result.status === "success") {
        msg.textContent = result.message + " Mengalihkan ke daftar...";
        msg.className = "admin-msg success";
        setTimeout(() => { window.location.href = "/admin/"; }, 900);
      } else {
        msg.textContent = result.message || "Gagal menyimpan.";
        msg.className = "admin-msg error";
        saveBtn.disabled = false;
        saveBtn.textContent = "Simpan Perubahan";
      }
    })
    .catch(() => {
      msg.textContent = "Gagal terhubung ke server.";
      msg.className = "admin-msg error";
      saveBtn.disabled = false;
      saveBtn.textContent = "Simpan Perubahan";
    });
});

document.addEventListener("admin:ready", initEdit);
if (document.body.dataset.adminReady === "1") initEdit();
