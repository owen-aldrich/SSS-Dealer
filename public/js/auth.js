/* ==================================================
   AUTH LOGIC (Sign Up & Sign In)
   Backend: Node.js API + JWT
===================================================== */

function showMessage(el, text, type) {
  el.textContent = text;
  el.className = "form-message " + type;
}

// ---------- SIGN UP ----------
const signupForm = document.getElementById("signupForm");

if (signupForm) {
  signupForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const msgBox = document.getElementById("formMessage");
    const submitBtn = signupForm.querySelector(".auth-submit");

    const payload = {
      fullname:         document.getElementById("fullname").value,
      email:            document.getElementById("email").value,
      username:         document.getElementById("username").value,
      password:         document.getElementById("password").value,
      confirm_password: document.getElementById("confirmPassword").value,
      age:              document.getElementById("age").value,
      address:          document.getElementById("address").value,
    };

    submitBtn.disabled = true;
    submitBtn.textContent = "MEMPROSES...";

    fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((result) => {
        submitBtn.disabled = false;
        submitBtn.textContent = "DAFTAR SEKARANG";

        if (result.status === "success") {
          showMessage(msgBox, result.message, "success");
          setTimeout(() => {
            window.location.href = "signin.html";
          }, 1200);
        } else {
          showMessage(msgBox, result.message, "error");
        }
      })
      .catch(() => {
        submitBtn.disabled = false;
        submitBtn.textContent = "DAFTAR SEKARANG";
        showMessage(msgBox, "Gagal terhubung ke server.", "error");
      });
  });
}

// ---------- SIGN IN ----------
const signinForm = document.getElementById("signinForm");

if (signinForm) {
  signinForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const msgBox = document.getElementById("formMessage");
    const submitBtn = signinForm.querySelector(".auth-submit");

    const payload = {
      identifier: document.getElementById("identifier").value,
      password:   document.getElementById("password").value,
    };

    submitBtn.disabled = true;
    submitBtn.textContent = "MEMPROSES...";

    fetch("/api/auth/signin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((result) => {
        submitBtn.disabled = false;
        submitBtn.textContent = "MASUK";

        if (result.status === "success") {
          // Simpan JWT dan data user ke localStorage
          localStorage.setItem("token", result.token);
          localStorage.setItem("user", JSON.stringify(result.user));

          showMessage(msgBox, result.message, "success");

          const saved = sessionStorage.getItem("redirectAfterLogin");
          sessionStorage.removeItem("redirectAfterLogin");
          // Admin tanpa tujuan khusus -> dashboard admin. User -> akun.
          const redirectTo = saved
            || (result.user && result.user.role === "admin" ? "/admin/" : "account.html");

          setTimeout(() => {
            window.location.href = redirectTo;
          }, 800);
        } else {
          showMessage(msgBox, result.message, "error");
        }
      })
      .catch(() => {
        submitBtn.disabled = false;
        submitBtn.textContent = "MASUK";
        showMessage(msgBox, "Gagal terhubung ke server.", "error");
      });
  });
}
