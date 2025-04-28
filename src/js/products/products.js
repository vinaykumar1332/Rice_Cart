const productsContainer = document.getElementById('productsContainer');
const cart = [];

// --- Toast Notification Setup ---
const toastContainer = document.createElement('div');
toastContainer.id = 'toast-container';
document.body.appendChild(toastContainer);

function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 8000); // remove after 3 seconds
}

// --- Create Product Card ---
function createProductCard(product) {
  const card = document.createElement('div');
  card.className = 'product-card';
  card.dataset.brand = product.brand;
  card.dataset.basePrice = product.basePrice;

  let quantityCount = 0; // For showing added quantity

  card.innerHTML = `
    <img src="./src/assets/images/${product.imageName}" alt="${product.brand}" class="product-img">
    <h3 class="product-name">${product.brand}</h3>
    <select class="quantity-select">
      <option value="">Select Quantity</option>
      <option value="5">5 kg</option>
      <option value="10">10 kg</option>
      <option value="25">25 kg</option>
    </select>
    <div class="price-info">
      <span class="price">₹0</span>
      <span class="price-per-kg">₹${product.basePrice} per kg</span>
    </div>
    <button class="add-to-cart">Add <span class="count">(0)</span></button>
  `;

  productsContainer.appendChild(card);

  const quantitySelect = card.querySelector('.quantity-select');
  const priceDisplay = card.querySelector('.price');
  const addButton = card.querySelector('.add-to-cart');
  const countSpan = addButton.querySelector('.count');

  // Update price when quantity selected
  quantitySelect.addEventListener('change', () => {
    const quantity = parseInt(quantitySelect.value);
    if (quantity) {
      const totalPrice = product.basePrice * quantity;
      priceDisplay.textContent = `₹${totalPrice}`;
    } else {
      priceDisplay.textContent = `₹0`;
    }
  });

  // Add to cart
  addButton.addEventListener('click', () => {
    const quantity = parseInt(quantitySelect.value);

    if (!quantity) {
      showToast('Please select a quantity first!', 'error');
      return;
    }

    cart.push({
      id: product.id,
      brand: product.brand,
      quantity,
      basePrice: product.basePrice,
      totalPrice: product.basePrice * quantity
    });

    quantityCount++;
    countSpan.textContent = `(${quantityCount})`;

    showToast(`${product.brand} (${quantity} kg) added to cart!`, 'success');
  });
}

// --- Fetch products JSON ---
fetch('./src/json/product.json')
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  })
  .then(productsData => {
    if (!Array.isArray(productsData)) {
      throw new Error('Invalid products data format');
    }
    productsData.forEach(product => {
      if (product.brand && product.basePrice && product.imageName) {
        createProductCard(product);
      } else {
        console.error('Product data missing required fields:', product);
      }
    });
  })
  .catch(error => {
    console.error('Error loading products:', error);
    showToast('Failed to load products.', 'error');
  });

// --- Handle Next button ---
document.getElementById('go-to-dashboard').addEventListener('click', () => {
  if (cart.length === 0) {
    showToast('Please add at least one product!', 'error');
    return;
  }
  sessionStorage.setItem('cart', JSON.stringify(cart));
  window.location.href = 'dashboard.html';
});
