const p = document.querySelector("p");
const stickyBoard = document.getElementById("sticky-board");
const addItemForm = document.getElementById("add-item-form");

console.log("============= ADD ITEM JS LOADED =============");

// Import the API key from config
import { OPENAI_API_KEY } from './config.js';

// Function to save stickers to localStorage - reusing from sticker.js
function saveStickersToStorage(stickers) {
  console.log('Saving stickers:', stickers);
  localStorage.setItem('stickers', JSON.stringify(stickers));
}

// Function to load stickers from localStorage - reusing from sticker.js
function loadStickersFromStorage() {
  const stickersData = localStorage.getItem('stickers');
  const stickers = stickersData ? JSON.parse(stickersData) : [];
  console.log('Loaded stickers:', stickers);
  return stickers;
}

// Load existing stickers on page load
window.addEventListener('load', () => {
  console.log('Loading saved stickers...');
  refreshStickerDisplay();
});

// Function to categorize items using OpenAI API - reusing from sticker.js
async function categorizeSticker(title) {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that categorizes food items. Only respond with one of these categories without explanation: Dairy, Eggs, Vegetables, Fruits, Meats, Seafood, Drinks, Sauces, Other."
          },
          {
            role: "user",
            content: `Categorize this food item: ${title}`
          }
        ],
        max_tokens: 10,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      console.error('Error getting category from API:', await response.text());
      return 'Other'; // Fallback category
    }

    const data = await response.json();
    const category = data.choices[0].message.content.trim();
    console.log(`Categorized "${title}" as "${category}"`);
    return category;
  } catch (error) {
    console.error('Error in categorization:', error);
    return 'Other'; // Return Other if API fails
  }
}

// Function to delete a sticker by its index
function deleteSticker(index) {
  // Get current stickers from localStorage
  const stickers = loadStickersFromStorage();
  
  // Remove the sticker at the specified index
  stickers.splice(index, 1);
  
  // Save the updated stickers array back to localStorage
  saveStickersToStorage(stickers);
  
  // Refresh the display
  refreshStickerDisplay();
}

// Function to refresh the sticker display
function refreshStickerDisplay() {
  // Clear the current stickers
  stickyBoard.innerHTML = '';
  
  // Reload stickers from localStorage and display them
  const savedStickers = loadStickersFromStorage();
  savedStickers.forEach((sticker, index) => {
    addSticky(sticker, false, index); // false means don't save to storage again
  });
}

// Function to get a position that guarantees no overlap
function getNewItemPosition() {
  // Define upper left region boundaries
  const region = {
    minX: 20,
    maxX: 250, // Upper left quadrant
    minY: 20,
    maxY: 250  // Upper left quadrant
  };
  
  // Generate random position within the upper left region
  const randomX = Math.floor(Math.random() * (region.maxX - region.minX)) + region.minX;
  const randomY = Math.floor(Math.random() * (region.maxY - region.minY)) + region.minY;
  
  console.log(`Placing new item in upper left region at (${randomX}, ${randomY})`);
  
  return {
    x: randomX,
    y: randomY
  };
}

// Updated function to add a sticky note with delete button
async function addSticky({title, expDate, quantity, color = "#fffef5", category = null, posX = null, posY = null}, shouldSave = true, index = null) {
  if (!quantity) {
    quantity = "1";
  }

  // If category not provided, use OpenAI to categorize
  if (!category && shouldSave) {
    category = await categorizeSticker(title);
  }
  
  const note = document.createElement("div");
  note.className = "sticky";
  note.style.backgroundColor = color;

  // Add delete button
  const deleteBtn = document.createElement("button");
  deleteBtn.className = "delete-btn";
  deleteBtn.innerHTML = "×"; // × is the multiplication sign, looks like an X
  deleteBtn.title = "Delete this item";
  
  // If index is null (new item), we'll need to get its future index
  const currentIndex = index !== null ? index : loadStickersFromStorage().length;
  
  // Add click event to delete button
  deleteBtn.addEventListener("click", (event) => {
    event.stopPropagation(); // Prevent event bubbling
    deleteSticker(currentIndex);
  });

  note.innerHTML = `
    <h4 class="sticky-title">${title}</h4>

    <div class="sticky-meta">
      <p>Expires:<br><strong>${expDate}</strong></p>
      <p>Quantity:<br><strong>${quantity}</strong></p>
      <p>Category:<br><strong>${category || 'Not categorized'}</strong></p>
    </div>
  `;
  
  // Append the delete button to the note
  note.appendChild(deleteBtn);
  
  stickyBoard.appendChild(note);

  // Only save to localStorage if shouldSave is true
  if (shouldSave) {
    // Get position if not provided
    if (posX === null || posY === null) {
      const newPosition = getNewItemPosition();
      posX = newPosition.x;
      posY = newPosition.y;
    }
    
    console.log('Adding new sticker to storage:', {title, expDate, quantity, color, category, posX, posY});
    const stickers = loadStickersFromStorage();
    // Add isNew flag for new items
    stickers.push({title, expDate, quantity, color, category, posX, posY, isNew: true});
    saveStickersToStorage(stickers);
  }
}

// Handle form submission
addItemForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  
  const title = document.getElementById('itemName').value;
  const expDate = document.getElementById('expirationDate').value;
  const quantity = document.getElementById('quantity').value;
  
  // Format date to match sticker.js format if provided
  let formattedDate = expDate ? new Date(expDate).toISOString().slice(0, 10) : '';
  
  // Get a position in the upper left region
  const position = getNewItemPosition();
  
  // Add the item with explicit position
  await addSticky({
    title,
    expDate: formattedDate || 'Not specified',
    quantity,
    color: "#fffef5",
    posX: position.x,
    posY: position.y
  }, true);
  
  // Reset form
  addItemForm.reset();
});

console.log("loaded add-item page"); 