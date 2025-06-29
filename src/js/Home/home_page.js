 window.addEventListener('scroll', () => {
    document.querySelectorAll('.animate-on-scroll').forEach(el => {
      const rect = el.getBoundingClientRect();
      const windowHeight = window.innerHeight || document.documentElement.clientHeight;
      if (rect.top <= windowHeight - 150) {
        el.style.opacity = 1;
        el.style.transform = 'translateY(0)';
      }
    });
  });

  // Trigger on load
  window.dispatchEvent(new Event('scroll'));