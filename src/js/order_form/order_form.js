const scriptURL =
  "https://script.google.com/macros/s/AKfycbxs1Vigr-HLZO1co-Ht6itcH_49kRbzJE_QLFMz0AkvTVPFICsF8bbz59qsJWhnGrXU/exec";

const form = document.forms["submit-to-google-sheet"];
const loader = document.getElementById("loader");
const submitBtn = form.querySelector('button[type="submit"]');

let locationCaptured = false;

function getLocation() {
    const locationBtn = document.querySelector(".location-btn");
  
    loader.style.display = "block";
    locationBtn.disabled = true;
  
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;
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
          switch (error.code) {
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
  }

form.addEventListener("submit", function (e) {
  e.preventDefault();

  if (!locationCaptured) {
    swal("Warning", "Please capture your location before submitting.", "warning");
    return;
  }

  const formData = new FormData(form);
  const ex = document.getElementById("ex").checked;
  formData.append("ex", ex ? "Yes" : "No");

  // Show loader and disable button
  loader.style.display = "block";
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
      // Hide loader and enable button
      loader.style.display = "none";
      submitBtn.disabled = false;
    });
}

document.getElementById("mobile").addEventListener("input", function (e) {
  this.value = this.value.replace(/\D/g, ""); 
  if (this.value.length > 10) {
    this.value = this.value.slice(0, 10);
  }
});
