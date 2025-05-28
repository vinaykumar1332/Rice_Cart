function test(){
    var tabsNewAnim = jQuery('#navbarSupportedContent');
    var selectorNewAnim = jQuery('#navbarSupportedContent').find('li').length;
    var activeItemNewAnim = tabsNewAnim.find('.active');
    var activeWidthNewAnimHeight = activeItemNewAnim.innerHeight();
    var activeWidthNewAnimWidth = activeItemNewAnim.innerWidth();
    var itemPosNewAnimTop = activeItemNewAnim.position();
    var itemPosNewAnimLeft = activeItemNewAnim.position();
    jQuery(".hori-selector").css({
      "top":itemPosNewAnimTop.top + "px", 
      "left":itemPosNewAnimLeft.left + "px",
      "height": activeWidthNewAnimHeight + "px",
      "width": activeWidthNewAnimWidth + "px"
    });
    jQuery("#navbarSupportedContent").on("click","li",function(e){
      jQuery('#navbarSupportedContent ul li').removeClass("");
      jQuery(this).addClass('');
      var activeWidthNewAnimHeight = jQuery(this).innerHeight();
      var activeWidthNewAnimWidth = jQuery(this).innerWidth();
      var itemPosNewAnimTop = jQuery(this).position();
      var itemPosNewAnimLeft = jQuery(this).position();
      jQuery(".hori-selector").css({
        "top":itemPosNewAnimTop.top + "px", 
        "left":itemPosNewAnimLeft.left + "px",
        "height": activeWidthNewAnimHeight + "px",
        "width": activeWidthNewAnimWidth + "px"
      });
    });
  }
  jQuery(document).ready(function(){
    setTimeout(function(){ test(); });
  });
  jQuery(window).on('resize', function(){
    setTimeout(function(){ test(); }, 500);
  });
  jQuery(".navbar-toggler").click(function(){
    jQuery(".navbar-collapse").slideToggle(300);
    setTimeout(function(){ test(); });
  });
  jQuery(document).ready(function(jQuery){
    // Get current path and find target link
    var path = window.location.pathname.split("/").pop();
    if ( path == '' ) {
      path = 'index.html';
    }
    var target = jQuery('#navbarSupportedContent ul li a[href="'+path+'"]');
    target.parent().addClass('active');
  });

  //bars
  const menuToggle = document.getElementById('menuToggle');
if (menuToggle) {
  const menuIcon = menuToggle.querySelector('i');
  
  menuToggle.addEventListener('click', () => {
    // Toggle icon classes
    if (menuIcon.classList.contains('fa-bars')) {
      menuIcon.classList.remove('fa-bars');
      menuIcon.classList.add('fa-xmark'); // Cross icon
    } else {
      menuIcon.classList.remove('fa-xmark');
      menuIcon.classList.add('fa-bars'); // Back to bars
    }
  });
}

   let deferredPrompt;
    const installBtn = document.getElementById('installButton');
    const installOverlay = document.getElementById('installOverlay');
    const closeOverlay = document.getElementById('closeOverlay');

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      setTimeout(() => {
        installOverlay.classList.add('visible');
        installBtn.style.display = 'inline-block';
      }, 2000);
    });

    installBtn.addEventListener('click', async () => {
      if (deferredPrompt) {
        try {
          deferredPrompt.prompt();
          const { outcome } = await deferredPrompt.userChoice;
          console.log(outcome === 'accepted' ? 'User accepted the install prompt' : 'User dismissed the install prompt');
          deferredPrompt = null;
        } catch (error) {
          console.error('Error with install prompt:', error);
        }
        installOverlay.classList.remove('visible');
        installBtn.style.display = 'none';
      }
    });

    closeOverlay.addEventListener('click', () => {
      installOverlay.classList.remove('visible');
      installBtn.style.display = 'none';
    });

    installOverlay.addEventListener('click', (e) => {
      if (e.target === installOverlay) {
        installOverlay.classList.remove('visible');
        installBtn.style.display = 'none';
      }
    });

    // Fallback if beforeinstallprompt doesn't fire (for testing)
    window.addEventListener('load', () => {
      if (!deferredPrompt) {
        console.log('beforeinstallprompt not supported or not fired, showing overlay for testing');
        setTimeout(() => {
          installOverlay.classList.add('visible');
          installBtn.style.display = 'inline-block';
        }, 2000);
      }
    });

    //network status
  document.addEventListener('DOMContentLoaded', () => {
  const toastContainer = document.createElement('div');
  toastContainer.style.position = 'fixed';
  toastContainer.style.top = '40%';
  toastContainer.style.right = '20px';
  toastContainer.style.zIndex = '1000';
  document.body.appendChild(toastContainer);
  function showToast(message, type = 'error') {
    const toast = document.createElement('div');
    toast.style.padding = '12px 20px';
    toast.style.marginBottom = '40%';
    toast.style.borderRadius = '4px';
    toast.style.color = '#fff';
    toast.style.backgroundColor = type === 'error' ? '#dc3545' : '#28a745';
    toast.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease-in-out';
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
  async function checkApiLatency() {
    try {
      const startTime = performance.now();
      await fetch('', { 
        mode: 'no-cors',
        cache: 'no-store'
      });
      const endTime = performance.now();
      const latency = endTime - startTime;
      if (latency > 1000) {
        showToast('Slow network detected');
        return false;
      }
      return true;
    } catch (error) {
      showToast('Network error: Unable to reach server');
      return false;
    }
  }
  window.addEventListener('online', () => {
    showToast('Back online', 'success');
  });

  window.addEventListener('offline', () => {
    showToast('Lost internet connection');
  });
  async function monitorNetwork() {
    if (checkNetworkStatus()) {
      await checkApiLatency();
    }
  }
  monitorNetwork();
  setInterval(monitorNetwork, 10000);
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    if (!checkNetworkStatus()) {
      return Promise.reject(new Error('No network connection'));
    }
    const startTime = performance.now();
    try {
      const response = await originalFetch(...args);
      const endTime = performance.now();
      if (endTime - startTime > 1000) {
        showToast('Slow API response detected');
      }
      return response;
    } catch (error) {
      showToast('API call failed');
      throw error;
    }
  };
});