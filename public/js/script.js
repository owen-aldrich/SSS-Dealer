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
        const compareList = JSON.parse(localStorage.getItem("compareList") || "[]").map(String);
        const inCompare = compareList.includes(String(car.id));
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
                    <button class="v-compare quick-compare-btn${inCompare ? " active" : ""}" data-id="${car.id}" type="button">
                        <img src="images/icons/${inCompare ? "square-check" : "square"}.svg" alt="">
                        ${inCompare ? "Dibandingkan" : "Bandingkan"}
                    </button>
                    <a href="car-detail.html?id=${car.id}" class="v-detail">Lihat detail ↗</a>
                </div>
            </div>
        `;
        return article;
    }

    /* --------------------------------------------------
       Perbandingan dari kartu home (maksimal 2 mobil)
    -------------------------------------------------- */
    function bindCompareButtons(container) {
        if (!container || container.dataset.compareBound === "true") return;
        container.dataset.compareBound = "true";

        container.addEventListener("click", (event) => {
            const button = event.target.closest(".quick-compare-btn");
            if (!button || !container.contains(button)) return;

            event.preventDefault();
            event.stopPropagation();

            const carId = String(button.dataset.id);
            let list = JSON.parse(localStorage.getItem("compareList") || "[]").map(String);

            if (list.includes(carId)) {
                list = list.filter(id => id !== carId);
            } else {
                if (list.length >= 2) {
                    alert("Bandingkan maksimal 2 mobil. Hapus salah satu untuk menambah yang lain.");
                    return;
                }
                list.push(carId);
            }

            localStorage.setItem("compareList", JSON.stringify(list));
            const selected = list.includes(carId);
            button.classList.toggle("active", selected);
            button.querySelector("img").src = `images/icons/${selected ? "square-check" : "square"}.svg`;
            button.lastChild.textContent = selected ? " Dibandingkan" : " Bandingkan";
        });
    }

    // ── Featured Cars ──────────────────────────────
    const carContainer = document.querySelector(".featured .car-container");

    // Muat daftar favorit dulu supaya hati langsung benar saat kartu dirender
    const favReady = FavStore.load();

    if (carContainer) {
        bindCompareButtons(carContainer);
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
        bindCompareButtons(recentGrid);
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
