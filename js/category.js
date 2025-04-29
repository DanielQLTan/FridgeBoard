const p = document.querySelector("p");
console.log("loaded categories");

// Create main container for categories
const container = document.createElement('div');
container.className = 'container mt-4';
document.body.appendChild(container);

// Category background colors
const categoryColors = {
  'Vegetables': '#e8f5e9', // Light green
  'Fruits': '#fff8e1',     // Light yellow
  'Meats': '#ffebee',      // Light pink
  'Dairy': '#e3f2fd',      // Light blue
  'Eggs': '#fff3e0',       // Light orange
  'Seafood': '#e0f7fa',    // Light cyan
  'Drinks': '#e8eaf6',     // Light indigo
  'Sauces': '#fce4ec',     // Light pink
  'Other': '#f5f5f5'       // Light grey
};

function loadCategorizedStickers() {
  const stickersData = localStorage.getItem('stickers');
  return stickersData ? JSON.parse(stickersData) : [];
}

function displayStickersByCategory() {
  const stickers = loadCategorizedStickers();
  const categories = {};

  // Group stickers by category
  stickers.forEach(sticker => {
    const category = sticker.category || 'Other';
    if (!categories[category]) {
      categories[category] = [];
    }
    categories[category].push(sticker);
  });

  // Clear previous content
  container.innerHTML = '';

  // Process categories in a specific order with others at the end
  const orderedCategories = [
    'Vegetables', 'Fruits', 'Meats', 'Dairy', 'Eggs', 'Seafood', 
    'Drinks', 'Sauces', 'Other'
  ];
  
  // Filter out empty categories
  const availableCategories = orderedCategories.filter(
    category => categories[category] && categories[category].length > 0
  );
  
  // Add any categories not in our predefined list
  Object.keys(categories).forEach(category => {
    if (!orderedCategories.includes(category) && categories[category].length > 0) {
      availableCategories.push(category);
    }
  });

  // Create sections for each category
  availableCategories.forEach(category => {
    // Skip if no items
    if (!categories[category] || categories[category].length === 0) return;
    
    // Create category section with CSS class
    const categorySection = document.createElement('div');
    categorySection.className = 'category-section';
    
    // Add category-specific class for background color
    const categoryClass = 'category-' + category.toLowerCase();
    categorySection.classList.add(categoryClass);
    
    // Add category header
    const categoryHeader = document.createElement('h2');
    categoryHeader.textContent = category;
    categoryHeader.className = 'category-header';
    categorySection.appendChild(categoryHeader);
    
    // Create row for cards
    const cardRow = document.createElement('div');
    cardRow.className = 'card-grid';
    
    // Add items to the category
    categories[category].forEach(sticker => {
      const card = document.createElement('div');
      card.className = 'item-card';
      
      const cardBody = document.createElement('div');
      cardBody.className = 'item-card-body';
      
      const itemName = document.createElement('p');
      itemName.className = 'item-name';
      itemName.textContent = sticker.title;
      
      const expireDate = document.createElement('p');
      expireDate.className = 'item-date';
      expireDate.textContent = sticker.expDate;
      
      cardBody.appendChild(itemName);
      cardBody.appendChild(expireDate);
      card.appendChild(cardBody);
      cardRow.appendChild(card);
    });
    
    categorySection.appendChild(cardRow);
    container.appendChild(categorySection);
  });
}

// Add some CSS to the page
function addStyles() {
  const style = document.createElement('style');
  style.textContent = `
    body {
      background-color: #f8f9fa;
    }
    .card {
      transition: transform 0.2s;
    }
    .card:hover {
      transform: translateY(-5px);
    }
  `;
  document.head.appendChild(style);
}

// Initialize
window.addEventListener('load', () => {
  addStyles();
  displayStickersByCategory();
});