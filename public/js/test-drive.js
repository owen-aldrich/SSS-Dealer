// =============================================================
// Pesan Test Drive — Figma 4:10819 (form) + 4:10969 (konfirmasi)
// POST /api/test-drive. ID + Rupiah. Form & confirm dalam 1 halaman.
// =============================================================

// Guard: wajib login
if (typeof isLoggedIn === "function" && !isLoggedIn()) {
  window.location.href = "signin.html?redirect=" + encodeURIComponent(window.location.href);
}

const params = new URLSearchParams(window.location.search);
const preselectId = params.get("id");

let carsData = [];
let selectedTime = "15.00";

const SHOWROOMS = {
  "SSS+Dealer Jakarta Selatan": "Jl. Sultan Iskandar Muda No. 18, Kebayoran Lama, Jakarta Selatan 12240",
  "SSS+Dealer BSD": "BSD Green Office Park, Tangerang Selatan 15345",
  "SSS+Dealer Surabaya": "Jl. Mayjend Sungkono No. 89, Surabaya 60256",
};

const el = (id) => document.getElementById(id);

function fmtRupiah(v) { return "Rp " + Number(v || 0).toLocaleString("id-ID"); }

function fmtDateID(value) {
  if (!value) return "—";
  const d = new Date(value + "T00:00:00");
  return d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function timeRange(slot) {
  // "15.00" -> "15.00–16.00 WIB"
  const [h, m] = slot.split(".").map(Number);
  const endH = (h + 1).toString().padStart(2, "0");
  return `${slot}–${endH}.${String(m).padStart(2, "0")} WIB`;
}

/* ---------- Load cars for dropdown ---------- */
fetch("/api/cars")
  .then((res) => res.json())
  .then((result) => {
    if (result.status !== "success") return;
    carsData = result.data;

    const sel = el("tdCar");
    sel.innerHTML = "";
    carsData.forEach((car) => {
      const opt = document.createElement("option");
      opt.value = car.id;
      opt.textContent = `${car.brand} ${car.name} · 2024`;
      sel.appendChild(opt);
    });

    if (preselectId && carsData.some((c) => String(c.id) === String(preselectId))) {
      sel.value = preselectId;
    }
    updateSummary();
    // Fetch booked slots setelah cars loaded & tanggal default sudah diset
    refreshBookedSlots();
  })
  .catch(() => {});

/* ---------- Prefill user ---------- */
(function prefillUser() {
  const user = typeof getStoredUser === "function" ? getStoredUser() : null;
  if (user) {
    if (user.fullname) el("tdName").value = user.fullname;
    if (user.email) el("tdEmail").value = user.email;
  }
})();

/* ---------- Default date = besok ---------- */
(function defaultDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  el("tdDate").value = d.toISOString().slice(0, 10);
})();

/* ---------- Summary live update ---------- */
function currentCar() {
  return carsData.find((c) => String(c.id) === String(el("tdCar").value));
}

function updateSummary() {
  const car = currentCar();
  if (car) {
    el("sumPhoto").src = car.image;
    el("sumName").textContent = car.name;
    el("sumMeta").textContent = `${car.brand} · 2024`;
    el("sumPrice").textContent = fmtRupiah(car.price);
  }
  el("sumDate").textContent = fmtDateID(el("tdDate").value);
  el("sumTime").textContent = timeRange(selectedTime);
  el("sumShowroom").textContent = el("tdShowroom").value;
}

el("tdCar").addEventListener("change", updateSummary);
el("tdDate").addEventListener("change", updateSummary);
el("tdShowroom").addEventListener("change", () => {
  el("tdAddress").textContent = SHOWROOMS[el("tdShowroom").value] || "";
  updateSummary();
});

/* ---------- Time slots ---------- */
el("tdSlots").querySelectorAll(".td-slot").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (btn.disabled) return;
    el("tdSlots").querySelectorAll(".td-slot").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    selectedTime = btn.dataset.time;
    updateSummary();
  });
});

/* ---------- Fetch booked slots & disable tombol ---------- */
async function refreshBookedSlots() {
  const carId = el("tdCar").value;
  const date  = el("tdDate").value;
  if (!carId || !date) return;

  try {
    const res    = await fetch(`/api/test-drive/booked-slots?car_id=${carId}&date=${date}`);
    const result = await res.json();
    const booked = result.booked || [];

    el("tdSlots").querySelectorAll(".td-slot").forEach((btn) => {
      const time    = btn.dataset.time;
      const isBooked = booked.includes(time);
      btn.disabled  = isBooked;
      btn.title     = isBooked ? "Slot ini sudah dipesan" : "";

      // Kalau slot aktif sekarang ternyata sudah terbooked, reset ke slot pertama yang tersedia
      if (isBooked && btn.classList.contains("active")) {
        btn.classList.remove("active");
        const firstAvailable = el("tdSlots").querySelector(".td-slot:not([disabled])");
        if (firstAvailable) {
          firstAvailable.classList.add("active");
          selectedTime = firstAvailable.dataset.time;
          updateSummary();
        }
      }
    });
  } catch (_) {
    // Gagal fetch booked slots — biarkan semua slot aktif
  }
}

el("tdCar").addEventListener("change", refreshBookedSlots);
el("tdDate").addEventListener("change", refreshBookedSlots);

// Fetch saat halaman pertama dimuat — sudah dipindah ke dalam callback fetch cars di atas

/* ---------- Submit ---------- */
el("testDriveForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const msg = el("testDriveMessage");
  const submitBtn = el("tdSubmit");

  if (!el("tdAgree").checked) {
    msg.textContent = "Mohon setujui kebijakan privasi untuk melanjutkan.";
    msg.className = "form-message error";
    return;
  }
  if (submitBtn.disabled) return;
  submitBtn.disabled = true;
  msg.textContent = "";
  msg.className = "form-message";

  const car = currentCar();
  const payload = {
    car_id: el("tdCar").value,
    name: el("tdName").value,
    email: el("tdEmail").value,
    phone: el("tdPhone").value,
    preferred_date: el("tdDate").value,
    preferred_time: selectedTime,
    message: el("tdMessage").value,
  };

  const headers = (typeof isLoggedIn === "function" && isLoggedIn())
    ? authHeaders()
    : { "Content-Type": "application/json" };

  fetch("/api/test-drive", { method: "POST", headers, body: JSON.stringify(payload) })
    .then((res) => res.json())
    .then((result) => {
      if (result.status === "success") {
        showConfirmation(car, payload);
      } else {
        msg.textContent = result.message || "Gagal menyimpan pemesanan.";
        msg.className = "form-message error";
        submitBtn.disabled = false;
      }
    })
    .catch(() => {
      msg.textContent = "Gagal terhubung ke server. Coba lagi.";
      msg.className = "form-message error";
      submitBtn.disabled = false;
    });
});

/* ---------- Confirmation view ---------- */
function showConfirmation(car, payload) {
  const code = "SSS-TD-" + payload.preferred_date.replace(/-/g, "").slice(2) + "-" + Math.floor(100 + Math.random() * 900);
  el("confirmCode").textContent = `PEMESANAN BERHASIL · ${code}`;
  el("confirmDesc").textContent =
    `Terima kasih, ${payload.name.split(" ")[0]}. Detail pemesanan telah dikirim ke ${payload.email} dan WhatsApp ${payload.phone}.`;

  if (car) {
    el("ccPhoto").src = car.image;
    el("ccBrand").textContent = `${car.brand.toUpperCase()} · 2024`;
    el("ccName").textContent = car.name;
    el("ccMeta").textContent = [car.type, car.horsepower ? car.horsepower + " PS" : null, car.transmission].filter(Boolean).join(" · ");
    el("ccPrice").textContent = fmtRupiah(car.price);
    el("ccDetailLink").href = `car-detail.html?id=${car.id}`;
  }
  el("ccDate").textContent = fmtDateID(payload.preferred_date);
  el("ccTime").textContent = timeRange(payload.preferred_time);
  el("ccPerson").textContent = payload.name;
  el("ccShowroom").textContent = el("tdShowroom").value + " · " + (SHOWROOMS[el("tdShowroom").value] || "");

  el("bookingView").style.display = "none";
  el("confirmView").style.display = "flex";
  window.scrollTo({ top: 0, behavior: "smooth" });
}
