// =============================================================
// Role Picker (34:25546) — arahkan ke pengalaman sesuai peran.
// Peran ditentukan DB (users.role), bukan pilihan bebas.
// =============================================================

let currentRole = "user";

const token = getToken();
if (!token) {
  window.location.href = "signin.html";
}

fetch("/api/auth/me", { headers: authHeaders() })
  .then((res) => res.json())
  .then((result) => {
    if (!result.logged_in) {
      window.location.href = "signin.html";
      return;
    }
    currentRole = result.user.role || "user";
  })
  .catch(() => { window.location.href = "signin.html"; });

document.getElementById("asBuyer").addEventListener("click", () => {
  window.location.href = "account.html";
});

document.getElementById("asAdmin").addEventListener("click", () => {
  if (currentRole === "admin") {
    window.location.href = "/admin/";
  } else {
    document.getElementById("roleNote").textContent =
      "Akun Anda belum memiliki akses administrator. Hubungi pengelola untuk mengaktifkan.";
  }
});
