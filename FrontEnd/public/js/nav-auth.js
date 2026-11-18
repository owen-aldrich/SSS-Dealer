/* ==================================================
   NAV AUTH — tampilkan nama user di navbar
   Pakai localStorage (JWT) — tidak perlu fetch ke server
===================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const accountLink = document.querySelector(".nav-account-link");
  if (!accountLink) return;

  const user = getStoredUser();

  // Simpan teks ikon (mis. <img>) kalau ada, lalu set label
  const icon = accountLink.querySelector("img");
  const setLabel = (text, href) => {
    accountLink.href = href;
    // Pertahankan ikon bila tombol pakai gaya .btn (editorial nav)
    if (icon) {
      accountLink.innerHTML = "";
      accountLink.appendChild(icon);
      accountLink.append(" " + text);
    } else {
      accountLink.textContent = text;
    }
  };

  if (user) {
    const firstName = (user.fullname || "Akun").split(" ")[0];
    if (user.role === "admin") {
      setLabel(firstName + " (Admin)", "/admin/");
    } else {
      setLabel(firstName, "account.html");
    }
  } else {
    setLabel("Akun", "signin.html");
  }
});

/* --------------------------------------------------
   Helper global: ambil user dari localStorage
   Dipakai oleh file JS lain juga
-------------------------------------------------- */
function getStoredUser() {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/* --------------------------------------------------
   Helper global: ambil token JWT dari localStorage
-------------------------------------------------- */
function getToken() {
  return localStorage.getItem("token") || null;
}

/* --------------------------------------------------
   Helper global: buat headers dengan Authorization
-------------------------------------------------- */
function authHeaders(extra = {}) {
  const token = getToken();
  const headers = { "Content-Type": "application/json", ...extra };
  if (token) headers["Authorization"] = "Bearer " + token;
  return headers;
}

/* --------------------------------------------------
   Helper global: cek apakah user sudah login
   (cek token di localStorage, tidak perlu fetch)
-------------------------------------------------- */
function isLoggedIn() {
  return !!getToken();
}
