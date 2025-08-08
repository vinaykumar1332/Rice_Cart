let slideIndex = 0;
const slides = document.querySelectorAll('.slide');

function showSlide(index) {
  slides.forEach((slide, i) => {
    slide.classList.toggle('active', i === index);
  });
}

function autoSlide() {
  slideIndex = (slideIndex + 1) % slides.length;
  showSlide(slideIndex);
}

setInterval(autoSlide, 5000); // Change every 5 seconds
showSlide(slideIndex);


 document.addEventListener('DOMContentLoaded', () => {
      const carousel = document.getElementById('carousel');
      const prevBtn = document.getElementById('prev-btn');
      const nextBtn = document.getElementById('next-btn');
      let autoScrollInterval;
      const MIN_SKELETON_COUNT = 5;

      // Toast container setup
      const toastContainer = document.createElement('div');
      toastContainer.className = 'toast-container';
      document.body.appendChild(toastContainer);

      function showToast(message, type = 'error') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        toastContainer.appendChild(toast);
        setTimeout(() => {
          toast.style.opacity = '1';
        }, 100);
        setTimeout(() => {
          toast.style.opacity = '0';
          setTimeout(() => toast.remove(), 300);
        }, 3000);
      }

      function checkNetworkStatus() {
        if (!navigator.onLine) {
          showToast('No internet connection');
          return false;
        }
        return true;
      }

      function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
      }

      function showSkeletonLoader() {
        carousel.innerHTML = '';
        for (let i = 0; i < MIN_SKELETON_COUNT; i++) {
          const skeleton = document.createElement('div');
          skeleton.className = 'skeleton-card';
          skeleton.innerHTML = `
            <div class="skeleton-img"></div>
            <div class="skeleton-text"></div>
            <div class="skeleton-text"></div>
            <div class="skeleton-text short"></div>
            <div class="skeleton-text short"></div>
          `;
          carousel.appendChild(skeleton);
        }
      }

      async function fetchProducts() {
        if (!checkNetworkStatus()) {
          carousel.innerHTML = `<p style="padding:10px; color: var(--color-error);">No internet connection</p>`;
          return;
        }

        showSkeletonLoader();
        try {
          const res = await fetch("https://script.google.com/macros/s/AKfycbzWIlg4U6L71j2jIOxt0Jh6EKvUSDbvrKf7F4AtsbLzY5_YZXjCj_nJ-0wMOjkpHY-G/exec", {
            cache: 'no-store'
          });
          if (!res.ok) {
            throw new Error(`HTTP error! Status: ${res.status}`);
          }
          const data = await res.json();

          const products = Array.isArray(data) ? data.slice(0, 10).map(item => ({
            ID: String(item.ID || ''),
            Brand: String(item.Brand || 'N/A'),
            Name: String(item.Name || 'N/A'),
            Type: String(item.Type || 'N/A'),
            PricePerKg: parseFloat(item.PricePerKg) || 0
          })) : [];

          if (products.length === 0) {
            throw new Error('No valid product data received');
          }

          // Shuffle products
          const shuffledProducts = shuffleArray([...products]);

          // Save to sessionStorage
          try {
            const productsString = JSON.stringify(shuffledProducts);
            const dataSize = new Blob([productsString]).size;
            if (dataSize > 5 * 1024 * 1024) {
              throw new Error('Data too large for sessionStorage');
            }
            sessionStorage.setItem('carouselProducts', productsString);
            console.log('Carousel products saved to sessionStorage');
            showToast('Carousel products saved to session storage', 'success');
          } catch (error) {
            console.error('Error saving to sessionStorage:', error);
            showToast(`Failed to save carousel products: ${error.message}`, 'error');
          }

          renderCarousel(shuffledProducts);
          updateNavigation();
          startAutoScroll();
        } catch (err) {
          console.error('Failed to fetch product data:', err);
          carousel.innerHTML = `<p style="padding:10px; color: var(--color-error);">Unable to load products: ${err.message}</p>`;
        }
      }

      function getLocalImage(id) {
        return `./src/assets/images/${id}.jpg`;
      }

      function renderCarousel(products) {
        carousel.innerHTML = '';
        products.forEach((item, index) => {
          const card = document.createElement('div');
          card.className = 'card';
          card.style.opacity = '0';
          card.style.transform = 'translateY(20px)';
          card.innerHTML = `
            <img src="${getLocalImage(item.ID)}" alt="${item.Name}" onerror="this.src='./src/assets/images/default.jpg';" />
            <div class="card-content">
            <h3 class="type">${item.Type}</h3>
            <p class="name">${item.Name}</p>
            <p class="price">₹${item.PricePerKg}/kg</p>
            </div>
          `;
          carousel.appendChild(card);
          // Staggered animation
          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          }, 100 * (index + 1));
        });
      }

      function updateNavigation() {
        const scrollLeft = carousel.scrollLeft;
        const maxScroll = carousel.scrollWidth - carousel.clientWidth;
        prevBtn.disabled = scrollLeft <= 0;
        nextBtn.disabled = scrollLeft >= maxScroll;
      }

      function scrollCarousel(direction) {
        const cardWidth = carousel.querySelector('.card')?.offsetWidth || (window.innerWidth <= 768 ? 180 : 240);
        carousel.scrollBy({ left: direction * (cardWidth + 16), behavior: 'smooth' });
        setTimeout(updateNavigation, 300);
      }

      function startAutoScroll() {
        if (autoScrollInterval) clearInterval(autoScrollInterval);
        const cardWidth = carousel.querySelector('.card')?.offsetWidth || (window.innerWidth <= 768 ? 180 : 240);
        let scrollAmount = 0;
        autoScrollInterval = setInterval(() => {
          carousel.scrollBy({ left: cardWidth + 16, behavior: 'smooth' });
          scrollAmount += cardWidth + 16;
          if (scrollAmount >= carousel.scrollWidth - carousel.clientWidth) {
            scrollAmount = 0;
            carousel.scrollTo({ left: 0, behavior: 'smooth' });
          }
          updateNavigation();
        }, 3500);

        // Pause on hover
        carousel.addEventListener('mouseenter', () => clearInterval(autoScrollInterval));
        carousel.addEventListener('mouseleave', startAutoScroll);
      }

      // Navigation button listeners
      prevBtn.addEventListener('click', () => scrollCarousel(-1));
      nextBtn.addEventListener('click', () => scrollCarousel(1));

      // Update navigation on scroll
      carousel.addEventListener('scroll', updateNavigation);

      // Check for cached products
      const cachedProducts = sessionStorage.getItem('carouselProducts');
      if (cachedProducts) {
        try {
          const products = JSON.parse(cachedProducts);
          const shuffledProducts = shuffleArray([...products]);
          renderCarousel(shuffledProducts);
          updateNavigation();
          startAutoScroll();
          showToast('Loaded carousel products from cache', 'success');
        } catch (error) {
          console.error('Error loading cached products:', error);
          fetchProducts();
        }
      } else {
        fetchProducts();
      }

      // Network status listeners
      window.addEventListener('online', () => {
        showToast('Back online', 'success');
        fetchProducts();
      });

      window.addEventListener('offline', () => {
        showToast('Lost internet connection');
      });
    });
 document.addEventListener('DOMContentLoaded', () => {
    const options = {
      threshold: 0.2,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.classList.add('visible');
          }, index * 200); // delay effect
        }
      });
    }, options);

    const steps = document.querySelectorAll('.timeline-step');
    const title = document.querySelector('.section-title');

    steps.forEach((step) => observer.observe(step));
    if (title) observer.observe(title);
  });
  const handleKeyUp = () => {
  const editor = editorRef.current.getEditor();
  const range = editor.getSelection();
  if (!range || range.index === 0) {
    setShowSuggestions(false);
    return;
  }

  const textBeforeCursor = editor.getText(0, range.index);
  const lastAtIndex = textBeforeCursor.lastIndexOf('@');

  if (lastAtIndex !== -1 && range.index > lastAtIndex) {
    const query = textBeforeCursor.slice(lastAtIndex + 1, range.index).toLowerCase();

    const mentionValues = getMentionValues();
    const filtered = mentionValues.filter((item) =>
      item.label.toLowerCase().includes(query)
    );

    if (filtered.length > 0) {
      setSuggestions(filtered);
      const coords = getCaretCoordinates();
      if (coords) {
        setPopupPos(coords);
        setShowSuggestions(true);
        setCursorIndex(range.index);
      }
    } else {
      setShowSuggestions(false);
    }
  } else {
    setShowSuggestions(false);
  }
};
