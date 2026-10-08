/* ==================================================
   Akun Saya — Figma "Akun Saya" (28:236) + Favorit (4:10676)
   Node.js API + JWT. ID + Rupiah.
===================================================== */

let currentUser = null;
const WA_NUMBER = "622150881900";

const token = getToken();
if (!token) window.location.href = "signin.html";

fetch("/api/auth/me", { headers: authHeaders() })
  .then((res) => res.json())
  .then((result) => {
    if (!result.logged_in) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "signin.html";
      return;
    }
    currentUser = result.user;
    localStorage.setItem("user", JSON.stringify(currentUser));

    renderProfileHeader(currentUser);
    fillSettingsForm(currentUser);
    loadFavorites();
    loadTestDrives();
  })
  .catch(() => { window.location.href = "signin.html"; });

function fmtRupiah(v) {
  return "Rp " + Number(v || 0).toLocaleString("id-ID");
}

function renderProfileHeader(user) {
  document.getElementById("profileFullname").textContent = user.fullname;
  document.getElementById("profileEmail").textContent = user.email;
  const roleEl = document.getElementById("profileRole");
  roleEl.textContent = (user.role || "user").toUpperCase();
  if (user.photo) document.getElementById("profilePhoto").src = "/" + user.photo;
}

function fillSettingsForm(user) {
  document.getElementById("fullname").value = user.fullname || "";
  document.getElementById("username").value = user.username || "";
  document.getElementById("age").value = user.age || "";
  document.getElementById("email").value = user.email || "";
  document.getElementById("emailDisplay").textContent = user.email || "";
  document.getElementById("address").value = user.address || "";
}

/* ---------- TABS ---------- */
const tabs = document.querySelectorAll(".account-tab");
tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((t) => t.classList.remove("active"));
    document.querySelectorAll(".account-panel").forEach((p) => p.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById("panel-" + tab.dataset.tab).classList.add("active");
  });
});

/* ---------- FAVORITES (grid .v-card) ---------- */
function loadFavorites() {
  fetch("/api/favorites", { headers: authHeaders() })
    .then((res) => res.json())
    .then((result) => {
      const grid = document.getElementById("favoritesGrid");
      const empty = document.getElementById("favoritesEmpty");
      const controls = document.getElementById("favControls");
      grid.innerHTML = "";

      if (result.status !== "success" || result.data.length === 0) {
        empty.style.display = "block";
        if (controls) controls.style.display = "none";
        return;
      }
      empty.style.display = "none";
      if (controls) controls.style.display = "flex";

      // Semua mobil di tab ini sudah difavoritkan -> hati langsung aktif
      FavStore.ids = new Set(result.data.map((c) => String(c.id)));

      result.data.forEach((car) => {
        const specBits = [
          car.type,
          car.horsepower ? car.horsepower + " PS" : null,
          car.accel0100 ? car.accel0100 + " (0–100)" : null,
        ].filter(Boolean).join(" · ");
        const waMsg = encodeURIComponent(`Halo SSS+Dealer, saya tertarik dengan ${car.brand} ${car.name}.`);

        const cell = document.createElement("div");
        cell.className = "fav-cell";
        cell.innerHTML = `
          <article class="v-card">
            <div class="v-visual">
              <img class="photo" src="${car.image}" alt="${car.brand} ${car.name}" loading="lazy">
              ${FavStore.buttonHtml(car.id)}
              <span class="avail-badge">TERSEDIA</span>
            </div>
            <div class="v-info">
              <p class="brand-year">${car.brand.toUpperCase()} · 2024</p>
              <h3>${car.name}</h3>
              <p class="v-spec">${specBits || "&nbsp;"}</p>
              <p class="v-price">${fmtRupiah(car.price)}</p>
              <hr class="hr-hair">
              <div class="v-actions">
                <a href="car-detail.html?id=${car.id}" class="v-detail">Lihat detail ↗</a>
              </div>
            </div>
          </article>
          <div class="fav-extra">
            <a class="btn btn-outline" href="test-drive.html?id=${car.id}">Pesan test drive <img src="images/icons/arrow-up-right.svg" alt=""></a>
            <a class="btn btn-outline" href="https://wa.me/${WA_NUMBER}?text=${waMsg}" target="_blank" rel="noopener">Chat via WhatsApp <img src="images/icons/arrow-up-right.svg" alt=""></a>
            <button class="remove-fav-btn" data-id="${car.id}"><img src="images/icons/trash.svg" alt="">Hapus dari favorit</button>
          </div>
        `;
        grid.appendChild(cell);
      });

      // Hati di kartu = hapus dari favorit (kartu ikut hilang dari daftar)
      grid.querySelectorAll(".fav-toggle").forEach((heart) => {
        heart.addEventListener("click", (e) => {
          e.preventDefault();
          fetch("/api/favorites/toggle", {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({ car_id: heart.dataset.id }),
          })
            .then((res) => res.json())
            .then(() => loadFavorites())
            .catch(() => alert("Gagal memperbarui favorit."));
        });
      });

      document.querySelectorAll(".remove-fav-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          fetch("/api/favorites/toggle", {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({ car_id: btn.dataset.id }),
          })
            .then((res) => res.json())
            .then(() => loadFavorites());
        });
      });
    });
}

/* ---------- TEST DRIVE (riwayat; endpoint Phase 2) ---------- */
function loadTestDrives() {
  const list = document.getElementById("testDriveList");
  const empty = document.getElementById("testDriveEmpty");
  if (!list) return;

  fetch("/api/test-drive/me", { headers: authHeaders() })
    .then((res) => (res.ok ? res.json() : { status: "error", data: [] }))
    .then((result) => {
      list.innerHTML = "";
      if (result.status !== "success" || !result.data || result.data.length === 0) {
        empty.style.display = "block";
        return;
      }
      empty.style.display = "none";
      result.data.forEach((td) => {
        const date = td.preferred_date
          ? new Date(td.preferred_date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
          : "Fleksibel";
        const row = document.createElement("div");
        row.className = "history-item";
        row.innerHTML = `
          <div class="history-cars">${td.car_brand || ""} ${td.car_name || ""}
            <span style="color:var(--color-muted);"> · ${td.status || "menunggu"}</span>
          </div>
          <div class="history-date">${date} ${td.preferred_time || ""}</div>
        `;
        list.appendChild(row);
      });
    })
    .catch(() => { empty.style.display = "block"; });
}

/* ---------- SETTINGS FORM ---------- */
document.getElementById("settingsForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const msgBox = document.getElementById("settingsMessage");

  const payload = {
    fullname: document.getElementById("fullname").value,
    username: document.getElementById("username").value,
    age: document.getElementById("age").value,
    address: document.getElementById("address").value,
    current_password: document.getElementById("currentPassword").value,
    new_password: document.getElementById("newPassword").value,
  };

  fetch("/api/account", {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  })
    .then((res) => res.json())
    .then((result) => {
      msgBox.textContent = result.message;
      msgBox.className = "form-message " + (result.status === "success" ? "success" : "error");
      if (result.status === "success") {
        document.getElementById("profileFullname").textContent = payload.fullname;
        document.getElementById("currentPassword").value = "";
        document.getElementById("newPassword").value = "";
        const stored = getStoredUser();
        if (stored) {
          stored.fullname = payload.fullname;
          stored.username = payload.username;
          localStorage.setItem("user", JSON.stringify(stored));
        }
      }
    });
});

/* ---------- PHOTO UPLOAD ---------- */
document.getElementById("photoInput").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const formData = new FormData();
  formData.append("photo", file);
  fetch("/api/account/photo", {
    method: "POST",
    headers: { Authorization: "Bearer " + getToken() },
    body: formData,
  })
    .then((res) => res.json())
    .then((result) => {
      if (result.status === "success") {
        document.getElementById("profilePhoto").src = "/" + result.photo + "?t=" + Date.now();
      } else {
        alert(result.message);
      }
    });
});

/* ---------- LOGOUT ---------- */
document.getElementById("logoutBtn").addEventListener("click", () => {
  fetch("/api/auth/logout", { method: "POST", headers: authHeaders() }).finally(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "index.html";
  });
});
