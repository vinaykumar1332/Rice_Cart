// DOM References
const productsContainer = document.getElementById('productsContainer');
const checkoutBtn = document.getElementById('go-to-dashboard');
const dashboardOverlay = document.getElementById('dashboard-overlay');
const dashboardContent = document.getElementById('dashboard-content');
const finalCheckoutBtn = document.getElementById('checkout-final');
const modifyBtn = document.getElementById('modify-cart');
const closeOverlayBtn = document.getElementById('close-overlay');

let cart = [];
let products = [];
let filteredProducts = [];
let currentIndex = 0;
const BATCH_SIZE = 20;
let searchTerm = '';
let selectedType = '';

// Create Search Bar and Filter Dropdown
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

  const searchInput = document.getElementById('search-input');
  const typeFilter = document.getElementById('type-filter');

  searchInput?.addEventListener('input', () => {
    searchTerm = searchInput.value.trim().toLowerCase();
    filterProducts();
  });

  typeFilter?.addEventListener('change', () => {
    selectedType = typeFilter.value;
    filterProducts();
  });
}

// Populate Filter Dropdown
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

// Filter products
function filterProducts() {
  filteredProducts = products.filter(product => {
    const matchesSearch = searchTerm ? product.brand?.toLowerCase().includes(searchTerm) : true;
    const matchesType = selectedType ? product.type === selectedType : true;
    return matchesSearch && matchesType;
  });
  currentIndex = 0;
  productsContainer.innerHTML = '';
  loadNextBatch();
}

// Show and remove skeletons
function showSkeletons(count = BATCH_SIZE) {
  for (let i = 0; i < count; i++) {
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
    productsContainer?.appendChild(skeleton);
  }
}

function removeSkeletons() {
  document.querySelectorAll('.skeleton-card').forEach(el => el.remove());
}

// Image fallback
function getLocalImage(product) {
  return `./src/assets/images/${product.id}.jpg`;
}

// Update Cart UI
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

// Create Product Card
function createProductCard(product) {
  const card = document.createElement('div');
  card.className = 'product-card';
  card.setAttribute('data-id', product.id);

  const isOutOfStock = product.status !== 'Active';
  if (isOutOfStock) {
    card.classList.add('inactive');
  }

  const availableWeights = product.quantities || [];
  let weightOptions = '';
  if (!isOutOfStock && availableWeights.length > 0) {
    availableWeights.forEach(weight => {
      weightOptions += `<option value="${weight}">${weight} kg</option>`;
    });
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
      <p class="product-type">${product.type || 'N/A'}</p>
      <p class="product-bag-price">${isOutOfStock ? 'Out of Stock' : 'Select weight to see price'}</p>
      ${!isOutOfStock && weightOptions
      ? `
            <select id="quantity-${product.id}" class="quantity-select">
              <option value="">Select kgs</option>
              ${weightOptions}
            </select>
            <p class="error-message" id="error-${product.id}" style="display: none; color: red;"></p>
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
        bagPriceText.textContent = 'Select weight to see price';
      } else {
        const bagPrice = selectedWeight * product.pricePerKg;
        bagPriceText.textContent = `₹${bagPrice} per bag`;
      }
    });
  }

  productsContainer?.appendChild(card);
}

// Load next batch
function loadNextBatch() {
  const nextBatch = filteredProducts.slice(currentIndex, currentIndex + BATCH_SIZE);
  nextBatch.forEach(createProductCard);
  currentIndex += BATCH_SIZE;
}

function handleScroll() {
  const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
  if (scrollTop + clientHeight >= scrollHeight - 10 && currentIndex < filteredProducts.length) {
    showSkeletons();
    setTimeout(() => {
      removeSkeletons();
      loadNextBatch();
    }, 800);
  }
}

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
      <tfoot>
        <tr>
          <td colspan="4"><strong>Total</strong></td>
          <td id="total-price"><strong>₹0</strong></td>
        </tr>
      </tfoot>
    </table>
  `;

  const tbody = dashboardContent.querySelector('tbody');
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

  dashboardContent.querySelector('#total-price').innerHTML = `<strong>₹${total}</strong>`;
}

function toggleCheckout() {
  checkoutBtn.style.display = cart.length > 0 ? 'block' : 'none';
  checkoutBtn.textContent = `Checkout (${cart.length})`;
}// Event delegation
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
      errorMessage.textContent = 'Please select a weight.';
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
  dashboardOverlay?.classList.remove('hidden');
});

modifyBtn.addEventListener('click', () => {
  dashboardOverlay.classList.add('hidden');
  toggleCheckout();
});

closeOverlayBtn.addEventListener('click', () => {
  dashboardOverlay.classList.add('hidden');
  toggleCheckout();
});

finalCheckoutBtn.addEventListener('click', () => {
  sessionStorage.setItem('cart', JSON.stringify(cart));
  window.location.href = 'orders.html';
});

// Initial load
createSearchFilter();
showSkeletons();
fetch('https://script.google.com/macros/s/AKfycbzWIlg4U6L71j2jIOxt0Jh6EKvUSDbvrKf7F4AtsbLzY5_YZXjCj_nJ-0wMOjkpHY-G/exec')
  .then(res => res.json())
  .then(data => {
    products = data.map(row => ({
      id: row.ID,
      brand: row.Brand,
      type: row.Type,
      quantities: String(row.Quantity || '')
        .split(',')
        .map(q => parseInt(q.trim()))
        .filter(q => !isNaN(q) && q > 0),
      pricePerKg: parseFloat(row.PricePerKg),

      status: row.Status?.trim?.() || 'Inactive'
    }));
    filteredProducts = products;
    populateTypeFilter();
    removeSkeletons();
  toggleCheckout();
    loadNextBatch();
    window.addEventListener('scroll', handleScroll);
  })
   .catch(err => {
    console.error('Error loading products:', err);
    removeSkeletons();
    productsContainer.innerHTML = '<p>Error loading products. Please try again later.</p>';
  });

  //
function toggleActionVisible() {
  const actionDivs = document.querySelectorAll('.actions');

  actionDivs.forEach(div => {
    const hasDecrease = div.querySelector('.decrease') !== null;
    const hasIncrease = div.querySelector('.increase') !== null;

    if (hasDecrease && hasIncrease) {
      div.classList.add('action-visible');
    } else {
      div.classList.remove('action-visible');
    }
  });

  // ➕ Dashboard logic here:
  const dashboard = document.getElementById('dashboard-overlay');
  const anyVisible = document.querySelector('.action-visible');

  if (dashboard && anyVisible) {
    dashboard.classList.add('active');
  } else if (dashboard) {
    dashboard.classList.remove('active');
  }
}

// Run once DOM is ready
document.addEventListener('DOMContentLoaded', toggleActionVisible);

// Re-run on DOM changes
const observer = new MutationObserver(toggleActionVisible);
observer.observe(document.body, { childList: true, subtree: true });
