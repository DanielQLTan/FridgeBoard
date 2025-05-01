import { OPENAI_API_KEY } from './config.js';

const p = document.querySelector("p");

const stickyBoard = document.getElementById("sticky-board");

// Function to save stickers to localStorage
function saveStickersToStorage(stickers) {
  console.log('Saving stickers:', stickers);
  localStorage.setItem('stickers', JSON.stringify(stickers));
}

// Function to load stickers from localStorage
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
  
  // Create card grid container
  const cardGrid = document.createElement('div');
  cardGrid.className = 'card-grid';
  
  // Reload stickers from localStorage and display them
  const savedStickers = loadStickersFromStorage();
  
  if (savedStickers.length === 0) {
    const emptyMessage = document.createElement('p');
    emptyMessage.textContent = 'No items found. Add items using the form above.';
    emptyMessage.className = 'text-muted text-center my-4';
    stickyBoard.appendChild(emptyMessage);
    return;
  }
  
  savedStickers.forEach((sticker, index) => {
    // Create card for each item (matching the structure in category.js)
    const card = document.createElement('div');
    card.className = 'item-card';
    
    const cardBody = document.createElement('div');
    cardBody.className = 'item-card-body';
    
    const itemName = document.createElement('p');
    itemName.className = 'item-name';
    itemName.textContent = sticker.title || 'Untitled';
    
    const expireDate = document.createElement('p');
    expireDate.className = 'item-date';
    expireDate.textContent = sticker.expDate || 'No expiration date';
    
    // Create delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'card-delete-btn';
    deleteBtn.innerHTML = '×';
    deleteBtn.title = 'Delete this item';
    
    // Add delete functionality
    deleteBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      deleteSticker(index);
    });
    
    // Assemble card (matching structure from category.js)
    cardBody.appendChild(itemName);
    cardBody.appendChild(expireDate);
    cardBody.appendChild(deleteBtn);
    
    card.appendChild(cardBody);
    cardGrid.appendChild(card);
  });
  
  stickyBoard.appendChild(cardGrid);
}

// Updated function to add a sticky note with delete button
async function addSticky({title, expDate, quantity, color = "#fffef5", category = null}, shouldSave = true, index = null) {
  if (!quantity) {
    quantity = "1";
  }

  // Get expiration date if not provided
  if (!expDate && shouldSave) {
    const today = new Date().toISOString().slice(0, 10);
    const response = await fetch(
      'https://noggin.rea.gent/xerothermic-moose-3116',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer rg_v1_reh5iudjwrz2ffd7raq78q88mp3qkka67xql_ngk',
        },
        body: JSON.stringify({
          "item": title,
          "startDate": today,
        }),
      }
    ).then(response => response.text());
    expDate = response.trim() + " (Suggested)";
  }
  
  // If category not provided, use OpenAI to categorize
  if (!category && shouldSave) {
    category = await categorizeSticker(title);
  }

  // Only save to localStorage if shouldSave is true
  if (shouldSave) {
    console.log('Adding new sticker to storage:', {title, expDate, quantity, color, category});
    const stickers = loadStickersFromStorage();
    stickers.push({title, expDate, quantity, color, category});
    saveStickersToStorage(stickers);
    
    // Refresh the display to show the new item
    refreshStickerDisplay();
  }
}

const uploadSticker = document.querySelector(".upload-sticker");
const fileInput = uploadSticker.querySelector('input[type="file"]');
const submitBtn = uploadSticker.querySelector('input[type="submit"]');

uploadSticker
  .querySelector("form")
  .addEventListener("submit", async (event) => {
    event.preventDefault();

    submitBtn.disabled = true;
    submitBtn.value = "Processing...";

    const file = fileInput.files[0];
    const fileReader = new FileReader();
    fileReader.onload = async (readEvent) => {
      const dataUrl = readEvent.target.result;

      const response = await fetch(
          'https://noggin.rea.gent/wily-starfish-4015',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Bearer rg_v1_f19t3fxicscspdee1x5rk3i9frr873wzsb9j_ngk',
            },
            body: JSON.stringify({
              "sticker": dataUrl,
            }),
          }
        ).then(response => response.text());

      const lines = response.trim().split("\n");
      const [title, expDate, quantity] = lines.map(x => x.trim());

      addSticky({title, expDate, quantity}, true); // true means save to storage

      submitBtn.disabled = false;
      submitBtn.value = "Scan Sticker";
      fileInput.value = "";
    };

    fileReader.readAsDataURL(file);
  });

// Add a test function to check localStorage
window.checkStorage = function() {
  console.log('Current localStorage content:', localStorage.getItem('stickers'));
}

console.log("============= STICKER JS LOADED =============");