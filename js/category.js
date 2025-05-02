const p = document.querySelector("p");
console.log("loaded categories");

// Use the existing container
const container = document.getElementById('category-container');

function loadCategorizedStickers() {
  const stickersData = localStorage.getItem('stickers');
  return stickersData ? JSON.parse(stickersData) : [];
}

// Function to delete a sticker by its index
function deleteSticker(index) {
  // Get current stickers from localStorage
  const stickers = loadCategorizedStickers();
  
  // Remove the sticker at the specified index
  stickers.splice(index, 1);
  
  // Save the updated stickers array back to localStorage
  localStorage.setItem('stickers', JSON.stringify(stickers));
  
  // Refresh the display
  displayStickersByCategory();
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
    categories[category].forEach((sticker, categoryIndex) => {
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
      
      // No delete button on category page as requested
      
      cardBody.appendChild(itemName);
      cardBody.appendChild(expireDate);
      
      card.appendChild(cardBody);
      cardRow.appendChild(card);
    });
    
    categorySection.appendChild(cardRow);
    container.appendChild(categorySection);
  });
}

// Initialize
window.addEventListener('load', displayStickersByCategory);