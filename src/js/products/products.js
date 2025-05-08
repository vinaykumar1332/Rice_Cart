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
let currentIndex = 0;
const BATCH_SIZE = 5;

// Skeleton loaders
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
    productsContainer.appendChild(skeleton);
  }
}

function removeSkeletons() {
  document.querySelectorAll('.skeleton-card').forEach(el => el.remove());
}

// Product Card Creation
function createProductCard(product) {
  if (!product) return;
  const card = document.createElement('div');
  card.className = 'product-card';
  card.setAttribute('data-id', product.id);
  card.setAttribute('data-status', product.status);

  const isOutOfStock = product.status !== 'Active';
  if (isOutOfStock) { 
    card.classList.add('out-of-stock');
    card.setAttribute('data-out-of-stock', true);
  }
  if (product.status === 'Inactive') {
    card.classList.add('inactive');
    card.setAttribute('data-inactive', true);
  }


  card.innerHTML = `
    <div class="product-card-image">
      <img src="${product.imageURL}" alt="${product.brand}" class="product-img">
    </div>
    <div class="product-info">
      <h3 class="product-name">${product.brand}</h3>
      <p class="product-type">${product.type}</p>
      <p class="product-bag-price">${isOutOfStock ? 'Out of Stock' : 'Select weight to see price'}</p>
      <select id="quantity-${product.id}" class="quantity-select" ${isOutOfStock ? 'disabled' : ''}>
        <option value="">Select kgs</option>
        <option value="5">5 kg</option>
        <option value="10">10 kg</option>
        <option value="25">25 kg</option>
      </select>
      <div class="actions">
        ${isOutOfStock ? '' : '<button class="add-to-cart">Add to Cart</button>'}
      </div>
    </div>
  `;

  if (!isOutOfStock) {
    const quantitySelect = card.querySelector('.quantity-select');
    const bagPriceText = card.querySelector('.product-bag-price');
    const actions = card.querySelector('.actions');

    quantitySelect.addEventListener('change', () => {
      const selectedWeight = parseInt(quantitySelect.value);
      if (!selectedWeight) {
        bagPriceText.textContent = 'Select weight to see price';
      } else {
        const bagPrice = selectedWeight * product.pricePerKg;
        bagPriceText.textContent = `₹${bagPrice} per bag`;
      }
    });

    card.addEventListener('click', (e) => {
      const selectedWeight = parseInt(quantitySelect.value);
      const id = product.id;

      if (!selectedWeight) return;

      const existing = cart.find(i => i.id === id && i.weightPerBag === selectedWeight);

      if (e.target.classList.contains('add-to-cart')) {
        if (!existing) {
          cart.push({ id, brand: product.brand, weightPerBag: selectedWeight, bags: 1, basePrice: product.pricePerKg });
        } else {
          existing.bags++;
        }
        updateCartUI();
        toggleCheckout();
        updateDashboard();
      }

      if (e.target.classList.contains('increase')) {
        if (existing) {
          existing.bags++;
          updateCartUI();
          toggleCheckout();
          updateDashboard();
        }
      }

      if (e.target.classList.contains('decrease')) {
        const itemIndex = cart.findIndex(i => i.id === id && i.weightPerBag === selectedWeight);
        if (itemIndex !== -1) {
          cart[itemIndex].bags--;
          if (cart[itemIndex].bags <= 0) {
            cart.splice(itemIndex, 1);
            actions.innerHTML = `<button class="add-to-cart">Add to Cart</button>`;
          } else {
            updateCartUI();
          }
          toggleCheckout();
          updateDashboard();
        }
      }

      function updateCartUI() {
        const item = cart.find(i => i.id === id && i.weightPerBag === selectedWeight);
        if (item) {
          actions.innerHTML = `
            <button class="decrease">-</button>
            <span class="qty">${item.bags} bag(s)</span>
            <button class="increase">+</button>
          `;
        }
      }
    });
  }

  productsContainer.appendChild(card);
}

// Load products in batches
function loadNextBatch() {
  const nextBatch = products.slice(currentIndex, currentIndex + BATCH_SIZE);
  nextBatch.forEach(createProductCard);
  currentIndex += BATCH_SIZE;
}

// Scroll Listener
function handleScroll() {
  const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
  if (scrollTop + clientHeight >= scrollHeight - 10) {
    showSkeletons();
    setTimeout(() => {
      removeSkeletons();
      loadNextBatch();
    }, 800);
  }
}

// Dashboard/Cart Summary
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
}

// Checkout + Overlay Controls
checkoutBtn.addEventListener('click', () => {
  if (cart.length === 0) return;
  updateDashboard();
  checkoutBtn.style.display = 'none';
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

// Fetch Google Sheets Data (via JSON file or published endpoint)
fetch('https://script.google.com/macros/s/AKfycbyzWON1jTLeHZRoex8pBjxtGMjuZ84OGd9xAtec15FxcO_sTv9v1NMa8WHrRMwI8cDM/exec') // replace with your sheet URL if needed
  .then(res => res.json())
  .then(data => {
    products = data.map(row => ({
      id: row.ID,
      brand: row.Brand,
      type: row.Type,
      quantity: parseInt(row.Quantity?.trim?.()) || 0,
      pricePerKg: parseFloat(row.PricePerKg),
      imageURL: (row.ImageURL || row['\tImageURL'] || '').trim() || 'https://via.placeholder.com/100x100',
      status: row.Status?.trim?.() || 'Inactive'
    }));
    showSkeletons();
    setTimeout(() => {
      removeSkeletons();
      loadNextBatch();
      window.addEventListener('scroll', handleScroll);
    }, 800);
  })
  .catch(err => console.error('Error loading products:', err));
