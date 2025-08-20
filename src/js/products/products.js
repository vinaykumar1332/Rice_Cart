document.addEventListener('DOMContentLoaded', () => {
  const toastContainer = document.createElement('div');
  Object.assign(toastContainer.style, {
    position: 'fixed',
    top: '40%',
    right: '20px',
    zIndex: '1000'
  });
  document.body.appendChild(toastContainer);

  function showToast(message, type = 'error') {
    const toast = document.createElement('div');
    Object.assign(toast.style, {
      padding: '12px 20px',
      marginBottom: '40%',
      borderRadius: '4px',
      color: '#fff',
      backgroundColor: type === 'error' ? '#dc3545' : '#28a745',
      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
      opacity: '0',
      transition: 'opacity 0.3s ease-in-out'
    });
    toast.textContent = message;
    toastContainer.appendChild(toast);

    requestAnimationFrame(() => {
      toast.style.opacity = '1';
    });

    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  async function checkNetworkStatus() {
    if (!navigator.onLine) {
      showToast('No internet connection');
      return false;
    }
    return true;
  }

  async function checkApiLatency(apiUrl) {
    try {
      const startTime = performance.now();
      const response = await fetch(apiUrl, {
        mode: 'no-cors',
        cache: 'no-store',
        signal: AbortSignal.timeout(4000)
      });
      const latency = performance.now() - startTime;
      if (latency > 4000) {
        showToast('API response too slow');
        return false;
      }
      return true;
    } catch (error) {
      showToast('Network error: Unable to reach server');
      return false;
    }
  }

  window.addEventListener('online', () => showToast('Back online', 'success'));
  window.addEventListener('offline', () => showToast('Lost internet connection'));

  async function monitorNetwork() {
    if (await checkNetworkStatus()) {
      await checkApiLatency('https://script.google.com/macros/s/AKfycbzWIlg4U6L71j2jIOxt0Jh6EKvUSDbvrKf7F4AtsbLzY5_YZXjCj_nJ-0wMOjkpHY-G/exec');
    }
  }

  // Debounced network monitoring
  let lastNetworkCheck = 0;
  function debouncedMonitorNetwork() {
    const now = Date.now();
    if (now - lastNetworkCheck > 50000) {
      lastNetworkCheck = now;
      monitorNetwork();
    }
  }

  setInterval(debouncedMonitorNetwork, 10000);

  const originalFetch = window.fetch;
  window.fetch = async function (...args) {
    if (!await checkNetworkStatus()) {
      showToast('No network connection');
      return Promise.reject(new Error('No network connection'));
    }
    const startTime = performance.now();
    try {
      const response = await originalFetch(...args);
      if (performance.now() - startTime > 9000) {
        showToast('API call too slow');
        return Promise.reject(new Error('API call too slow'));
      }
      return response;
    } catch (error) {
      showToast('API call failed');
      throw error;
    }
  };

  const productsContainer = document.getElementById('productsContainer');
  const checkoutBtn = document.getElementById('go-to-dashboard');
  const dashboardOverlay = document.getElementById('dashboard-overlay');
  const dashboardContent = document.getElementById('dashboard-content');
  const finalCheckoutBtn = document.getElementById('checkout-final');
  const modifyBtn = document.getElementById('modify-cart');
  const closeOverlayBtn = document.getElementById('close-overlay');

  let cart = JSON.parse(sessionStorage.getItem('cart')) || [];
  let products = [];
  let filteredProducts = [];
  let searchTerm = '';
  let selectedType = '';
  const API_TIMEOUT = 5000;
  const MIN_SKELETON_COUNT = 10;
  const API_URL = 'https://script.google.com/macros/s/AKfycbzWIlg4U6L71j2jIOxt0Jh6EKvUSDbvrKf7F4AtsbLzY5_YZXjCj_nJ-0wMOjkpHY-G/exec';

  function createSearchFilter() {
    const searchFilterContainer = document.createElement('div');
    searchFilterContainer.id = 'search-filter-container';
    searchFilterContainer.innerHTML = `
      <input id="search-input" type="text" placeholder="Search by brand name..." />
      <select id="type-filter">
        <option value="">All Types</option>
      </select>
    `;
    productsContainer?.parentNode?.insertBefore(searchFilterContainer, productsContainer);

    const countContainer = document.createElement('div');
    countContainer.id = 'count-container';
    countContainer.innerHTML = `<p id="filtered-count">0 results</p>`;
    productsContainer?.parentNode?.insertBefore(countContainer, productsContainer);

    const searchInput = document.getElementById('search-input');
    const typeFilter = document.getElementById('type-filter');

    let debounceTimeout;
    searchInput?.addEventListener('input', () => {
      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(() => {
        searchTerm = searchInput.value.trim().toLowerCase();
        filterProducts();
      }, 300);
    });

    typeFilter?.addEventListener('change', () => {
      selectedType = typeFilter.value;
      filterProducts();
    });
  }

  function populateTypeFilter() {
    const typeFilter = document.getElementById('type-filter');
    const uniqueTypes = [...new Set(products.map(p => p.type))].sort();
    uniqueTypes.forEach(type => {
      const option = document.createElement('option');
      option.value = type;
      option.textContent = type;
      typeFilter?.appendChild(option);
    });
  }

  function filterProducts() {
    filteredProducts = products.filter(product => {
      const matchesSearch = searchTerm
        ? product.name?.toLowerCase().includes(searchTerm) ||
          product.brand?.toLowerCase().includes(searchTerm) ||
          product.type?.toLowerCase().includes(searchTerm)
        : true;
      const matchesType = selectedType ? product.type === selectedType : true;
      return matchesSearch && matchesType;
    });

    updateFilteredCount();
    displayAllProducts();
  }

  function showSkeletons(count) {
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < Math.max(count, MIN_SKELETON_COUNT); i++) {
      const skeleton = document.createElement('div');
      skeleton.className = 'skeleton-card';
      skeleton.innerHTML = `
        <div class="skeleton-img"></div>
        <div class="skeleton-info">
          <div class="skeleton-name"></div>
          <div class="skeleton-quantity"></div>
          <div class="skeleton-actions"></div>
        </div>
      `;
      fragment.appendChild(skeleton);
    }
    productsContainer.innerHTML = '';
    productsContainer.appendChild(fragment);
  }

  function removeSkeletons() {
    productsContainer.innerHTML = '';
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
    window.location.reload(true);
  }

  function getLocalImage(product) {
    return `./src/assets/images/${product.id}.jpg`;
  }

  function updateCartUI(card, product, selectedWeight) {
    const actions = card.querySelector('.actions');
    const item = cart.find(i => i.id === product.id && i.weightPerBag === selectedWeight);
    actions.innerHTML = item
      ? `
        <button class="decrease" data-id="${product.id}" data-weight="${selectedWeight}">-</button>
        <span class="qty">${item.bags}</span>
        <button class="increase" data-id="${product.id}" data-weight="${selectedWeight}">+</button>
      `
      : `<button class="add-to-cart" data-id="${product.id}" data-weight="${selectedWeight}">Add to Cart</button>`;
  }

  function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card fade-in-on-scroll';
    card.setAttribute('data-type', product.type || 'N/A');
    card.setAttribute('data-id', product.id);

    const isOutOfStock = product.status !== 'Active';
    if (isOutOfStock) card.classList.add('inactive');

    const availableWeights = product.quantities || [];
    const weightOptions = !isOutOfStock && availableWeights.length > 0
      ? availableWeights.map(weight => `<option value="${weight}">${weight} kg</option>`).join('')
      : '';

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
        ${!isOutOfStock && weightOptions
          ? `<div class="custom-select-container">
               <div class="custom">
                <select id="quantity-${product.id}" class="quantity-select">
                  <option value="">Select kgs</option>
                  ${weightOptions}
                </select>
               </div>
             </div>
             <p class="error-message" id="error-${product.id}" style="display: none; color: red;"></p>`
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

  function displayAllProducts() {
    const fragment = document.createDocumentFragment();
    if (filteredProducts.length === 0 && products.length > 0) {
      productsContainer.innerHTML = '<p class="Error"><i class="fa-regular fa-face-sad-tear"></i>No products found.</p>';
      return;
    }
    filteredProducts.forEach(product => fragment.appendChild(createProductCard(product)));
    productsContainer.innerHTML = '';
    productsContainer.appendChild(fragment);
  }

  function updateFilteredCount() {
    document.getElementById('filtered-count').textContent = `${filteredProducts.length} result${filteredProducts.length !== 1 ? 's' : ''}`;
  }

  function updateDashboard() {
    if (cart.length === 0) {
      dashboardOverlay.classList.add('hidden');
      return;
    }

    dashboardOverlay.classList.remove('hidden');
    const fragment = document.createDocumentFragment();
    const table = document.createElement('table');
    table.className = 'cart-table';
    table.innerHTML = `
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
    `;

    const tbody = table.querySelector('tbody');
    let total = 0;

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
      tbody.appendChild(row);
    });

    table.querySelector('#total-price').innerHTML = `<strong>₹${total}</strong>`;
    fragment.appendChild(table);
    dashboardContent.innerHTML = '';
    dashboardContent.appendChild(fragment);
  }

  function toggleCheckout() {
    checkoutBtn.style.display = cart.length > 0 ? 'block' : 'none';
    checkoutBtn.textContent = `Checkout (${cart.length})`;
  }

  productsContainer?.addEventListener('click', (e) => {
    const target = e.target;
    const productId = target.dataset?.id;
    if (!productId) return;

    const product = products.find(p => p.id === productId);
    if (!product) return;

    const card = target.closest('.product-card');
    const quantitySelect = card.querySelector('.quantity-select');
    const errorMessage = card.querySelector('.error-message');
    const selectedWeight = parseInt(quantitySelect?.value);

    if (target.classList.contains('add-to-cart')) {
      if (!selectedWeight) {
        errorMessage.textContent = 'Select a weight.';
        errorMessage.style.display = 'block';
        return;
      }

      errorMessage.style.display = 'none';
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

    if (target.classList.contains('increase') || target.classList.contains('decrease')) {
      const weight = parseInt(target.dataset.weight);
      const existing = cart.find(i => i.id === productId && i.weightPerBag === weight);
      if (existing) {
        existing.bags += target.classList.contains('increase') ? 1 : -1;
        if (existing.bags <= 0) {
          cart = cart.filter(i => i.id !== productId || i.weightPerBag !== weight);
        }
        updateCartUI(card, product, weight);
        toggleCheckout();
        updateDashboard();
        sessionStorage?.setItem('cart', JSON.stringify(cart));
      }
    }
  });

  checkoutBtn.addEventListener('click', () => {
    if (cart.length === 0) return;
    updateDashboard();
    checkoutBtn.style.display = 'none';
  });

  modifyBtn.addEventListener('click', () => {
    cart = [];
    sessionStorage.removeItem('cart');
    showToast('Cart cleared', 'success');
    dashboardOverlay.classList.remove('active');
    setTimeout(() => {
      dashboardOverlay.classList.add('hidden');
      toggleCheckout();
      updateDashboard();
      document.querySelectorAll('.product-card').forEach(card => {
        const productId = card.dataset.id;
        const product = products.find(p => p.id === productId);
        if (product && product.status === 'Active') {
          const quantitySelect = card.querySelector('.quantity-select');
          const selectedWeight = parseInt(quantitySelect?.value);
          if (selectedWeight) {
            updateCartUI(card, product, selectedWeight);
          }
        }
      });
    }, 500);
  });

  closeOverlayBtn.addEventListener('click', () => {
    dashboardOverlay.classList.remove('active');
    setTimeout(() => {
      dashboardOverlay.classList.add('hidden');
      toggleCheckout();
    }, 500);
  });

  finalCheckoutBtn.addEventListener('click', () => {
    sessionStorage.setItem('cart', JSON.stringify(cart));
    window.location.href = 'orders.html';
  });

  async function fetchProductsWithRetry(retries = 3, delay = 1000) {
    showSkeletons(MIN_SKELETON_COUNT);
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
        const res = await fetch(API_URL, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
        const data = await res.json();

        if (!Array.isArray(data) || data.length === 0) {
          throw new Error('No valid product data received');
        }

        products = data.map(row => ({
          id: String(row.ID || ''),
          brand: String(row.Brand || 'Unknown'),
          name: String(row.Name || 'N/A'),
          type: String(row.Type || 'N/A'),
          quantities: String(row.Quantity || '')
            .split(',')
            .map(q => parseInt(q.trim()))
            .filter(q => !isNaN(q) && q > 0),
          pricePerKg: parseFloat(row.PricePerKg) || 0,
          status: String(row.Status || 'Inactive').trim()
        }));

        try {
          const productsString = JSON.stringify(products);
          if (new Blob([productsString]).size > 5 * 1024 * 1024) {
            throw new Error('Data too large for sessionStorage');
          }
        } catch (error) {
          console.error('Error saving to sessionStorage:', error);
        }

        filteredProducts = [...products];
        populateTypeFilter();
        removeSkeletons();
        displayAllProducts();
        updateFilteredCount();
        toggleCheckout();
        return;
      } catch (err) {
        console.error(`Attempt ${attempt} failed:`, err);
        if (attempt === retries) {
          showToast(`Failed to load products: ${err.message}`, 'error');
          showErrorMessage(`Failed to load products: ${err.message}`);
        } else {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
  }

  function toggleActionVisible() {
    const actionDivs = document.querySelectorAll('.actions');
    actionDivs.forEach(div => {
      const hasButtons = div.querySelector('.decrease') && div.querySelector('.increase');
      div.classList.toggle('action-visible', hasButtons);
    });

    const dashboard = document.getElementById('dashboard-overlay');
    const anyVisible = document.querySelector('.action-visible');
    if (dashboard) dashboard.classList.toggle('active', !!anyVisible);
  }

  function initScrollFadeIn() {
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
    document.querySelectorAll('.fade-in-on-scroll').forEach(el => observer.observe(el));
  }

  createSearchFilter();
  fetchProductsWithRetry();

  const observer = new MutationObserver(() => {
    toggleActionVisible();
    initScrollFadeIn();
  });
  observer.observe(document.body, { childList: true, subtree: true });

  window.addEventListener('beforeunload', () => observer.disconnect());
});