document.addEventListener('DOMContentLoaded', () => {

  const $ = sel => document.querySelector(sel);
  const $$ = sel => document.querySelectorAll(sel);

  const createEl = (tag, className, html) => {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (html) el.innerHTML = html;
    return el;
  };

  const toastContainer = createEl('div', 'toast-container');
  document.body.appendChild(toastContainer);

  const showToast = (message, type = 'error') => {
    const toast = createEl('div', `toast ${type}`, message);
    toastContainer.appendChild(toast);
    setTimeout(() => (toast.style.opacity = '1'), 50);
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  };

  const checkNetworkStatus = () => {
    if (!navigator.onLine) {
      showToast('No internet connection');
      return false;
    }
    return true;
  };

  const shuffleArray = arr => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  /* ==========================
     Hero Slider
  =========================== */
  const slides = $$('.slide');
  let slideIndex = 0;

  const showSlide = index => {
    slides.forEach((slide, i) => slide.classList.toggle('active', i === index));
  };

  const autoSlide = () => {
    slideIndex = (slideIndex + 1) % slides.length;
    showSlide(slideIndex);
  };

  if (slides.length) {
    showSlide(slideIndex);
    setInterval(autoSlide, 5000);
  }

  /* ==========================
     Carousel
  =========================== */
  const carousel = $('#carousel');
  const prevBtn = $('#prev-btn');
  const nextBtn = $('#next-btn');
  let autoScrollInterval;

  const MIN_SKELETON_COUNT = 5;
  const getLocalImage = id => `./src/assets/images/${id}.jpg`;

  const showSkeletonLoader = () => {
    carousel.innerHTML = '';
    for (let i = 0; i < MIN_SKELETON_COUNT; i++) {
      carousel.appendChild(
        createEl('div', 'skeleton-card', `
          <div class="skeleton-img"></div>
          <div class="skeleton-text"></div>
          <div class="skeleton-text"></div>
          <div class="skeleton-text short"></div>
          <div class="skeleton-text short"></div>
        `)
      );
    }
  };

  const renderCarousel = products => {
    carousel.innerHTML = '';
    products.forEach((item, idx) => {
      const card = createEl('div', 'card', `
        <img src="${getLocalImage(item.ID)}" alt="${item.Name}"
             onerror="this.src='./src/assets/images/default.jpg';" />
        <div class="card-content">
          <h3 class="type">${item.Type}</h3>
          <p class="name">${item.Name}</p>
          <p class="price">₹${item.PricePerKg}/kg</p>
        </div>
      `);
      card.style.opacity = '0';
      card.style.transform = 'translateY(20px)';
      carousel.appendChild(card);
      setTimeout(() => {
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }, 100 * (idx + 1));
    });
  };

  const updateNavigation = () => {
    const maxScroll = carousel.scrollWidth - carousel.clientWidth;
    prevBtn.disabled = carousel.scrollLeft <= 0;
    nextBtn.disabled = carousel.scrollLeft >= maxScroll;
  };

  const scrollCarousel = dir => {
    const cardWidth = carousel.querySelector('.card')?.offsetWidth || (window.innerWidth <= 768 ? 180 : 240);
    carousel.scrollBy({ left: dir * (cardWidth + 16), behavior: 'smooth' });
    setTimeout(updateNavigation, 300);
  };

  const startAutoScroll = () => {
    clearInterval(autoScrollInterval);
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
  };

  const fetchProducts = async () => {
    if (!checkNetworkStatus()) {
      carousel.innerHTML = `<p style="padding:10px; color: var(--color-error);">No internet connection</p>`;
      return;
    }
    showSkeletonLoader();
    try {
      const res = await fetch("https://script.google.com/macros/s/AKfycbzWIlg4U6L71j2jIOxt0Jh6EKvUSDbvrKf7F4AtsbLzY5_YZXjCj_nJ-0wMOjkpHY-G/exec", { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
      const data = await res.json();
      const products = (Array.isArray(data) ? data.slice(0, 10) : []).map(item => ({
        ID: String(item.ID || ''),
        Brand: String(item.Brand || 'N/A'),
        Name: String(item.Name || 'N/A'),
        Type: String(item.Type || 'N/A'),
        PricePerKg: parseFloat(item.PricePerKg) || 0
      }));
      if (!products.length) throw new Error('No valid product data received');

      const shuffled = shuffleArray([...products]);
      sessionStorage.setItem('carouselProducts', JSON.stringify(shuffled));
      showToast('Carousel products saved to session storage', 'success');

      renderCarousel(shuffled);
      updateNavigation();
      startAutoScroll();
    } catch (err) {
      console.error(err);
      carousel.innerHTML = `<p style="padding:10px; color: var(--color-error);">Unable to load products: ${err.message}</p>`;
    }
  };

  prevBtn?.addEventListener('click', () => scrollCarousel(-1));
  nextBtn?.addEventListener('click', () => scrollCarousel(1));
  carousel?.addEventListener('scroll', updateNavigation);
  carousel?.addEventListener('mouseenter', () => clearInterval(autoScrollInterval));
  carousel?.addEventListener('mouseleave', startAutoScroll);

  const cached = sessionStorage.getItem('carouselProducts');
  if (cached) {
    try {
      renderCarousel(shuffleArray(JSON.parse(cached)));
      updateNavigation();
      startAutoScroll();
      showToast('Loaded carousel products from cache', 'success');
    } catch {
      fetchProducts();
    }
  } else {
    fetchProducts();
  }

  window.addEventListener('online', () => { showToast('Back online', 'success'); fetchProducts(); });
  window.addEventListener('offline', () => showToast('Lost internet connection'));

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, idx) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('visible'), idx * 200);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });

  [...$$('.timeline-step'), $('.section-title'), ...$$('.category-card'), ...$$('.value-card')]
    .filter(Boolean)
    .forEach(el => observer.observe(el));

  const revealCards = () => {
    const triggerBottom = window.innerHeight * 0.85;
    $$('.category-card').forEach(card => {
      if (card.getBoundingClientRect().top < triggerBottom) card.classList.add('show');
    });
  };
  window.addEventListener('scroll', revealCards);
  revealCards();
});

