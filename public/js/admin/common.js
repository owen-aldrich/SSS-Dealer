// =============================================================
// Admin Common — guard akses admin + helper bersama
// Dipakai semua halaman admin (admin*.html)
// =============================================================

// Guard: harus login DAN role admin, kalau tidak -> redirect
(function adminGuard() {
  const token = getToken && getToken();
  if (!token) {
    window.location.href = "/signin.html";
    return;
  }
  fetch("/api/auth/me", { headers: authHeaders() })
    .then((res) => res.json())
    .then((result) => {
      if (!result.logged_in) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/signin.html";
        return;
      }
      if (result.user.role !== "admin") {
        // Bukan admin -> tendang ke akun biasa
        window.location.href = "/account.html";
        return;
      }
      // Tampilkan nama admin di topbar
      const nameEl = document.getElementById("adminName");
      if (nameEl) nameEl.textContent = result.user.fullname;
      document.body.dataset.adminReady = "1";
      document.dispatchEvent(new CustomEvent("admin:ready", { detail: result.user }));
    })
    .catch(() => { window.location.href = "/signin.html"; });
})();

// Format Rupiah bersama
function adminRupiah(v) {
  return "Rp " + Number(v || 0).toLocaleString("id-ID");
}

// Kode unit dari id: SSS-0101, SSS-0102, ...
function unitCode(id) {
  return "SSS-" + String(100 + Number(id)).padStart(4, "0");
}

// Label status mobil (ID)
function carStatusLabel(s) {
  return { available: "Tersedia", reserved: "Dipesan", sold: "Terjual", draft: "Draft" }[s] || s;
}

// Format tanggal pendek Indonesia
function adminDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

// Logout (dipakai tombol Keluar sidebar)
function adminLogout() {
  fetch("/api/auth/logout", { method: "POST", headers: authHeaders() }).finally(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/index.html";
  });
}

// Path gambar mobil (relatif di DB, mis. "images/x.jpg") -> absolut agar benar dari /admin/
function adminImg(p) {
  if (!p) return "";
  return /^(https?:)?\/\//.test(p) || p.startsWith("/") ? p : "/" + p;
}
