// =============================================================
// Favorit — modul bersama (beranda, koleksi, akun, detail)
// Tombol hati: klik = tambah/hapus favorit, tampilan berubah
// (hati terisi di lingkaran emas saat aktif).
// Butuh nav-auth.js (isLoggedIn, authHeaders) sudah dimuat.
// =============================================================

// Ikon hati inline (bukan <img>) supaya bisa diisi warna saat aktif
const HEART_SVG =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>';

const FavStore = {
  ids: new Set(), // id mobil yang sudah difavoritkan user login

  // Ambil daftar favorit user (kalau login) agar status hati benar saat render
  load() {
    if (typeof isLoggedIn !== "function" || !isLoggedIn()) return Promise.resolve();
    return fetch("/api/favorites", { headers: authHeaders() })
      .then((res) => res.json())
      .then((result) => {
        if (result.status === "success" && Array.isArray(result.data)) {
          this.ids = new Set(result.data.map((c) => String(c.id)));
        }
      })
      .catch(() => {});
  },

  has(carId) {
    return this.ids.has(String(carId));
  },

  // HTML tombol hati untuk satu mobil
  buttonHtml(carId) {
    const on = this.has(carId);
    return `<button type="button" class="fav-badge fav-toggle ${on ? "active" : ""}" data-id="${carId}"
              aria-pressed="${on}" title="${on ? "Hapus dari favorit" : "Tambah ke favorit"}">${HEART_SVG}</button>`;
  },

  applyState(btn, on) {
    btn.classList.toggle("active", on);
    btn.setAttribute("aria-pressed", String(on));
    btn.title = on ? "Hapus dari favorit" : "Tambah ke favorit";
  },

  // Samakan semua tombol hati untuk mobil yang sama di halaman
  refresh(carId) {
    const on = this.has(carId);
    document
      .querySelectorAll(`.fav-toggle[data-id="${carId}"]`)
      .forEach((b) => this.applyState(b, on));
  },

  // Pasang klik ke semua .fav-toggle di dalam root
  bind(root, redirectTo) {
    root.querySelectorAll(".fav-toggle").forEach((btn) => {
      if (btn.dataset.bound) return;
      btn.dataset.bound = "1";

      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const carId = String(btn.dataset.id);

        // Belum login -> ke halaman masuk, lalu balik ke halaman ini
        if (typeof isLoggedIn !== "function" || !isLoggedIn()) {
          const back = redirectTo || (location.pathname.split("/").pop() || "index.html") + location.search;
          sessionStorage.setItem("redirectAfterLogin", back);
          window.location.href = "signin.html";
          return;
        }

        btn.disabled = true;
        fetch("/api/favorites/toggle", {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({ car_id: carId }),
        })
          .then((res) => {
            // Token kedaluwarsa -> minta login ulang
            if (res.status === 401) {
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              sessionStorage.setItem("redirectAfterLogin", redirectTo || location.pathname.split("/").pop() + location.search);
              window.location.href = "signin.html";
              throw new Error("unauthorized");
            }
            return res.json();
          })
          .then((result) => {
            if (result.status !== "success") {
              alert(result.message || "Gagal memperbarui favorit.");
              return;
            }
            if (result.favorited) this.ids.add(carId);
            else this.ids.delete(carId);
            this.refresh(carId);
          })
          .catch((err) => {
            if (err.message !== "unauthorized") alert("Gagal terhubung ke server.");
          })
          .finally(() => {
            btn.disabled = false;
          });
      });
    });
  },
};
