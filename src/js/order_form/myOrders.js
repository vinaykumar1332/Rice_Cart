 const mobileInput = document.getElementById('mobile');
    const clearIcon = document.querySelector('.clear-icon');
    mobileInput.addEventListener('input', function(e) {
      this.value = this.value.replace(/[^0-9]/g, '');
      clearIcon.style.display = this.value.length > 0 ? 'block' : 'none';
    });
    clearIcon.addEventListener('click', function() {
      mobileInput.value = '';
      localStorage.removeItem('savedMobile');
      clearIcon.style.display = 'none';
      document.getElementById('result').innerHTML = '';
      document.getElementById('filterTags').innerHTML = '';
    });

    // Check for saved mobile number on page load
    window.addEventListener('load', function() {
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

      // Save mobile number to localStorage
      localStorage.setItem('savedMobile', mobile);

      try {
        const response = await fetch(`https://script.google.com/macros/s/AKfycbx3duJLyCpMpvdOrEk4_ixxb4ooXM9rB8rPmP-Uk8hqvx00XAfjL135J8mZZWIy2jz5/exec?mobile=${mobile}`);
        const data = await response.json();
        console.log('Response data:', JSON.stringify(data, null, 2));

        loader.style.display = 'none';

        if (data.success && Array.isArray(data.orders) && data.orders.length > 0) {
          // Count orders by status
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
            tag.addEventListener('click', function() {
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
                  <div class="order">
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