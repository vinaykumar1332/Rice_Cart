const scriptURL = "https://script.google.com/macros/s/AKfycbxs1Vigr-HLZO1co-Ht6itcH_49kRbzJE_QLFMz0AkvTVPFICsF8bbz59qsJWhnGrXU/exec";
const form = document.forms["submit-to-google-sheet"];
const loader = document.getElementById("loader");
const submitBtn = form.querySelector('button[type="submit"]');
let locationCaptured = false;

// Get form fields
const nameInput = document.getElementById("name");
const mobileInput = document.getElementById("mobile");
const addressInput = document.getElementById("address");
const termsCheckbox = document.getElementById("ex");

function getLocation() {
  const locationBtn = document.querySelector(".location-btn");
  loader.style.display = "flex";
  locationBtn.disabled = true;

  // Delay fetching location by 300ms
  setTimeout(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const latitude = position?.coords?.latitude ?? "Unavailable";
          const longitude = position?.coords?.longitude ?? "Unavailable";
          const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
          document.getElementById("latitude").value = latitude;
          document.getElementById("longitude").value = longitude;
          document.getElementById("mapsUrl").value = mapsUrl;
          locationCaptured = true;
          swal("Success", "Location captured successfully!", "success");
          loader.style.display = "none";
          locationBtn.disabled = false;
        },
        (error) => {
          locationCaptured = false;
          document.getElementById("latitude").value = "Unavailable";
          document.getElementById("longitude").value = "Unavailable";
          document.getElementById("mapsUrl").value = "Unavailable";

          let errorMessage = "Unable to capture location.";
          switch (error?.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Location access denied by user.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location information is unavailable.";
              break;
            case error.TIMEOUT:
              errorMessage = "Location request timed out.";
              break;
            default:
              errorMessage = "An unknown error occurred.";
              break;
          }
          swal("Error", errorMessage, "error");
          loader.style.display = "none";
          locationBtn.disabled = false;
        }
      );
    } else {
      locationCaptured = false;
      document.getElementById("latitude").value = "Not Supported";
      document.getElementById("longitude").value = "Not Supported";
      document.getElementById("mapsUrl").value = "Not Supported";

      swal("Error", "Geolocation is not supported by this browser.", "error");
      loader.style.display = "none";
      locationBtn.disabled = false;
    }
  }, 300); // 300ms delay
}

form.addEventListener("submit", function (e) {
  e.preventDefault();

  // Client-side Validation
  let isValid = true;

  if (!nameInput.value.trim()) {
    showError(nameInput, "Name is required.");
    isValid = false;
  } else {
    clearError(nameInput);
  }

  if (!mobileInput.value.trim() || !/^\d{10}$/.test(mobileInput.value)) {
    showError(mobileInput, "Enter a valid 10-digit mobile number.");
    isValid = false;
  } else {
    clearError(mobileInput);
  }

  if (!addressInput.value.trim()) {
    showError(addressInput, "Address is required.");
    isValid = false;
  } else {
    clearError(addressInput);
  }

  if (!termsCheckbox.checked) {
    showError(termsCheckbox, "You must agree to the Terms.");
    isValid = false;
  } else {
    clearError(termsCheckbox);
  }

  if (!isValid) {
    swal("Warning", "Please fill all fields correctly.", "warning");
    return;
  }

  if (!locationCaptured) {
    swal("Warning", "Please capture your location before submitting.", "warning");
    return;
  }

  // If all valid
  const formData = new FormData(form);
  formData.append("ex", termsCheckbox.checked ? "Yes" : "No");

  loader.style.display = "flex";
  submitBtn.disabled = true;

  sendData(formData);
});

function sendData(formData) {
  fetch(scriptURL, {
    method: "POST",
    body: formData,
  })
    .then(() => {
      swal("Done", "Submitted Successfully.", "success");
      form.reset();
      locationCaptured = false;
      document.getElementById("latitude").value = "";
      document.getElementById("longitude").value = "";
      document.getElementById("mapsUrl").value = "";
    })
    .catch(() => {
      swal("Error", "Something went wrong. Please try again!", "error");
    })
    .finally(() => {
      loader.style.display = "none";
      submitBtn.disabled = false;
    });
}

function showError(input, message) {
  input.classList.add("is-invalid");
  let feedback = input.parentElement.querySelector(".invalid-feedback");
  if (!feedback) {
    feedback = document.createElement("div");
    feedback.className = "invalid-feedback";
    input.parentElement.appendChild(feedback);
  }
  feedback.innerText = message;
}

function clearError(input) {
  input.classList.remove("is-invalid");
  let feedback = input.parentElement.querySelector(".invalid-feedback");
  if (feedback) {
    feedback.innerText = "";
  }
}

// Force only numbers in Mobile input
mobileInput.addEventListener("input", function () {
  this.value = this.value.replace(/\D/g, "");
  if (this.value.length > 10) {
    this.value = this.value.slice(0, 10);
  }
});
