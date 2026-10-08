/* ==================================================
   MAIN SCRIPT LOGIC (index.html)
===================================================== */

document.addEventListener("DOMContentLoaded", () => {

    /* --------------------------------------------------
       Helper: bangun kartu mobil gaya editorial (.v-card)
    -------------------------------------------------- */
    function buildCarCard(car) {
        const formattedPrice = Number(car.price).toLocaleString("id-ID");
        const year = car.year || 2024;
        const specBits = [car.type, car.horsepower ? car.horsepower + " PS" : null, car.accel0100 ? car.accel0100 + " (0–100)" : null]
            .filter(Boolean)
            .join(" · ");

        const article = document.createElement("article");
        article.className = "v-card";
        article.innerHTML = `
            <div class="v-visual">
                <img class="photo" src="${car.image}" alt="${car.brand} ${car.name}" loading="lazy">
                ${FavStore.buttonHtml(car.id)}
                <span class="avail-badge">TERSEDIA</span>
            </div>
            <div class="v-info">
                <p class="brand-year">${car.brand.toUpperCase()} · ${year}</p>
                <h3>${car.name}</h3>
                <p class="v-spec">${specBits || "&nbsp;"}</p>
                <p class="v-price">Rp ${formattedPrice}</p>
                <hr class="hr-hair">
                <div class="v-actions">
                    <span class="v-compare"><img src="images/icons/square.svg" alt="">Bandingkan</span>
                    <a href="car-detail.html?id=${car.id}" class="v-detail">Lihat detail ↗</a>
                </div>
            </div>
        `;
        return article;
    }

    // ── Featured Cars ──────────────────────────────
    const carContainer = document.querySelector(".featured .car-container");

    // Muat daftar favorit dulu supaya hati langsung benar saat kartu dirender
    const favReady = FavStore.load();

    if (carContainer) {
        Promise.all([fetch("/api/cars").then(res => res.json()), favReady])
            .then(([result]) => {
                if (result.status === "success" && result.data.length > 0) {
                    carContainer.innerHTML = "";
                    result.data.slice(0, 3).forEach(car => {
                        carContainer.appendChild(buildCarCard(car));
                    });
                    FavStore.bind(carContainer, "index.html");
                }
            })
            .catch(err => console.error("Gagal memuat featured cars:", err));
    }

    // ── Recently Viewed ────────────────────────────
    const recentlyViewed = JSON.parse(localStorage.getItem("recentlyViewed") || "[]");
    const recentSection  = document.getElementById("recentlyViewedSection");
    const recentGrid     = document.getElementById("recentlyViewedGrid");

    if (recentlyViewed.length > 0 && recentSection && recentGrid) {
        recentSection.style.display = "block";
        favReady.then(() => {
            recentGrid.innerHTML = "";
            recentlyViewed.forEach(car => {
                recentGrid.appendChild(buildCarCard(car));
            });
            FavStore.bind(recentGrid, "index.html");
        });
    }

    // ── FAQ accordion ──────────────────────────────
    document.querySelectorAll(".faq-item .faq-q").forEach(btn => {
        btn.addEventListener("click", () => {
            const item = btn.closest(".faq-item");
            const collapsed = item.classList.toggle("collapsed");
            const icon = btn.querySelector("img");
            if (icon) {
                icon.src = collapsed ? "images/icons/plus.svg" : "images/icons/minus.svg";
            }
        });
    });
});
