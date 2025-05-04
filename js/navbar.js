// Navigation bar functionality
document.addEventListener('DOMContentLoaded', function() {
  // Get the current page path
  const currentPath = window.location.pathname;
  
  // Get all navigation items
  const navItems = document.querySelectorAll('.navi-bar .nav-item');
  
  // Set the active state based on current page
  navItems.forEach((item) => {
    const itemHref = item.getAttribute('href');
    const icon = item.querySelector('.nav-icon');
    
    // Get the current image source and its name
    const currentSrc = icon.getAttribute('src');
    const imgPath = currentSrc.substring(0, currentSrc.lastIndexOf('/') + 1);
    const imgName = currentSrc.substring(currentSrc.lastIndexOf('/') + 1);
    const baseName = imgName.replace('-active.svg', '').replace('.svg', '');
    
    if (currentPath.includes(itemHref)) {
      // Add active class
      item.classList.add('active');
      
      // Use the active version of the icon
      icon.setAttribute('src', `${imgPath}${baseName}-active.svg`);
    } else {
      item.classList.remove('active');
      
      // Use the regular version of the icon
      icon.setAttribute('src', `${imgPath}${baseName}.svg`);
    }
  });
}); 