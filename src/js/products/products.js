document.addEventListener("DOMContentLoaded", () => {
  const e = document.createElement("div");
  function t(t, n = "error") {
    const a = document.createElement("div");
    Object.assign(a.style, {
      padding: "12px 20px",
      marginBottom: "40%",
      borderRadius: "4px",
      color: "#fff",
      backgroundColor: "error" === n ? "#dc3545" : "#28a745",
      boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
      opacity: "0",
      transition: "opacity 0.3s ease-in-out",
    }),
      (a.textContent = t),
      e.appendChild(a),
      requestAnimationFrame(() => {
        a.style.opacity = "1";
      }),
      setTimeout(() => {
        (a.style.opacity = "0"), setTimeout(() => a.remove(), 300);
      }, 3e3);
  }
  async function n() {
    return !!navigator.onLine || (t("No internet connection"), !1);
  }
  async function a() {
    (await n()) &&
      (await (async function (e) {
        try {
          const n = performance.now();
          return (
            await fetch(e, {
              mode: "no-cors",
              cache: "no-store",
              signal: AbortSignal.timeout(4e3),
            }),
            !(performance.now() - n > 4e3 && (t("API response too slow"), 1))
          );
        } catch {
          return !1;
        }
      })(
        "https://script.google.com/macros/s/AKfycbzWIlg4U6L71j2jIOxt0Jh6EKvUSDbvrKf7F4AtsbLzY5_YZXjCj_nJ-0wMOjkpHY-G/exec"
      ));
  }
  Object.assign(e.style, {
    position: "fixed",
    top: "40%",
    right: "20px",
    zIndex: "1000",
  }),
    document.body.appendChild(e),
    window.addEventListener("online", () => t("Back online", "success")),
    window.addEventListener("offline", () => t("Lost internet connection"));
  let s = 0;
  setInterval(function () {
    const e = Date.now();
    e - s > 5e4 && ((s = e), a());
  }, 1e4);
  const i = window.fetch;
  window.fetch = async (...e) => {
    if (!(await n()))
      return (
        t("No network connection"),
        Promise.reject(new Error("No network connection"))
      );
    const a = performance.now();
    try {
      const n = await i(...e);
      return performance.now() - a > 9e3
        ? (t("API call too slow"),
          Promise.reject(new Error("API call too slow")))
        : n;
    } catch (e) {
      throw e;
    }
  };
  const o = document.getElementById("productsContainer"),
    r = document.getElementById("go-to-dashboard"),
    c = document.getElementById("dashboard-overlay"),
    d = document.getElementById("dashboard-content"),
    l = document.getElementById("checkout-final"),
    u = document.getElementById("modify-cart"),
    m = document.getElementById("close-overlay"),
    p = document.getElementById("expand-icon");
  let f = JSON.parse(sessionStorage.getItem("cart") || "[]"),
    g = [],
    h = [],
    v = "",
    b = "",
    y = [],
    L = [],
    w = [];
  const E = 10,
    x = ["#5C4033"];
  function I() {
    const e = [...new Set(g.map((e) => e.brand))].sort(),
      t = document.getElementById("brand-filters");
    e.forEach((e) => {
      const n = document.createElement("label");
      (n.innerHTML = `<input type="checkbox" value="${e}"> ${e}`),
        t.appendChild(n),
        n.querySelector("input").addEventListener("change", k);
    });
    const n = [...new Set(g.flatMap((e) => e.quantities))].sort(
        (e, t) => e - t
      ),
      a = document.getElementById("quantity-filters");
    n.forEach((e) => {
      const t = document.createElement("label");
      (t.innerHTML = `<input type="checkbox" value="${e}"> ${e} kg`),
        a.appendChild(t),
        t.querySelector("input").addEventListener("change", k);
    });
    const s = [
        { min: 0, max: 500, label: "Under ₹500" },
        { min: 500, max: 1e3, label: "₹500 - ₹1000" },
        { min: 1e3, max: 1200, label: "₹1000 - ₹1200" },
        { min: 1200, max: 1500, label: "₹1200 - ₹1500" },
        { min: 1500, max: 1 / 0, label: "Over ₹1500" },
      ],
      i = document.getElementById("price-range-filters");
    s.forEach((e, t) => {
      const n = document.createElement("label");
      (n.innerHTML = `<input type="checkbox" value="${t}"> ${e.label}`),
        i.appendChild(n),
        n.querySelector("input").addEventListener("change", k);
    });
  }
  function k(e) {
    const t = e.target;
    if ("checkbox" === t.type) {
      const e = t.parentNode.parentNode.id;
      if ("brand-filters" === e)
        t.checked ? y.push(t.value) : (y = y.filter((e) => e !== t.value));
      else if ("quantity-filters" === e) {
        const e = parseInt(t.value);
        t.checked ? L.push(e) : (L = L.filter((t) => t !== e));
      } else if ("price-range-filters" === e) {
        const e = parseInt(t.value),
          n = {
            min: parseFloat([0, 500, 1e3, 1200, 1500][e]),
            max: parseFloat([500, 1e3, 1200, 1500, 1 / 0][e]),
          };
        t.checked
          ? w.push(n)
          : (w = w.filter((e) => e.min !== n.min || e.max !== n.max));
      }
      B(), S();
    }
  }
  function S() {
    const e = document.getElementById("filter-dot"),
      t = y.length > 0 || L.length > 0 || w.length > 0;
    e.classList.toggle("hidden", !t);
  }
  function $() {
    const e = document.getElementById("filter-panel");
    "translateX(0px)" === e.style.transform
      ? ((e.style.transform = "translateX(100%)"), (e.style.opacity = "0"))
      : ((e.style.transform = "translateX(0px)"), (e.style.opacity = "1"));
  }
  function T() {
    const e = document.getElementById("type-filter");
    [...new Set(g.map((e) => e.type))].sort().forEach((t) => {
      const n = document.createElement("option");
      (n.value = t), (n.textContent = t), e?.appendChild(n);
    });
  }
  function B() {
    (h = g.filter((e) => {
      const t =
          !v ||
          ["name", "brand", "type"].some((t) =>
            e[t]?.toLowerCase().includes(v)
          ),
        n = !b || e.type === b,
        a = !y.length || y.includes(e.brand);
      return t && n && a;
    })),
      (function () {
        let e = 0;
        h.forEach((t) => {
          if ("Active" !== t.status || !t.quantities.length) e += 1;
          else {
            let n = t.quantities;
            L.length && (n = n.filter((e) => L.includes(e))),
              n.forEach((n) => {
                const a = n * t.pricePerKg;
                (0 === w.length ||
                  w.some(
                    (e) => a >= e.min && (e.max === 1 / 0 || a <= e.max)
                  )) &&
                  (e += 1);
              });
          }
        }),
          (document.getElementById(
            "filtered-count"
          ).textContent = `${e} result${1 !== e ? "s" : ""}`);
      })(),
      (function () {
        const e = document.createDocumentFragment();
        if (0 === h.length && g.length)
          return void (o.innerHTML =
            '<p class="Error"><i class="fa-regular fa-face-sad-tear"></i>No products found.</p>');
        (function (e) {
          for (let t = e.length - 1; t > 0; t--) {
            const n = Math.floor(Math.random() * (t + 1));
            [e[t], e[n]] = [e[n], e[t]];
          }
          return e;
        })([...h]).forEach((t) => {
          if ("Active" !== t.status || !t.quantities.length) {
            const n = q(t);
            n && e.appendChild(n);
          } else {
            let n = t.quantities;
            L.length && (n = n.filter((e) => L.includes(e))),
              n.forEach((n) => {
                const a = n * t.pricePerKg;
                if (
                  0 === w.length ||
                  w.some((e) => a >= e.min && (e.max === 1 / 0 || a <= e.max))
                ) {
                  const a = q(t, n);
                  a && e.appendChild(a);
                }
              });
          }
        }),
          (o.innerHTML = ""),
          o.appendChild(e);
      })();
  }
  function M() {
    o.innerHTML = "";
  }
  function C(e = "Something went wrong. Please try again.") {
    M(),
      (o.innerHTML = `\n      <p class="Error">\n        <i class="fa-regular fa-face-sad-tear"></i> ${e}\n        <button id="retry-btn" class="retry-btn">Retry</button>\n      </p>\n    `),
      document.getElementById("retry-btn")?.addEventListener("click", N);
  }
  function N() {
    (f = []), sessionStorage.removeItem("cart"), window.location.reload(!0);
  }
  function A(e, t, n) {
    const a = e.querySelector(".actions"),
      s = f.find((e) => e.id === t.id && e.weightPerBag === n);
    a.innerHTML = s
      ? `\n        <button class="decrease" data-id="${t.id}" data-weight="${n}">-</button>\n        <span class="qty">${s.bags}</span>\n        <button class="increase" data-id="${t.id}" data-weight="${n}">+</button>\n      `
      : `<button class="add-to-cart" data-id="${t.id}" data-weight="${n}">Add to Cart</button>`;
  }
  function q(e, t = null) {
    const n = document.createElement("div");
    (n.className = "product-card fade-in-on-scroll"),
      n.setAttribute("data-type", e.type || "N/A"),
      n.setAttribute("data-id", e.id);
    const a = "Active" !== e.status;
    let s,
      i = "",
      o = `<h3 class="product-name">${e.brand || "Unknown"} ${
        e.name || ""
      }</h3>`;
    if (null !== t) {
      const a = t * e.pricePerKg;
      n.setAttribute("data-weight", t),
        (s = `₹${a} per bag`),
        (i = `<button class="add-to-cart" data-id="${e.id}" data-weight="${t}">Add to Cart</button>`),
        (o = `<h3 class="product-name">${e.brand || "Unknown"} ${
          e.name || ""
        } - ${t} KG</h3>`);
    } else
      (s = a ? "Out of Stock" : "No quantities available"),
        n.classList.add("inactive");
    n.innerHTML = `\n      <div class="product-card-image">\n        <img src="${(function (
      e
    ) {
      return `./src/assets/images/product_images/${e.id}.webp`;
    })(e)}" alt="${
      e.brand || "Product"
    }" class="product-img" loading="lazy">\n      </div>\n      <div class="product-info">\n        ${o}\n        <p class="product-bag-price">${s}</p>\n        <div class="actions">\n          ${i}\n        </div>\n      </div>\n    `;
    return (
      (n.querySelector(".product-img").onerror = function () {
        !(function (e, t) {
          const n = ["webp", "jpg", "jpeg"],
            a = `./src/assets/images/product_images/${t}.`,
            s = e.src.split(".").pop().toLowerCase(),
            i = n.indexOf(s);
          if (-1 === i || i === n.length - 1)
            (e.src = "./src/assets/images/default.png"), (e.onerror = null);
          else {
            const t = n[i + 1];
            e.src = a + t;
          }
        })(this, e.id);
      }),
      n
    );
  }
  function H() {
    if (!f.length)
      return (
        c.classList.add("hidden"),
        c.classList.remove("active", "expanded"),
        p.classList.remove("expanded"),
        p.classList.add("collapsed"),
        void (p.innerHTML = '<i class="fa-solid fa-maximize"></i>')
      );
    c.classList.remove("hidden"), c.classList.add("active");
    const e = document.createDocumentFragment(),
      t = document.createElement("table");
    (t.className = "cart-table"),
      (t.innerHTML =
        '\n      <thead>\n        <tr>\n          <th>Brand</th>\n          <th>Weight/Bag</th>\n          <th>Bags</th>\n          <th>₹/kg</th>\n          <th>Subtotal</th>\n        </tr>\n      </thead>\n      <tbody></tbody>\n      <tfoot class="tfoot">\n        <tr>\n          <td colspan="4"><strong>Total</strong></td>\n          <td id="total-price"><strong>₹0</strong></td>\n        </tr>\n      </tfoot>\n    ');
    const n = t.querySelector("tbody");
    let a = 0;
    f.forEach((e) => {
      const t = e.basePrice * e.weightPerBag * e.bags;
      a += t;
      const s = document.createElement("tr");
      (s.innerHTML = `\n        <td>${e.brand}</td>\n        <td>${e.weightPerBag} kg</td>\n        <td>${e.bags}</td>\n        <td>₹${e.basePrice}</td>\n        <td>₹${t}</td>\n      `),
        n.appendChild(s);
    }),
      (t.querySelector("#total-price").innerHTML = `<strong>₹${a}</strong>`),
      e.appendChild(t),
      (d.innerHTML = ""),
      d.appendChild(e);
  }
  function P() {
    f.length
      ? ((r.className = "checkout-btn collapsed"),
        (r.style.display = "block"),
        (r.innerHTML = `\n        <i class="fas fa-shopping-cart cart-icon"></i>\n        <span class="checkout-text">Checkout</span>\n        <span class="cart-badge" style="background: ${
          x[Math.floor(Math.random() * x.length)]
        }">${f.length}</span>\n      `))
      : ((r.className = "checkout-btn slide-out"),
        setTimeout(() => {
          (r.style.display = "none"), (r.className = "checkout-btn collapsed");
        }, 600));
  }
  let j;
  r.addEventListener("click", () => {
    f.length &&
      (clearTimeout(j),
      r.classList.remove("collapsed"),
      r.classList.add("expanded"),
      H(),
      (j = setTimeout(() => {
        r.classList.remove("expanded"), r.classList.add("collapsed");
      }, 3e3)));
  }),
    o?.addEventListener("click", (e) => {
      const n = e.target,
        a = n.dataset?.id;
      if (!a) return;
      const s = g.find((e) => e.id === a);
      if (!s) return;
      const i = n.closest(".product-card");
      if (n.classList.contains("add-to-cart")) {
        const e = parseInt(n.dataset.weight);
        if (isNaN(e)) return;
        const o = f.find((t) => t.id === a && t.weightPerBag === e);
        o
          ? o.bags++
          : (f.push({
              id: a,
              brand: s.brand,
              weightPerBag: e,
              bags: 1,
              basePrice: s.pricePerKg,
            }),
            t("Item added to cart", "success")),
          A(i, s, e),
          P(),
          sessionStorage?.setItem("cart", JSON.stringify(f));
      }
      if (
        n.classList.contains("increase") ||
        n.classList.contains("decrease")
      ) {
        const e = parseInt(n.dataset.weight);
        if (isNaN(e)) return;
        const o = f.find((t) => t.id === a && t.weightPerBag === e);
        o &&
          ((o.bags += n.classList.contains("increase") ? 1 : -1),
          o.bags <= 0 &&
            ((f = f.filter((t) => t.id !== a || t.weightPerBag !== e)),
            t("Item removed from cart", "success")),
          A(i, s, e),
          P(),
          sessionStorage?.setItem("cart", JSON.stringify(f)));
      }
    }),
    u.addEventListener("click", () => {
      (f = []),
        sessionStorage.removeItem("cart"),
        t("Cart cleared", "success"),
        c.classList.remove("active", "expanded"),
        p.classList.remove("expanded"),
        p.classList.add("collapsed"),
        (p.innerHTML = '<i class="fa-solid fa-maximize"></i>'),
        setTimeout(() => {
          c.classList.add("hidden"),
            P(),
            H(),
            document.querySelectorAll(".product-card").forEach((e) => {
              const t = e.dataset.id,
                n = parseInt(e.dataset.weight),
                a = g.find((e) => e.id === t);
              a && !isNaN(n) && A(e, a, n);
            });
        }, 500);
    }),
    m.addEventListener("click", () => {
      c.classList.remove("active", "expanded"),
        p.classList.remove("expanded"),
        p.classList.add("collapsed"),
        (p.innerHTML = '<i class="fa-solid fa-maximize"></i>'),
        setTimeout(() => {
          c.classList.add("hidden"), P();
        }, 500);
    }),
    p.addEventListener("click", () => {
      c.classList.contains("expanded")
        ? (c.classList.remove("expanded"),
          p.classList.remove("expanded"),
          p.classList.add("collapsed"),
          (p.innerHTML = '<i class="fa-solid fa-maximize"></i>'))
        : (c.classList.add("expanded"),
          p.classList.remove("collapsed"),
          p.classList.add("expanded"),
          (p.innerHTML = '<i class="fa-solid fa-minimize"></i>'));
    }),
    l.addEventListener("click", () => {
      sessionStorage.setItem("cart", JSON.stringify(f)),
        (window.location.href = "orders.html");
    }),
    (function () {
      const e = document.createElement("div");
      (e.id = "search-filter-container"),
        (e.innerHTML =
          '\n      <input id="search-input" type="text" placeholder="Search by brand name...">\n      <select id="type-filter"><option value="">All Types</option></select>\n    '),
        o?.parentNode?.insertBefore(e, o);
      const t = document.createElement("div");
      (t.id = "count-container"),
        (t.innerHTML =
          '\n      <p id="filtered-count">0 results</p>\n      <button id="filter-btn"><i class="fa-solid fa-filter"></i> Filters <span id="filter-dot" class="filter-dot hidden"></span></button>\n    '),
        o?.parentNode?.insertBefore(t, o);
      const n = document.getElementById("search-input"),
        a = document.getElementById("type-filter"),
        s = document.getElementById("filter-btn");
      let i;
      n?.addEventListener("input", () => {
        clearTimeout(i),
          (i = setTimeout(() => {
            (v = n.value.trim().toLowerCase()), B();
          }, 300));
      }),
        a?.addEventListener("change", () => {
          (b = a.value), B();
        }),
        s?.addEventListener("click", $);
    })(),
    (function () {
      const e = document.createElement("div");
      (e.id = "filter-panel"),
        (e.className = "filter-panel"),
        Object.assign(e.style, {
          position: "fixed",
          top: "60px",
          right: "0",
          width: "300px",
          height: "100%",
          backgroundColor: "#fff",
          boxShadow: "-2px 0 5px rgba(0,0,0,0.2)",
          padding: "20px",
          overflowY: "auto",
          transform: "translateX(100%)",
          transition: "transform 0.3s ease-in-out, opacity 0.3s ease-in-out",
          opacity: "0",
          zIndex: "1000",
        }),
        (e.innerHTML =
          '\n      <div class="filter-header">\n        <h3>Filters</h3>\n        <button id="close-filter"><i class="fa-solid fa-times"></i></button>\n      </div>\n      <div class="filter-section">\n        <h4>Brands</h4>\n        <div id="brand-filters"></div>\n      </div>\n      <div class="filter-section">\n        <h4>Quantities (kg)</h4>\n        <div id="quantity-filters"></div>\n      </div>\n      <div class="filter-section">\n        <h4>Price Ranges (₹)</h4>\n        <div id="price-range-filters"></div>\n      </div>\n      <button id="clear-filters">Clear All</button>\n    '),
        document.body.appendChild(e);
      const t = document.getElementById("clear-filters");
      document.getElementById("close-filter").addEventListener("click", $),
        t.addEventListener("click", () => {
          (y = []),
            (L = []),
            (w = []),
            document
              .querySelectorAll(
                "#brand-filters input, #quantity-filters input, #price-range-filters input"
              )
              .forEach((e) => {
                e.checked = !1;
              }),
            B();
        });
    })(),
    (async function (e = 3, n = 1e3) {
      !(function (e) {
        const t = document.createDocumentFragment();
        for (let n = 0; n < Math.max(e, E); n++) {
          const e = document.createElement("div");
          (e.className = "skeleton-card"),
            (e.innerHTML =
              '\n        <div class="skeleton-img"></div>\n        <div class="skeleton-info">\n          <div class="skeleton-name"></div>\n          <div class="skeleton-quantity"></div>\n          <div class="skeleton-actions"></div>\n        </div>\n      '),
            t.appendChild(e);
        }
        (o.innerHTML = ""), o.appendChild(t);
      })(E);
      for (let a = 1; a <= e; a++)
        try {
          const e = new AbortController(),
            t = setTimeout(() => e.abort(), 5e3),
            n = await fetch(
              "https://script.google.com/macros/s/AKfycbzWIlg4U6L71j2jIOxt0Jh6EKvUSDbvrKf7F4AtsbLzY5_YZXjCj_nJ-0wMOjkpHY-G/exec",
              {
                signal: e.signal,
                cache: "no-store",
                headers: { Accept: "application/json" },
              }
            );
          if ((clearTimeout(t), !n.ok))
            throw new Error(`HTTP error! Status: ${n.status}`);
          const a = await n.json();
          if (!Array.isArray(a) || !a.length)
            throw new Error("No valid product data received");
          return (
            (g = a.map((e) => ({
              id: String(e.ID || ""),
              brand: String(e.Brand || "Unknown"),
              name: String(e.Name || "N/A"),
              type: String(e.Type || "N/A"),
              quantities: String(e.Quantity || "")
                .split(",")
                .map((e) => parseInt(e.trim()))
                .filter((e) => !isNaN(e) && e > 0),
              pricePerKg: parseFloat(e.PricePerKg) || 0,
              status: String(e.Status || "Inactive").trim(),
            }))),
            (h = [...g]),
            T(),
            I(),
            M(),
            B(),
            P(),
            void S()
          );
        } catch (s) {
          a === e
            ? (t(`Failed to load products: ${s.message}`, "error"),
              C(`Failed to load products: ${s.message}`))
            : await new Promise((e) => setTimeout(e, n));
        }
    })();
  const O = new MutationObserver(() => {
    document.querySelectorAll(".actions").forEach((e) => {
      const t = e.querySelector(".decrease") && e.querySelector(".increase");
      e.classList.toggle("action-visible", t);
    }),
      (function () {
        const e = new IntersectionObserver(
          (e, t) => {
            e.forEach((e) => {
              e.isIntersecting &&
                (e.target.classList.add("visible"), t.unobserve(e.target));
            });
          },
          { threshold: 0.1, rootMargin: "0px 0px -10% 0px" }
        );
        document
          .querySelectorAll(".fade-in-on-scroll")
          .forEach((t) => e.observe(t));
      })();
  });
  O.observe(document.body, { childList: !0, subtree: !0 }),
    window.addEventListener("beforeunload", () => O.disconnect());
});
