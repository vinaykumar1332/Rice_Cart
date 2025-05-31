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