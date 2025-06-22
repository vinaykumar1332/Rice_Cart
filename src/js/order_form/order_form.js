const scriptURL = "https://script.google.com/macros/s/AKfycbxs1Vigr-HLZO1co-Ht6itcH_49kRbzJE_QLFMz0AkvTVPFICsF8bbz59qsJWhnGrXU/exec";
    const form = document.forms["submit-to-google-sheet"];
    const loader = document.getElementById("loader");
    const submitBtn = form.querySelector('button[type="submit"]');
    let locationCaptured = false;

    const fields = {
      name: document.getElementById("name"),
      mobile: document.getElementById("mobile"),
      address: document.getElementById("address"),
      terms: document.getElementById("ex"),
      brand: document.getElementById("brand"),
      bags: document.getElementById("bags"),
      weightPerBag: document.getElementById("weightPerBag"),
      basePrice: document.getElementById("basePrice"),
      totalPrice: document.getElementById("totalPrice"),
      orderId: document.getElementById("orderId"),
      productId: document.getElementById("productId"),
      latitude: document.getElementById("latitude"),
      longitude: document.getElementById("longitude"),
      mapsUrl: document.getElementById("mapsUrl")
    };

    function getLocation() {
      const locationBtn = document.querySelector(".location-btn");
      loader.style.display = "flex";
      locationBtn.disabled = true;

      if (!navigator.geolocation) {
        handleLocationError("Geolocation is not supported by this browser.");
        return;
      }

      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          const { latitude, longitude } = coords;
          fields.latitude.value = latitude ?? "Unavailable";
          fields.longitude.value = longitude ?? "Unavailable";
          fields.mapsUrl.value = `https://www.google.com/maps?q=${latitude},${longitude}`;
          locationCaptured = true;
          Swal.fire({ icon: "success", title: "Location Captured", timer: 1000, showConfirmButton: false });
          loader.style.display = "none";
          locationBtn.disabled = false;
        },
        (error) => {
          handleLocationError(getErrorMessage(error));
          fields.latitude.value = fields.longitude.value = fields.mapsUrl.value = "Unavailable";
          locationCaptured = false;
        },
        { timeout: 5000 }
      );
    }

    function handleLocationError(message) {
      Swal.fire({ icon: "error", title: "Error", text: message, timer: 1500, showConfirmButton: false });
      loader.style.display = "none";
      document.querySelector(".location-btn").disabled = false;
    }

    function getErrorMessage(error) {
      switch (error.code) {
        case error.PERMISSION_DENIED: return "Location access denied.";
        case error.POSITION_UNAVAILABLE: return "Location unavailable.";
        case error.TIMEOUT: return "Location request timed out.";
        default: return "Unable to capture location.";
      }
    }

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      if (!validateForm()) return;
      if (!locationCaptured) {
        Swal.fire({ icon: "warning", title: "Location Required", text: "Please share your location.", timer: 1500, showConfirmButton: false });
        return;
      }

      loader.style.display = "flex";
      submitBtn.disabled = true;

      const formData = new FormData(form);
      formData.append("Terms Agreed", fields.terms.checked ? "Yes" : "No");

      fetch(scriptURL, { method: "POST", body: formData })
        .then(() => {
          sessionStorage.removeItem("cart");
          showThankYouOverlay(fields.orderId.value);
        })
        .catch(() => Swal.fire({ icon: "error", title: "Error", text: "Submission failed. Try again!", timer: 1500, showConfirmButton: false }))
        .finally(() => {
          loader.style.display = "none";
          submitBtn.disabled = false;
        });
    });

    function validateForm() {
      let isValid = true;

      if (!fields.mobile.value.match(/^\d{10}$/)) {
        showError(fields.mobile, "Enter a valid 10-digit mobile number.");
        isValid = false;
      } else {
        clearError(fields.mobile);
      }

      if (!fields.address.value.trim()) {
        showError(fields.address, "Address is required.");
        isValid = false;
      } else {
        clearError(fields.address);
      }

      if (!fields.terms.checked) {
        showError(fields.terms, "You must agree to the Terms.");
        isValid = false;
      } else {
        clearError(fields.terms);
      }

      if (!isValid) {
        Swal.fire({ icon: "warning", title: "Invalid Input", text: "Please correct the errors.", timer: 1500, showConfirmButton: false });
      }

      return isValid;
    }

    function showError(input, message) {
      input.classList.add("is-invalid");
      const feedback = input.parentElement.querySelector(".invalid-feedback") || Object.assign(document.createElement("div"), { className: "invalid-feedback" });
      feedback.innerText = message;
      input.parentElement.appendChild(feedback);
    }

    function clearError(input) {
      input.classList.remove("is-invalid");
      const feedback = input.parentElement.querySelector(".invalid-feedback");
      if (feedback) feedback.innerText = "";
    }

    fields.mobile.addEventListener("input", () => {
      fields.mobile.value = fields.mobile.value.replace(/\D/g, "").slice(0, 10);
    });

    window.addEventListener("DOMContentLoaded", () => {
      const cartData = JSON.parse(sessionStorage.getItem("cart")) || [];

      if (cartData.length === 0) {
        disableForm();
        return;
      }

      const item = cartData[0]; // Assuming single item for simplicity
      const total = item.weightPerBag * item.bags * item.basePrice;

      fields.productId.value = item.id;
      fields.brand.value = item.brand;
      fields.bags.value = item.bags;
      fields.weightPerBag.value = `${item.weightPerBag} kg`;
      fields.basePrice.value = `₹${item.basePrice}`;
      fields.totalPrice.value = `₹${total.toLocaleString()}`;
      fields.orderId.value = generateOrderID();
    });

    function disableForm() {
      [fields.brand, fields.bags, fields.weightPerBag, fields.basePrice, fields.totalPrice].forEach(field => {
        field.value = "No items in cart";
        field.classList.add("text-muted");
      });
      fields.orderId.value = "";
      submitBtn.disabled = true;
    }

    function generateOrderID() {
      return Array.from({ length: 10 }, () => "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random() * 62)]).join("");
    }

function showThankYouOverlay(orderId) {
  const overlay = document.createElement("div");
  overlay.style.cssText = `
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: #ffffff;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    animation: fadeIn 0.5s ease-in-out;
  `;

  overlay.innerHTML = `
    <style>
      @keyframes fadeIn {
        from { opacity: 0; transform: scale(0.9); }
        to { opacity: 1; transform: scale(1); }
      }
      .thank-you-box {
        max-width: 400px;
        background: #f9f9f9;
        padding: 30px;
        border-radius: 15px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        text-align: center;
        animation: fadeIn 0.5s ease;
      }
      .thank-you-box h2 {
        margin-bottom: 10px;
        color: #28a745;
        font-size: 26px;
      }
      .thank-you-box p {
        margin: 10px 0;
        color: #444;
      }
      .thank-you-buttons {
        margin-top: 20px;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .thank-you-buttons a {
        text-decoration: none;
        background: #007bff;
        color: white;
        padding: 10px 15px;
        border-radius: 8px;
        font-weight: bold;
        transition: background 0.3s;
      }
      .thank-you-buttons a:hover {
        background: #0056b3;
      }
      @media (max-width: 480px) {
        .thank-you-box {
          width: 100%;
          padding: 20px;
        }
      }
    </style>
    <div class="thank-you-box">
      <h2>🎉 Order Placed Successfully!</h2>
      <p>Your order has been received and is being processed.</p>
          <div class="thank-you-buttons">
        <a href="https://vinaykumar1332.github.io/Rice_Cart/myOrders.html">🔍 Track Order</a>
        <a href="https://vinaykumar1332.github.io/Rice_Cart/product.html">Continue Shopping</a>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  form.reset();
  fields.latitude.value = fields.longitude.value = fields.mapsUrl.value = fields.productId.value = "";
  locationCaptured = false;
}


    document.getElementById('showTerms').addEventListener('click', function (e) {
  e.preventDefault();
  showOverlay('Terms of Service', `
    <p>These are the terms of service. Please read them carefully before agreeing to proceed with the service.</p>
    <ul>
      <li>No unauthorized use.</li>
      <li>Respect user privacy.</li>
      <li>Comply with applicable laws.</li>
    </ul>
  `);
});

document.getElementById('showPrivacy').addEventListener('click', function (e) {
  e.preventDefault();
  showOverlay('Privacy Policy', `
    <p>This privacy policy explains how we handle your data.</p>
    <ul>
      <li>We do not sell your information.</li>
      <li>Data is stored securely.</li>
      <li>You have control over your data.</li>
    </ul>
  `);
});

document.getElementById('closeOverlay').addEventListener('click', function () {
  document.getElementById('overlay').style.display = 'none';
});

function showOverlay(title, htmlContent) {
  const overlay = document.getElementById('overlay');
  const overlayText = document.getElementById('overlayText');
  overlayText.innerHTML = `<h3>${title}</h3>${htmlContent}`;
  overlay.style.display = 'flex';
}