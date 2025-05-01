// Navigation bar functionality
document.addEventListener('DOMContentLoaded', function() {
  // Get the current page path
  const currentPath = window.location.pathname;
  
  // Get all navigation items
  const navItems = document.querySelectorAll('.navi-bar .nav-item');
  
  // Set the active state based on current page
  navItems.forEach((item) => {
    const itemHref = item.getAttribute('href');
    if (currentPath.includes(itemHref)) {
      // Add active class
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
}); 