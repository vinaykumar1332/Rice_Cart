  document.getElementById('mobile').addEventListener('input', function(e) {
      this.value = this.value.replace(/[^0-9]/g, '');
    });
 
 function formatDate(utcDate) {
      if (!utcDate || utcDate === 'N/A') return 'N/A';
      return new Date(utcDate).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    }

document.getElementById('mobile').classList.remove('invalid');
    async function searchOrder() {
      const mobile = document.getElementById('mobile').value.trim();
      const resultDiv = document.getElementById('result');
      const loader = document.getElementById('loader');
      const filterTags = document.getElementById('filterTags');
      resultDiv.innerHTML = '';
      filterTags.innerHTML = '';
      loader.style.display = 'block';

      // Validate mobile number (basic check for 10 digits)
      if (!/^\d{10}$/.test(mobile)) {
        loader.style.display = 'none';
        resultDiv.innerHTML = '<p class="error">Please enter a valid 10-digit mobile number.</p>';
        return;
      }

      try {
        const response = await fetch(`https://script.google.com/macros/s/AKfycbx3duJLyCpMpvdOrEk4_ixxb4ooXM9rB8rPmP-Uk8hqvx00XAfjL135J8mZZWIy2jz5/exec?mobile=${mobile}`);
        const data = await response.json();
        console.log('Response data:', JSON.stringify(data, null, 2)); // Pretty-print response for debugging

        loader.style.display = 'none';

        if (data.success && Array.isArray(data.orders) && data.orders.length > 0) {
          const statusCounts = {};
          data.orders.forEach(order => {
            const status = order['Orders'] || 'Unknown';
            statusCounts[status] = (statusCounts[status] || 0) + 1;
          });
          let filterOutput = '<span class="tag" data-status="all">All (' + data.orders.length + ')</span>';
          for (const status in statusCounts) {
            filterOutput += `<span class="tag" data-status="${status}">${status} (${statusCounts[status]})</span>`;
          }
          filterTags.innerHTML = filterOutput;
          const tags = filterTags.getElementsByClassName('tag');
          let currentFilter = 'all';
          for (const tag of tags) {
            tag.addEventListener('click', function() {
              for (const t of tags) t.classList.remove('active');
              this.classList.add('active');
              currentFilter = this.getAttribute('data-status');
              let output = '';
              data.orders.forEach((order, index) => {
                if (currentFilter !== 'all' && order['Orders'] !== currentFilter) return;

                const riceBrand = order['Brand'] || 'N/A';
                const weightPerBag = order['Weight per Bag'] || 'N/A';
                const totalBags = order['Bags'] || 'N/A';
                const totalPrice = order['Total Price'] || 'N/A';
                const orderStatus = order['Orders'] || 'N/A';
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
                    <p><strong>Address:</strong> ${address}</p>
                    <p><strong>Status:</strong> ${orderStatus}</p>
                    ${rawData}
                  </div>
                `;
              });
              resultDiv.innerHTML = output || '<p class="error">No orders found for this status.</p>';
            });
          }
          tags[0].classList.add('active');
          tags[0].click();
        } else {
          resultDiv.innerHTML = '<p class="error">' + (data.message || 'No orders found.') + '</p>';
        }
      } catch (error) {
        console.error('Error fetching order details:', error);
        loader.style.display = 'none';
        resultDiv.innerHTML = '<p class="error">Error fetching order details. Please try again later.</p>';
      }
    }