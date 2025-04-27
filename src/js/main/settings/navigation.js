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
