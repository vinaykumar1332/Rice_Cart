document.addEventListener("DOMContentLoaded",()=>{let e=document.createElement("div");function t(t,n="error"){let a=document.createElement("div");a.style.padding="12px 20px",a.style.marginBottom="40%",a.style.borderRadius="4px",a.style.color="#fff",a.style.backgroundColor="error"===n?"#dc3545":"#28a745",a.style.boxShadow="0 2px 4px rgba(0,0,0,0.2)",a.style.opacity="0",a.style.transition="opacity 0.3s ease-in-out",a.textContent=t,e.appendChild(a),setTimeout(()=>{a.style.opacity="1"},100),setTimeout(()=>{a.style.opacity="0",setTimeout(()=>a.remove(),300)},3e3)}function n(){return!!navigator.onLine||(t("No internet connection"),!1)}async function a(){try{let e=performance.now();await fetch("https://script.google.com/macros/s/AKfycbzWIlg4U6L71j2jIOxt0Jh6EKvUSDbvrKf7F4AtsbLzY5_YZXjCj_nJ-0wMOjkpHY-G/exec",{mode:"no-cors",cache:"no-store"});let n=performance.now();if(n-e>4e3)return t("Slow network detected"),!1;return!0}catch(a){return t("Network error: Unable to reach server"),!1}}async function r(){n()&&await a()}e.style.position="fixed",e.style.top="40%",e.style.right="20px",e.style.zIndex="1000",document.body.appendChild(e),window.addEventListener("online",()=>{t("Back online","success")}),window.addEventListener("offline",()=>{t("Lost internet connection")}),r(),setInterval(r,5e4);let i=window.fetch;window.fetch=async function(...e){if(!n())return t("No network connection"),Promise.reject(Error("No network connection"));let a=performance.now();try{let r=await i(...e),s=performance.now();return s-a>9e3&&t("slow Network detected"),r}catch(o){throw t("API call failed"),o}};let s=document.getElementById("productsContainer"),o=document.getElementById("go-to-dashboard"),l=document.getElementById("dashboard-overlay"),c=document.getElementById("dashboard-content"),d=document.getElementById("checkout-final"),u=document.getElementById("modify-cart"),g=document.getElementById("close-overlay"),p=JSON.parse(sessionStorage.getItem("cart"))||[],y=[],f=[],h="",v="";function b(){let e=document.createElement("div");e.id="search-filter-container",e.innerHTML=`
      <input id="search-input" type="text" placeholder="Search by brand name..." />
      <select id="type-filter">
        <option value="">Select Type</option>
        <option value="">All</option>
      </select>
    `,s?.parentNode?.insertBefore(e,s);let t=document.createElement("div");t.id="count-container",t.innerHTML='<p id="filtered-count">0 results</p>',s?.parentNode?.insertBefore(t,s);let n=document.getElementById("search-input"),a=document.getElementById("type-filter"),r;n?.addEventListener("input",()=>{clearTimeout(r),r=setTimeout(()=>{h=n.value.trim().toLowerCase(),$()},300)}),a?.addEventListener("change",()=>{v=a.value,$()})}function m(){let e=document.getElementById("type-filter"),t=[...new Set(y.map(e=>e.type))].sort();t.forEach(t=>{let n=document.createElement("option");n.value=t,n.textContent=t,e?.appendChild(n)})}function $(){f=y.filter(e=>{let t=!h||e.name?.toLowerCase().includes(h)||e.brand?.toLowerCase().includes(h)||e.type?.toLowerCase().includes(h),n=!v||e.type===v;return t&&n}),s.innerHTML="",q(),S()}function L(e){s.innerHTML="";for(let t=0;t<Math.max(e,10);t++){let n=document.createElement("div");n.className="skeleton-card",n.innerHTML=`
        <div class="skeleton-img"></div>
        <div class="skeleton-info">
          <div class="skeleton-name"></div>
          <div class="skeleton-quantity"></div>
          <div class="skeleton-actions"></div>
        </div>
      `,s?.appendChild(n)}}function E(){document.querySelectorAll(".skeleton-card").forEach(e=>e.remove())}function w(e="Something went wrong. Please try again."){E(),s.innerHTML=`
      <p class="Error">
        <i class="fa-regular fa-face-sad-tear"></i> ${e}
        <button id="retry-btn" class="retry-btn">Retry</button>
      </p>
    `,document.getElementById("retry-btn")?.addEventListener("click",k)}function k(){p=[],sessionStorage.removeItem("cart"),window.location.reload(!0)}function I(e){return`./src/assets/images/${e.id}.jpg`}function B(e,t,n){let a=e.querySelector(".actions"),r=p.find(e=>e.id===t.id&&e.weightPerBag===n);r?a.innerHTML=`
        <button class="decrease" data-id="${t.id}" data-weight="${n}">-</button>
        <span class="qty">${r.bags}</span>
        <button class="increase" data-id="${t.id}" data-weight="${n}">+</button>
      `:a.innerHTML=`<button class="add-to-cart" data-id="${t.id}" data-weight="${n}">Add to Cart</button>`}function C(e){let t=document.createElement("div");t.className="product-card fade-in-on-scroll",t.setAttribute("data-type",e.type||"N/A"),t.setAttribute("data-id",e.id);let n="Active"!==e.status;n&&t.classList.add("inactive");let a=e.quantities||[],r="";if(!n&&a.length>0&&(r=a.map(e=>`<option value="${e}">${e} kg</option>`).join("")),t.innerHTML=`
      <div class="product-card-image">
        <img 
          src="${I(e)}" 
          alt="${e.brand||"Product"}" 
          class="product-img" 
          loading="lazy"
          onerror="this.src='./src/assets/images/default.jpg';"
        >
      </div>
      <div class="product-info">
        <h3 class="product-name">${e.brand||"Unknown"}</h3>
        <p class="product-type">${e.name||"N/A"}</p>
        <p class="product-bag-price">${n?"Out of Stock":"Check price"}</p>
        ${!n&&r?`<div class="custom-select-container">
               <div class="custom">
                <select id="quantity-${e.id}" class="quantity-select">
                  <option value="">Select kgs</option>
                  ${r}
                </select>
               </div>
             </div>
             <p class="error-message" id="error-${e.id}" style="display: none; color: red;"></p>`:""}
        <div class="actions">
          ${!n&&r?`<button class="add-to-cart" data-id="${e.id}">Add to Cart</button>`:""}
        </div>
      </div>
    `,!n&&r){let i=t.querySelector(".quantity-select"),o=t.querySelector(".product-bag-price"),l=t.querySelector(".error-message");i?.addEventListener("change",()=>{let n=parseInt(i.value);if(l.style.display="none",n){let a=n*e.pricePerKg;o.textContent=`₹${a} per bag`,B(t,e,n)}else o.textContent="Check price"})}s?.appendChild(t)}function S(){if(s.innerHTML="",0===f.length&&y.length>0){s.innerHTML='<p class="Error"><i class="fa-regular fa-face-sad-tear"></i>No products found.</p>';return}f.forEach(C)}function q(){let e=document.getElementById("filtered-count");e.textContent=`${f.length} result${1!==f.length?"s":""}`}function x(){if(0===p.length){l.classList.add("hidden");return}l.classList.remove("hidden"),c.innerHTML=`
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
        <tfoot class="tfoot">
          <tr>
            <td colspan="4"><strong>Total</strong></td>
            <td id="total-price"><strong>₹0</strong></td>
          </tr>
        </tfoot>
      </table>
    `;let e=c.querySelector("tbody"),t=0;p.forEach(n=>{let a=n.basePrice*n.weightPerBag*n.bags;t+=a;let r=document.createElement("tr");r.innerHTML=`
        <td>${n.brand}</td>
        <td>${n.weightPerBag} kg</td>
        <td>${n.bags}</td>
        <td>₹${n.basePrice}</td>
        <td>₹${a}</td>
      `,e.appendChild(r)}),c.querySelector("#total-price").innerHTML=`<strong>₹${t}</strong>`}function P(){o.style.display=p.length>0?"block":"none",o.textContent=`Checkout (${p.length})`}async function A(){L(10);let e=new AbortController,n=setTimeout(()=>{e.abort(),t("API response is too slow"),w("API took too long to respond. Please try again.")},5e3);try{let a=await fetch("https://script.google.com/macros/s/AKfycbzWIlg4U6L71j2jIOxt0Jh6EKvUSDbvrKf7F4AtsbLzY5_YZXjCj_nJ-0wMOjkpHY-G/exec",{signal:e.signal});clearTimeout(n);let r=await a.json();f=[...y=r.map(e=>({id:e.ID,brand:e.Brand,name:e.Name,type:e.Type,quantities:String(e.Quantity||"").split(",").map(e=>parseInt(e.trim())).filter(e=>!isNaN(e)&&e>0),pricePerKg:parseFloat(e.PricePerKg),status:e.Status?.trim?.()||"Inactive"}))],m(),E(),S(),q(),P()}catch(i){clearTimeout(n),console.error("Error loading products:",i),t("Failed to load products"),w()}}function M(){let e=document.querySelectorAll(".actions");e.forEach(e=>{let t=null!==e.querySelector(".decrease"),n=null!==e.querySelector(".increase");e.classList.toggle("action-visible",t&&n)});let t=document.getElementById("dashboard-overlay"),n=document.querySelector(".action-visible");t&&t.classList.toggle("active",!!n)}function T(){let e=document.querySelectorAll(".fade-in-on-scroll"),t=new IntersectionObserver((e,t)=>{e.forEach(e=>{e.isIntersecting&&(e.target.classList.add("visible"),t.unobserve(e.target))})},{threshold:.1,rootMargin:"0px 0px -10% 0px"});e.forEach(e=>t.observe(e))}s?.addEventListener("click",e=>{let t=e.target,n=t.dataset?.id;if(!n)return;let a=y.find(e=>e.id===n);if(!a)return;let r=t.closest(".product-card"),i=r.querySelector(".quantity-select"),s=r.querySelector(".error-message"),o=parseInt(i?.value);if(t.classList.contains("add-to-cart")){if(!o){s.textContent="Select a weight.",s.style.display="block";return}s.style.display="none";let l=p.find(e=>e.id===n&&e.weightPerBag===o);l?l.bags++:p.push({id:n,brand:a.brand,weightPerBag:o,bags:1,basePrice:a.pricePerKg}),B(r,a,o),P(),x(),sessionStorage?.setItem("cart",JSON.stringify(p))}if(t.classList.contains("increase")){let c=parseInt(t.dataset.weight),d=p.find(e=>e.id===n&&e.weightPerBag===c);d&&(d.bags++,B(r,a,c),P(),x(),sessionStorage?.setItem("cart",JSON.stringify(p)))}if(t.classList.contains("decrease")){let u=parseInt(t.dataset.weight),g=p.find(e=>e.id===n&&e.weightPerBag===u);g&&(g.bags--,g.bags<=0&&(p=p.filter(e=>e.id!==n||e.weightPerBag!==u)),B(r,a,u),P(),x(),sessionStorage?.setItem("cart",JSON.stringify(p)))}}),o.addEventListener("click",()=>{0!==p.length&&(x(),o.style.display="none")}),u.addEventListener("click",()=>{p=[],sessionStorage.removeItem("cart"),t("Cart cleared","success"),l.classList.remove("active"),setTimeout(()=>{l.classList.add("hidden"),P(),x(),document.querySelectorAll(".product-card").forEach(e=>{let t=e.dataset.id,n=y.find(e=>e.id===t);if(n&&(n.status,1)){let a=e.querySelector(".quantity-select"),r=parseInt(a?.value);r&&B(e,n,r)}})},500)}),g.addEventListener("click",()=>{l.classList.remove("active"),setTimeout(()=>{l.classList.add("hidden"),P()},500)}),d.addEventListener("click",()=>{sessionStorage.setItem("cart",JSON.stringify(p)),window.location.href="orders.html"}),b(),A(),document.addEventListener("DOMContentLoaded",()=>{M(),T()});let H=new MutationObserver(()=>{M(),T()});H.observe(document.body,{childList:!0,subtree:!0}),window.addEventListener("beforeunload",()=>H.disconnect())});