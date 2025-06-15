// Existing code for mobile input and clear icon
const mobileInput = document.getElementById('mobile');
const clearIcon = document.querySelector('.clear-icon');
mobileInput.addEventListener('input', function (e) {
  this.value = this.value.replace(/[^0-9]/g, '');
  clearIcon.style.display = this.value.length > 0 ? 'block' : 'none';
});
clearIcon.addEventListener('click', function () {
  mobileInput.value = '';
  localStorage.removeItem('savedMobile');
  clearIcon.style.display = 'none';
  document.getElementById('result').innerHTML = '';
  document.getElementById('filterTags').innerHTML = '';
});

// Check for saved mobile number on page load
window.addEventListener('load', function () {
  const savedMobile = localStorage.getItem('savedMobile');
  if (savedMobile) {
    mobileInput.value = savedMobile;
    clearIcon.style.display = savedMobile.length > 0 ? 'block' : 'none';
    searchOrder();
  }
});

function formatDate(utcDate) {
  if (!utcDate || utcDate === 'N/A') return 'N/A';
  return new Date(utcDate).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
}

async function searchOrder() {
  const mobile = mobileInput.value.trim();
  const resultDiv = document.getElementById('result');
  const loader = document.getElementById('loader');
  const filterTags = document.getElementById('filterTags');
  resultDiv.innerHTML = '';
  filterTags.innerHTML = '';
  loader.style.display = 'block';
  mobileInput.classList.remove('invalid');

  // Validate mobile number (exactly 10 digits)
  if (!/^\d{10}$/.test(mobile)) {
    loader.style.display = 'none';
    resultDiv.innerHTML = '<p class="error"><i class="fa-solid fa-heart-crack"></i> Please enter a valid 10-digit mobile number.</p>';
    mobileInput.classList.add('invalid');
    return;
  }
  localStorage.setItem('savedMobile', mobile);
  try {
    const response = await fetch(`https://script.google.com/macros/s/AKfycbx3duJLyCpMpvdOrEk4_ixxb4ooXM9rB8rPmP-Uk8hqvx00XAfjL135J8mZZWIy2jz5/exec?mobile=${mobile}`);
    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));
    loader.style.display = 'none';
    if (data.success && Array.isArray(data.orders) && data.orders.length > 0) {
      const statusCounts = {};
      data.orders.forEach(order => {
        const status = order['Orders'] ? order['Orders'].toLowerCase().replace(/\s+/g, '-') : 'opened';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });

      // Create filter tags
      let filterOutput = '<span class="tag" data-status="all">All (' + data.orders.length + ')</span>';
      for (const status in statusCounts) {
        const displayStatus = status === 'opened' ? 'Opened' : status.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        filterOutput += `<span class="tag" data-status="${status}">${displayStatus} (${statusCounts[status]})</span>`;
      }
      filterTags.innerHTML = filterOutput;

      // Add click event listeners to tags
      const tags = filterTags.getElementsByClassName('tag');
      let currentFilter = 'all';
      for (const tag of tags) {
        tag.addEventListener('click', function () {
          for (const t of tags) t.classList.remove('active');
          this.classList.add('active');
          currentFilter = this.getAttribute('data-status');

          let output = '';
          data.orders.forEach((order, index) => {
            if (currentFilter !== 'all' && (order['Orders'] ? order['Orders'].toLowerCase().replace(/\s+/g, '-') : 'opened') !== currentFilter) return;

            const riceBrand = order['Brand'] || 'N/A';
            const weightPerBag = order['Weight per Bag'] || 'N/A';
            const totalBags = order['Bags'] || 'N/A';
            const totalPrice = order['Total Price'] || 'N/A';
            const orderStatus = order['Orders'] || 'Opened';
            const statusClass = order['Orders'] ? 'status-' + order['Orders'].toLowerCase().replace(/\s+/g, '-') : 'status-opened';
            const timestamp = formatDate(order['timestamp']) || 'N/A';
            const name = order['Name'] || 'N/A';
            const address = order['Address'] || 'N/A';
            const gpsLocation = order['GPS Location'] || 'N/A';

            const allFieldsNA = [riceBrand, weightPerBag, totalBags, totalPrice, orderStatus, timestamp, name, address, gpsLocation].every(val => val === 'N/A');
            let rawData = '';
            if (allFieldsNA) {
              rawData = `
                                <p><strong>Raw Order Data (for debugging):</strong></p>
                                <pre class="raw-data">${JSON.stringify(order, null, 2)}</pre>
                            `;
            }

            output += `
                            <div class="order" id="downloadDiv-${index}>
                            <button class="download-btn" data-index="${index}" title="Download Order Details">
                                <i class="fa-solid fa-file-pdf"></i>
                            </button>
                                <h3>Order ${index + 1}</h3>
                                <p><strong>Ordered On:</strong> ${timestamp}</p>
                                <p><strong>Name:</strong> ${name}</p>
                                <p><strong>Rice Brand:</strong> ${riceBrand}</p>
                                <p><strong>Weight Per Bag:</strong> ${weightPerBag}</p>
                                <p><strong>Total Bags:</strong> ${totalBags}</p>
                                <p><strong>Total Price:</strong> ${totalPrice}</p>
                                <p class="address-none"><strong>Address:</strong> ${address}</p>
                                <p class="gps-location"><strong>GPS Location:</strong> <a href="${gpsLocation}" target="_blank" rel="noopener noreferrer">View Location</a></p>
                                <p class="${statusClass}"><strong>Status:</strong> ${orderStatus}</p>
                                ${rawData}
                            </div>
                        `;
          });
          resultDiv.innerHTML = output || '<p class="error"><i class="fa-solid fa-face-frown"></i> No orders found for this status.</p>';
        });
      }

      tags[0].classList.add('active');
      tags[0].click();
    } else {
      resultDiv.innerHTML = '<p class="error"><i class="fa-solid fa-face-frown"></i> ' + (data.message || 'No orders found.') + '</p>';
    }
  } catch (error) {
    console.error('Error fetching order details:', error);
    loader.style.display = 'none';
    resultDiv.innerHTML = '<p class="error"><i class="fa-solid fa-face-frown"></i> Error fetching order details. Please try again later.</p>';
  }
}

// Add event listener for PDF download with loading indicator
// Add event listener for PDF download with loading indicator
document.addEventListener('DOMContentLoaded', () => {
  document.addEventListener('click', (event) => {
    if (event.target.closest('.download-btn')) {
      const target = event.target.closest('.download-btn');
      const index = target.getAttribute('data-index');
      const orderDiv = document.querySelector(`#downloadDiv-${index}`);

      if (!orderDiv) {
        console.error(`Order div with ID downloadDiv-${index} not found.`);
        return;
      }

      // Create loader
      const loader = document.createElement('div');
      loader.className = 'pdf-loader';
      loader.innerHTML = '<span>Generating PDF...</span>'; // Avoid Font Awesome for loader
      orderDiv.appendChild(loader);

      // Disable to prevent multiple clicks
      target.style.pointerEvents = 'none';

      // Clone the order div to avoid modifying the original
      const orderClone = orderDiv.cloneNode(true);

      // Remove unwanted elements from the clone
      const downloadBtn = orderClone.querySelector('.download-btn');
      if (downloadBtn) downloadBtn.remove();
      const clonedLoader = orderClone.querySelector('.pdf-loader');
      if (clonedLoader) clonedLoader.remove();
      const icons = orderClone.querySelectorAll('i.fa-solid');
      icons.forEach(icon => icon.remove());
      const gpsLink = orderClone.querySelector('.gps-location');
      if (gpsLink) gpsLink.innerHTML = '<strong>GPS Location:</strong> [Link Removed for PDF]'; // Replace link

      // Apply PDF-friendly styles
      orderClone.style.position = 'static';
      orderClone.style.display = 'block';
      orderClone.style.width = '100%';
      orderClone.style.background = '#fff';
      orderClone.style.padding = '20px';
      orderClone.style.boxSizing = 'border-box';
      orderClone.style.fontFamily = 'Arial, sans-serif';
      orderClone.style.color = '#000';
      orderClone.style.overflow = 'visible';

      // Style child elements
      const children = orderClone.querySelectorAll('p, h3');
      children.forEach(child => {
        child.style.color = '#000';
        child.style.margin = '5px 0';
        child.style.fontFamily = 'Arial, sans-serif';
      });

      // Temporarily append clone off-screen
      orderClone.style.position = 'absolute';
      orderClone.style.left = '-9999px';
      document.body.appendChild(orderClone);

      const opt = {
        margin: 0.5,
        filename: `order-${parseInt(index) + 1}-details.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: true, // Enable for debugging
        },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      };

      // Delay to ensure DOM rendering
      setTimeout(() => {
        console.log('Cloned content for PDF:', orderClone.innerHTML); // Debug
        html2pdf()
          .from(orderClone)
          .set(opt)
          .save()
          .then(() => {
            loader.remove();
            target.style.pointerEvents = 'auto';
            orderClone.remove();
          })
          .catch((error) => {
            console.error('Error generating PDF:', error);
            loader.remove();
            target.style.pointerEvents = 'auto';
            orderClone.remove();
            alert('Error generating PDF. Please try again.');
          });
      }, 200); 
    }
  });
});
