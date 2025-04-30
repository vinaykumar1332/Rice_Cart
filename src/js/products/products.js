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

function createProductCard(product) {
  const card = document.createElement('div');
  card.className = 'product-card';
  card.dataset.id = product.id;

  card.innerHTML = `
    <div class="product-card-image">
      <img src="./src/assets/images/${product.imageName}" alt="${product.brand}" class="product-img">
    </div>
    <div class="product-info">
      <h3 class="product-name">${product.brand}</h3>
      <p class="product-bag-price">Select weight to see price</p>
      <select id="quantity-${product.id}" class="quantity-select">
        <option value="">Select kgs</option>
        <option value="5">5 kg</option>
        <option value="10">10 kg</option>
        <option value="25">25 kg</option>
      </select>
      <div class="actions">
        <button class="add-to-cart">Add to Cart</button>
      </div>
    </div>
  `;

  const quantitySelect = card.querySelector('.quantity-select');
  const bagPriceText = card.querySelector('.product-bag-price');
  const actions = card.querySelector('.actions');

  quantitySelect.addEventListener('change', () => {
    const selectedWeight = parseInt(quantitySelect.value);
    if (!selectedWeight) {
      bagPriceText.textContent = 'Select weight to see price';
    } else {
      const bagPrice = selectedWeight * product.basePrice;
      bagPriceText.textContent = `₹${bagPrice} per bag`;
    }
  });

  card.addEventListener('click', (e) => {
    const selectedWeight = parseInt(quantitySelect.value);
    const id = product.id;

    if (e.target.classList.contains('add-to-cart')) {
      if (!selectedWeight) return;
      const existing = cart.find(i => i.id === id && i.weightPerBag === selectedWeight);
      if (!existing) {
        cart.push({ id, brand: product.brand, weightPerBag: selectedWeight, bags: 1, basePrice: product.basePrice });
      } else {
        existing.bags++;
      }
      updateCartUI();
      toggleCheckout();
      updateDashboard();
    }

    if (e.target.classList.contains('increase')) {
      const item = cart.find(i => i.id === id && i.weightPerBag === selectedWeight);
      if (item) {
        item.bags++;
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

  productsContainer.appendChild(card);
}

function loadNextBatch() {
  const nextBatch = products.slice(currentIndex, currentIndex + BATCH_SIZE);
  nextBatch.forEach(createProductCard);
  currentIndex += BATCH_SIZE;
}

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

fetch('./src/json/product.json')
  .then(res => res.json())
  .then(data => {
    if (!Array.isArray(data)) throw new Error('Invalid data');
    products = data.filter(p => p.id && p.brand && p.imageName && p.basePrice);
    showSkeletons();
    setTimeout(() => {
      removeSkeletons();
      loadNextBatch();
      window.addEventListener('scroll', handleScroll);
    }, 800);
  })
  .catch(err => {
    console.error('Error loading products:', err);
  });

  card.addEventListener('click', (e) => {
    const selectedWeight = parseInt(quantitySelect.value);
    const id = product.id;
  
    if (!selectedWeight) return;
  
    let existingItem = cart.find(i => i.id === id && i.weightPerBag === selectedWeight);
  
    if (e.target.classList.contains('add-to-cart')) {
      if (!existingItem) {
        cart.push({ id, brand: product.brand, weightPerBag: selectedWeight, bags: 1, basePrice: product.basePrice });
      } else {
        existingItem.bags += 1;
      }
      bags = existingItem ? existingItem.bags : 1;
      updateCartUI();
      toggleCheckout();
      updateDashboard(); // real-time update
    }
  
    if (e.target.classList.contains('increase')) {
      if (existingItem) {
        existingItem.bags += 1;
        bags = existingItem.bags;
      } else {
        cart.push({ id, brand: product.brand, weightPerBag: selectedWeight, bags: 1, basePrice: product.basePrice });
        bags = 1;
      }
      updateCartUI();
      toggleCheckout();
      updateDashboard();
    }
  
    if (e.target.classList.contains('decrease')) {
      if (existingItem) {
        existingItem.bags -= 1;
        if (existingItem.bags <= 0) {
          cart = cart.filter(i => !(i.id === id && i.weightPerBag === selectedWeight));
          bags = 0;
          resetCartUI();
        } else {
          bags = existingItem.bags;
          updateCartUI();
        }
        toggleCheckout();
        updateDashboard();
      }
    }
  });
  