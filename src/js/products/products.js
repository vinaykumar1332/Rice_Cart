// ==============================
// Optimized Products + Cart App
// ==============================
(() => {
  // ------------------------------
  // Config
  // ------------------------------
  const API_URL = 'https://rice-cart-ten.vercel.app/api/products';
  const API_TIMEOUT = 5000;                 // ms
  const LATENCY_SLOW_FETCH_MS = 9000;       // ms
  const PING_SLOW_MS = 4000;                // ms (for checkApiLatency)
  const MONITOR_INTERVAL_MS = 50000;        // ms
  const MIN_SKELETON_COUNT = 10;
  const CHUNK_SIZE = 40;                    // how many cards to render at once (virtualized rendering)
  const STORAGE_KEY = 'products:v1';        // bump version if product shape changes
  const INDEXED_DB = { name: 'productsDB', store: 'productsStore', version: 1 };

  // ------------------------------
  // Utility: Debounce
  // ------------------------------
  function debounce(fn, wait = 250) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), wait);
    };
  }

  // ------------------------------
  // Toasts
  // ------------------------------
  const toastContainer = (() => {
    const c = document.createElement('div');
    c.style.position = 'fixed';
    c.style.top = '40%';
    c.style.right = '20px';
    c.style.zIndex = '1000';
    document.body.appendChild(c);
    return c;
  })();

  function showToast(message, type = 'error', duration = 3000) {
    const toast = document.createElement('div');
    toast.style.padding = '12px 20px';
    toast.style.marginBottom = '40%';
    toast.style.borderRadius = '4px';
    toast.style.color = '#fff';
    toast.style.backgroundColor = type === 'error' ? '#dc3545' : '#28a745';
    toast.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease-in-out';
    toast.textContent = message;
    toastContainer.appendChild(toast);
    requestAnimationFrame(() => (toast.style.opacity = '1'));
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  // ------------------------------
  // Network Monitoring
  // ------------------------------
  function checkNetworkStatus() {
    if (!navigator.onLine) {
      showToast('No internet connection');
      return false;
    }
    return true;
  }

  async function checkApiLatency() {
    try {
      const start = performance.now();
      await fetch(API_URL, { mode: 'no-cors', cache: 'no-store' });
      const latency = performance.now() - start;
      if (latency > PING_SLOW_MS) {
        return false;
      }
      return true;
    } catch {
      showToast('Network error: Unable to reach server');
      return false;
    }
  }

  window.addEventListener('online', () => showToast('Back online', 'success'));
  window.addEventListener('offline', () => showToast('Lost internet connection'));

  async function monitorNetwork() {
    if (checkNetworkStatus()) await checkApiLatency();
  }
  monitorNetwork();
  setInterval(monitorNetwork, MONITOR_INTERVAL_MS);

  // ------------------------------
  // Safe fetch wrapper with latency toast
  // ------------------------------
  const originalFetch = window.fetch.bind(window);
  window.fetch = async function (...args) {
    if (!checkNetworkStatus()) {
      showToast('No network connection');
      return Promise.reject(new Error('No network connection'));
    }
    const start = performance.now();
    try {
      const res = await originalFetch(...args);
      const elapsed = performance.now() - start;
      if (elapsed > LATENCY_SLOW_FETCH_MS) showToast('Slow network detected');
      return res;
    } catch (err) {
      showToast('API call failed');
      throw err;
    }
  };

  // ------------------------------
  // DOM Elements
  // ------------------------------
  const productsContainer = document.getElementById('productsContainer');
  const checkoutBtn = document.getElementById('go-to-dashboard');
  const dashboardOverlay = document.getElementById('dashboard-overlay');
  const dashboardContent = document.getElementById('dashboard-content');
  const finalCheckoutBtn = document.getElementById('checkout-final');
  const modifyBtn = document.getElementById('modify-cart');
  const closeOverlayBtn = document.getElementById('close-overlay');

  if (!productsContainer) {
    console.error('Missing #productsContainer in DOM');
  }

  // ------------------------------
  // State
  // ------------------------------
  let cart = JSON.parse(sessionStorage.getItem('cart')) || [];
  let products = [];
  let filteredProducts = [];
  let searchTerm = '';
  let selectedType = '';
  let renderIndex = 0; // for chunked rendering

  // Pre-scan/normalize helper: add lowercase search fields once for faster filtering
  function normalizeProducts(list) {
    return list.map(row => {
      const id = String(row.ID || row.id || '');
      const brand = String(row.Brand || row.brand || 'Unknown');
      const name = String(row.Name || row.name || 'N/A');
      const type = String(row.Type || row.type || 'N/A');
      const quantities = String(row.Quantity || row.quantities || '')
        .toString()
        .split(',')
        .map(q => parseInt(String(q).trim()))
        .filter(q => !isNaN(q) && q > 0);
      const pricePerKg = parseFloat(row.PricePerKg ?? row.pricePerKg) || 0;
      const status = String(row.Status || row.status || 'Inactive').trim();

      return {
        id,
        brand,
        name,
        type,
        quantities,
        pricePerKg,
        status,
        _s_brand: brand.toLowerCase(),
        _s_name: name.toLowerCase(),
        _s_type: type.toLowerCase(),
      };
    });
  }

  // ------------------------------
  // IndexedDB Fallback (for large datasets)
  // ------------------------------
  function idbOpen() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(INDEXED_DB.name, INDEXED_DB.version);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(INDEXED_DB.store)) {
          db.createObjectStore(INDEXED_DB.store);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  async function idbSet(key, value) {
    const db = await idbOpen();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(INDEXED_DB.store, 'readwrite');
      tx.objectStore(INDEXED_DB.store).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
  async function idbGet(key) {
    const db = await idbOpen();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(INDEXED_DB.store, 'readonly');
      const req = tx.objectStore(INDEXED_DB.store).get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  // ------------------------------
  // UI Helpers
  // ------------------------------
  function showSkeletons(count) {
    productsContainer.innerHTML = '';
    const frag = document.createDocumentFragment();
    const N = Math.max(count, MIN_SKELETON_COUNT);
    for (let i = 0; i < N; i++) {
      const s = document.createElement('div');
      s.className = 'skeleton-card';
      s.innerHTML = `
        <div class="skeleton-img"></div>
        <div class="skeleton-info">
          <div class="skeleton-name"></div>
          <div class="skeleton-quantity"></div>
          <div class="skeleton-actions"></div>
        </div>
      `;
      frag.appendChild(s);
    }
    productsContainer.appendChild(frag);
  }

  function removeSkeletons() {
    document.querySelectorAll('.skeleton-card').forEach(el => el.remove());
  }

  function showErrorMessage(message = 'Something went wrong. Please try again.') {
    removeSkeletons();
    productsContainer.innerHTML = `
      <p class="Error">
        <i class="fa-regular fa-face-sad-tear"></i> ${message}
        <button id="retry-btn" class="retry-btn">Retry</button>
      </p>
    `;
    document.getElementById('retry-btn')?.addEventListener('click', hardRefresh);
  }

  function hardRefresh() {
    cart = [];
    sessionStorage.removeItem('cart');
    window.location.reload();
  }

  function getLocalImage(product) {
    return `./src/assets/images/${product.id}.jpg`;
  }

  function updateCartUI(card, product, selectedWeight) {
    const actions = card.querySelector('.actions');
    const item = cart.find(i => i.id === product.id && i.weightPerBag === selectedWeight);
    if (item) {
      actions.innerHTML = `
        <button class="decrease" data-id="${product.id}" data-weight="${selectedWeight}">-</button>
        <span class="qty">${item.bags}</span>
        <button class="increase" data-id="${product.id}" data-weight="${selectedWeight}">+</button>
      `;
    } else {
      actions.innerHTML = `<button class="add-to-cart" data-id="${product.id}" data-weight="${selectedWeight}">Add to Cart</button>`;
    }
  }

  function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card fade-in-on-scroll';
    card.dataset.type = product.type || 'N/A';
    card.dataset.id = product.id;

    const isOutOfStock = product.status !== 'Active';
    if (isOutOfStock) card.classList.add('inactive');

    const availableWeights = product.quantities || [];
    let weightOptions = '';
    if (!isOutOfStock && availableWeights.length > 0) {
      weightOptions = availableWeights.map(w => `<option value="${w}">${w} kg</option>`).join('');
    }

    card.innerHTML = `
      <div class="product-card-image">
        <img
          src="${getLocalImage(product)}"
          alt="${product.brand || 'Product'}"
          class="product-img"
          loading="lazy"
          onerror="this.src='./src/assets/images/default.jpg';"
        >
      </div>
      <div class="product-info">
        <h3 class="product-name">${product.brand || 'Unknown'}</h3>
        <p class="product-type">${product.name || 'N/A'}</p>
        <p class="product-bag-price">${isOutOfStock ? 'Out of Stock' : 'Check price'}</p>
        ${
          !isOutOfStock && weightOptions
            ? `
              <div class="custom-select-container">
                <div class="custom">
                  <select id="quantity-${product.id}" class="quantity-select">
                    <option value="">Select kgs</option>
                    ${weightOptions}
                  </select>
                </div>
              </div>
              <p class="error-message" id="error-${product.id}" style="display:none;color:red;"></p>
            `
            : ''
        }
        <div class="actions">
          ${!isOutOfStock && weightOptions ? `<button class="add-to-cart" data-id="${product.id}">Add to Cart</button>` : ''}
        </div>
      </div>
    `;

    if (!isOutOfStock && weightOptions) {
      const quantitySelect = card.querySelector('.quantity-select');
      const bagPriceText = card.querySelector('.product-bag-price');
      const errorMessage = card.querySelector('.error-message');

      quantitySelect?.addEventListener('change', () => {
        const selectedWeight = parseInt(quantitySelect.value);
        errorMessage.style.display = 'none';
        if (!selectedWeight) {
          bagPriceText.textContent = 'Check price';
        } else {
          const bagPrice = selectedWeight * product.pricePerKg;
          bagPriceText.textContent = `₹${bagPrice} per bag`;
          updateCartUI(card, product, selectedWeight);
        }
      });
    }

    return card;
  }

  function updateFilteredCount() {
    let filteredCount = document.getElementById('filtered-count');
    if (!filteredCount) {
      const countContainer = document.createElement('div');
      countContainer.id = 'count-container';
      countContainer.innerHTML = `<p id="filtered-count">0 results</p>`;
      productsContainer?.parentNode?.insertBefore(countContainer, productsContainer);
      filteredCount = document.getElementById('filtered-count');
    }
    filteredCount.textContent = `${filteredProducts.length} result${filteredProducts.length !== 1 ? 's' : ''}`;
  }

  function populateTypeFilter() {
    let typeFilter = document.getElementById('type-filter');
    if (!typeFilter) return;
    // Clear, then populate
    typeFilter.innerHTML = `
      <option value="">Select Type</option>
      <option value="">All</option>
    `;
    const uniqueTypes = [...new Set(products.map(p => p.type))].sort();
    const frag = document.createDocumentFragment();
    uniqueTypes.forEach(type => {
      const opt = document.createElement('option');
      opt.value = type;
      opt.textContent = type;
      frag.appendChild(opt);
    });
    typeFilter.appendChild(frag);
  }

  // ------------------------------
  // Chunked Rendering (Virtualized)
  // ------------------------------
  function resetRender() {
    renderIndex = 0;
    productsContainer.innerHTML = '';
  }

  function renderNextChunk() {
    if (renderIndex >= filteredProducts.length) return;
    const end = Math.min(renderIndex + CHUNK_SIZE, filteredProducts.length);
    const frag = document.createDocumentFragment();
    for (let i = renderIndex; i < end; i++) {
      const card = createProductCard(filteredProducts[i]);
      frag.appendChild(card);
    }
    productsContainer.appendChild(frag);
    renderIndex = end;
    initScrollFadeInForNew();
  }

  function onScrollLoadMore() {
    // Load next chunk when nearing bottom
    const nearBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 600;
    if (nearBottom) renderNextChunk();
  }

  // ------------------------------
  // Filtering
  // ------------------------------
  const runFilter = () => {
    const q = searchTerm.trim().toLowerCase();
    filteredProducts = products.filter(p => {
      const matchesSearch = !q || p._s_name.includes(q) || p._s_brand.includes(q) || p._s_type.includes(q);
      const matchesType = selectedType ? p.type === selectedType : true;
      return matchesSearch && matchesType;
    });

    updateFilteredCount();
    resetRender();
    if (filteredProducts.length === 0 && products.length > 0) {
      productsContainer.innerHTML = '<p class="Error"><i class="fa-regular fa-face-sad-tear"></i>No products found.</p>';
      return;
    }
    renderNextChunk();
  };

  const debouncedFilter = debounce(runFilter, 250);

  function createSearchFilter() {
    // If already added, skip
    if (document.getElementById('search-filter-container')) return;

    const searchFilterContainer = document.createElement('div');
    searchFilterContainer.id = 'search-filter-container';
    searchFilterContainer.innerHTML = `
      <input id="search-input" type="text" placeholder="Search by brand, product, or type..." />
      <select id="type-filter">
        <option value="">Select Type</option>
        <option value="">All</option>
      </select>
    `;
    productsContainer?.parentNode?.insertBefore(searchFilterContainer, productsContainer);

    const countContainer = document.createElement('div');
    countContainer.id = 'count-container';
    countContainer.innerHTML = `<p id="filtered-count">0 results</p>`;
    productsContainer?.parentNode?.insertBefore(countContainer, productsContainer);

    const searchInput = document.getElementById('search-input');
    const typeFilter = document.getElementById('type-filter');

    searchInput?.addEventListener('input', () => {
      searchTerm = searchInput.value;
      debouncedFilter();
    });

    typeFilter?.addEventListener('change', () => {
      selectedType = typeFilter.value;
      debouncedFilter();
    });
  }

  // ------------------------------
  // Dashboard / Cart
  // ------------------------------
  function updateDashboard() {
    if (cart.length === 0) {
      dashboardOverlay.classList.add('hidden');
      return;
    }

    dashboardOverlay.classList.remove('hidden');
    dashboardContent.innerHTML = `
      <table class="cart-table">
        <thead>
          <tr>
            <th>Brand</th>
            <th>Weight/Bag</th>
            <th>Bags</th>
            <th>₹/kg</th>
            <th>Subtotal</th>
          </tr>
        </thead>
        <tbody></tbody>
        <tfoot class="tfoot">
          <tr>
            <td colspan="4"><strong>Total</strong></td>
            <td id="total-price"><strong>₹0</strong></td>
          </tr>
        </tfoot>
      </table>
    `;

    const tbody = dashboardContent.querySelector('tbody');
    let total = 0;
    const frag = document.createDocumentFragment();

    cart.forEach(item => {
      const subtotal = item.basePrice * item.weightPerBag * item.bags;
      total += subtotal;
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${item.brand}</td>
        <td>${item.weightPerBag} kg</td>
        <td>${item.bags}</td>
        <td>₹${item.basePrice}</td>
        <td>₹${subtotal}</td>
      `;
      frag.appendChild(row);
    });

    tbody.appendChild(frag);
    dashboardContent.querySelector('#total-price').innerHTML = `<strong>₹${total}</strong>`;
  }

  function toggleCheckout() {
    if (!checkoutBtn) return;
    checkoutBtn.style.display = cart.length > 0 ? 'block' : 'none';
    checkoutBtn.textContent = `Checkout (${cart.length})`;
  }

  // Click handling on product cards
  productsContainer?.addEventListener('click', (e) => {
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;
    const productId = target.dataset?.id;
    if (!productId) return;

    const product = products.find(p => p.id === productId);
    if (!product) return;

    const card = target.closest('.product-card');
    const quantitySelect = card?.querySelector('.quantity-select');
    const errorMessage = card?.querySelector('.error-message');
    const selectedWeight = parseInt(quantitySelect?.value);

    if (target.classList.contains('add-to-cart')) {
      if (!selectedWeight) {
        if (errorMessage) {
          errorMessage.textContent = 'Select a weight.';
          errorMessage.style.display = 'block';
        }
        return;
      }
      if (errorMessage) errorMessage.style.display = 'none';
      const existing = cart.find(i => i.id === productId && i.weightPerBag === selectedWeight);

      if (!existing) {
        cart.push({
          id: productId,
          brand: product.brand,
          weightPerBag: selectedWeight,
          bags: 1,
          basePrice: product.pricePerKg
        });
      } else {
        existing.bags++;
      }

      updateCartUI(card, product, selectedWeight);
      toggleCheckout();
      updateDashboard();
      sessionStorage?.setItem('cart', JSON.stringify(cart));
    }

    if (target.classList.contains('increase')) {
      const weight = parseInt(target.dataset.weight);
      const existing = cart.find(i => i.id === productId && i.weightPerBag === weight);
      if (existing) {
        existing.bags++;
        updateCartUI(card, product, weight);
        toggleCheckout();
        updateDashboard();
        sessionStorage?.setItem('cart', JSON.stringify(cart));
      }
    }

    if (target.classList.contains('decrease')) {
      const weight = parseInt(target.dataset.weight);
      const existing = cart.find(i => i.id === productId && i.weightPerBag === weight);
      if (existing) {
        existing.bags--;
        if (existing.bags <= 0) {
          cart = cart.filter(i => !(i.id === productId && i.weightPerBag === weight));
        }
        updateCartUI(card, product, weight);
        toggleCheckout();
        updateDashboard();
        sessionStorage?.setItem('cart', JSON.stringify(cart));
      }
    }
  });

  checkoutBtn?.addEventListener('click', () => {
    if (cart.length === 0) return;
    updateDashboard();
    checkoutBtn.style.display = 'none';
  });

  modifyBtn?.addEventListener('click', () => {
    // Clear cart and sessionStorage
    cart = [];
    sessionStorage.removeItem('cart');
    showToast('Cart cleared', 'success');

    // Update UI
    dashboardOverlay?.classList.remove('active');
    setTimeout(() => {
      dashboardOverlay?.classList.add('hidden');
      toggleCheckout();
      updateDashboard();
      // Update all product cards to reflect cleared cart
      document.querySelectorAll('.product-card').forEach(card => {
        const productId = card.getAttribute('data-id');
        const product = products.find(p => p.id === productId);
        if (product && product.status === 'Active') {
          const quantitySelect = card.querySelector('.quantity-select');
          const selectedWeight = parseInt(quantitySelect?.value);
          if (selectedWeight) updateCartUI(card, product, selectedWeight);
        }
      });
    }, 500);
  });

  closeOverlayBtn?.addEventListener('click', () => {
    dashboardOverlay?.classList.remove('active');
    setTimeout(() => {
      dashboardOverlay?.classList.add('hidden');
      toggleCheckout();
    }, 500);
  });

  finalCheckoutBtn?.addEventListener('click', () => {
    sessionStorage.setItem('cart', JSON.stringify(cart));
    window.location.href = 'orders.html';
  });

  // ------------------------------
  // Fade-in on scroll (only for newly added)
  // ------------------------------
  function initScrollFadeInForNew() {
    const elements = document.querySelectorAll('.fade-in-on-scroll:not(.__observed)');
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -10% 0px' }
    );
    elements.forEach(el => {
      el.classList.add('__observed');
      observer.observe(el);
    });
  }

  // ------------------------------
  // Data Fetch with Timeout + Cache
  // ------------------------------
  async function fetchWithTimeout(url, options = {}, timeout = API_TIMEOUT) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const res = await fetch(url, { ...options, signal: controller.signal, cache: 'no-store' });
      clearTimeout(id);
      return res;
    } catch (e) {
      clearTimeout(id);
      throw e;
    }
  }

  async function loadProductsFromCache() {
    // Try sessionStorage first
    try {
      const cached = sessionStorage.getItem(STORAGE_KEY);
      if (cached) return JSON.parse(cached);
    } catch {}
    // Then IndexedDB
    try {
      const idbData = await idbGet(STORAGE_KEY);
      if (idbData) return idbData;
    } catch {}
    return null;
  }

  async function saveProductsToCache(list) {
    try {
      const s = JSON.stringify(list);
      const size = new Blob([s]).size;
      if (size <= 5 * 1024 * 1024) {
        sessionStorage.setItem(STORAGE_KEY, s);
      } else {
        await idbSet(STORAGE_KEY, list);
      }
    } catch (err) {
      console.warn('Cache save failed:', err);
    }
  }

  async function fetchProducts() {
    showSkeletons(MIN_SKELETON_COUNT);

    // 1) Try cache first to get instant UI
    const cached = await loadProductsFromCache();
    if (cached && Array.isArray(cached) && cached.length) {
      products = normalizeProducts(cached);
      filteredProducts = [...products];
      createSearchFilter();
      populateTypeFilter();
      removeSkeletons();
      resetRender();
      renderNextChunk();
      updateFilteredCount();
      toggleCheckout();
    }

    // 2) Always attempt a fresh fetch to ensure data is correct/new
    try {
      const res = await fetchWithTimeout(API_URL);
      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
      const data = await res.json();

      if (!Array.isArray(data) || data.length === 0) {
        if (!cached) showErrorMessage('No products available at the moment.');
        return;
      }

      const normalized = normalizeProducts(data);
      products = normalized;
      filteredProducts = [...products];

      // Save cache
      await saveProductsToCache(data);

      // If UI not yet shown (no cache), clear skeletons and render
      removeSkeletons();
      createSearchFilter();
      populateTypeFilter();
      resetRender();
      renderNextChunk();
      updateFilteredCount();
      toggleCheckout();
    } catch (err) {
      if (!cached) {
        removeSkeletons();
        showToast('API response is too slow or failed', 'error');
        showErrorMessage(`Failed to load products: ${err.message}`);
      } else {
        // We had cache, so fail silently but log
        console.error('Fresh fetch failed, using cache:', err);
      }
    }
  }

  // ------------------------------
  // Init
  // ------------------------------
  function init() {
    createSearchFilter();
    fetchProducts();
    // Load more on scroll
    window.addEventListener('scroll', onScrollLoadMore, { passive: true });

    // Mutation observer to keep actions visibility & fade-in consistent
    function toggleActionVisible() {
      const actionDivs = document.querySelectorAll('.actions');
      actionDivs.forEach(div => {
        const hasDecrease = !!div.querySelector('.decrease');
        const hasIncrease = !!div.querySelector('.increase');
        div.classList.toggle('action-visible', hasDecrease && hasIncrease);
      });

      const dashboard = document.getElementById('dashboard-overlay');
      const anyVisible = document.querySelector('.action-visible');
      if (dashboard) dashboard.classList.toggle('active', !!anyVisible);
    }

    toggleActionVisible();
    initScrollFadeInForNew();

    const observer = new MutationObserver(() => {
      toggleActionVisible();
      initScrollFadeInForNew();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('beforeunload', () => observer.disconnect());
  }

  // Ensure single DOMContentLoaded registration; run immediately if DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
