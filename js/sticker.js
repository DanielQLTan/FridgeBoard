import { OPENAI_API_KEY } from './config.js';

const p = document.querySelector("p");

const stickyBoard = document.getElementById("sticky-board");

// Modal elements
const modal = document.getElementById('handwriting-modal');
const addItemBtn = document.getElementById('add-item-btn');
const closeModalBtn = document.getElementById('close-modal-btn');
const addItemSubmit = document.getElementById('add-item-submit');

// Canvas elements
const itemCanvas = document.getElementById('item-canvas');
const dateCanvas = document.getElementById('date-canvas');
const quantityCanvas = document.getElementById('quantity-canvas');

// Drawing contexts
const itemCtx = itemCanvas.getContext('2d');
const dateCtx = dateCanvas.getContext('2d');
const quantityCtx = quantityCanvas.getContext('2d');

// Drawing state
let isDrawing = false;
let currentCanvas = null;
let currentContext = null;

// Setup handwriting functionality
function setupHandwriting() {
  // Initialize all canvases
  [itemCanvas, dateCanvas, quantityCanvas].forEach(canvas => {
    const ctx = canvas.getContext('2d');
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'black';
    
    // Clear canvas with white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Mouse events
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    
    // Touch events for mobile
    canvas.addEventListener('touchstart', startDrawingTouch);
    canvas.addEventListener('touchmove', drawTouch);
    canvas.addEventListener('touchend', stopDrawing);
  });
}

// Drawing functions
function startDrawing(e) {
  isDrawing = true;
  currentCanvas = e.target;
  currentContext = currentCanvas.getContext('2d');
  draw(e);
}

function startDrawingTouch(e) {
  e.preventDefault();
  isDrawing = true;
  currentCanvas = e.target;
  currentContext = currentCanvas.getContext('2d');
  const touch = e.touches[0];
  const mouseEvent = new MouseEvent('mousedown', {
    clientX: touch.clientX,
    clientY: touch.clientY
  });
  currentCanvas.dispatchEvent(mouseEvent);
}

function draw(e) {
  if (!isDrawing) return;
  
  const rect = currentCanvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  currentContext.lineTo(x, y);
  currentContext.stroke();
  currentContext.beginPath();
  currentContext.moveTo(x, y);
}

function drawTouch(e) {
  e.preventDefault();
  const touch = e.touches[0];
  const mouseEvent = new MouseEvent('mousemove', {
    clientX: touch.clientX,
    clientY: touch.clientY
  });
  currentCanvas.dispatchEvent(mouseEvent);
}

function stopDrawing() {
  if (isDrawing) {
    isDrawing = false;
    currentContext.beginPath();
  }
}

// Function to clear all canvases
function clearCanvases() {
  [itemCtx, dateCtx, quantityCtx].forEach(ctx => {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.beginPath();
  });
}

// Function to get dataURL from canvas
function getCanvasDataURL(canvas) {
  return canvas.toDataURL('image/png');
}

// Modal event listeners
addItemBtn.addEventListener('click', function() {
  // Show modal
  modal.style.display = 'flex';
  
  // Clear canvases
  clearCanvases();
  
  // Setup handwriting
  setupHandwriting();
});

closeModalBtn.addEventListener('click', function() {
  modal.style.display = 'none';
});

// Submit handwritten input
addItemSubmit.addEventListener('click', async function() {
  // Show loading state
  addItemSubmit.disabled = true;
  addItemSubmit.textContent = 'Processing...';
  
  try {
    // Get data URLs from canvases
    const itemDataUrl = getCanvasDataURL(itemCanvas);
    const dateDataUrl = getCanvasDataURL(dateCanvas);
    const quantityDataUrl = getCanvasDataURL(quantityCanvas);
    
    // Process handwritten item (similar to sticker processing)
    const itemResponse = await processHandwriting(itemDataUrl, "item");
    const dateResponse = await processHandwriting(dateDataUrl, "date");
    const quantityResponse = await processHandwriting(quantityDataUrl, "quantity");
    
    // Add the item
    await addSticky({
      title: itemResponse.trim(),
      expDate: dateResponse.trim(),
      quantity: quantityResponse.trim()
    }, true);
    
    // Close modal
    modal.style.display = 'none';
  } catch (error) {
    console.error('Error processing handwritten input:', error);
    alert('Error processing handwritten input. Please try again.');
  } finally {
    // Reset button
    addItemSubmit.disabled = false;
    addItemSubmit.textContent = 'Add item';
  }
});

// Process handwritten text using the same API as stickers
async function processHandwriting(dataUrl, type) {
  // Use the same API endpoint as for stickers
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
        "type": type
      }),
    }
  ).then(response => response.text());
  
  return response.trim();
}

// Add event listener for the Add New Item button
document.getElementById('add-item-btn').addEventListener('click', function() {
  console.log('Add New Item button clicked');
  // You can add functionality here in the future
});

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