import { OPENAI_API_KEY } from './config.js';

const p = document.querySelector("p");

const stickyBoard = document.getElementById("sticky-board");

// Modal elements
const modal = document.getElementById('handwriting-modal');
const addItemBtn = document.getElementById('add-item-btn');
const closeModalBtn = document.getElementById('close-modal-btn');
const addItemSubmit = document.getElementById('add-item-submit');
const tidyUpBtn = document.getElementById('tidy-up-btn');

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

// Store last used position index
let lastPositionIndex = -1;

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
  console.log(`Attempting to categorize: "${title}"`);
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
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
        temperature: 0.2
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error getting category from API:', errorText);
      console.error('Response status:', response.status);
      return 'Other'; // Fallback category
    }

    const data = await response.json();
    console.log('API response data:', data);
    const category = data.choices[0].message.content.trim();
    console.log(`Successfully categorized "${title}" as "${category}"`);
    return category;
  } catch (error) {
    console.error('Error in categorization:', error);
    console.error('Error details:', error.message);
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
function refreshStickerDisplay(useGridLayout = false) {
  // Clear the current stickers
  stickyBoard.innerHTML = '';
  
  // Create card container - no longer using grid directly
  const cardContainer = document.createElement('div');
  cardContainer.className = 'card-container';
  cardContainer.style.position = 'relative';
  cardContainer.style.minHeight = '600px';
  
  // Reload stickers from localStorage and display them
  const savedStickers = loadStickersFromStorage();
  
  if (savedStickers.length === 0) {
    const emptyMessage = document.createElement('p');
    emptyMessage.textContent = 'No items found. Add items using the form above.';
    emptyMessage.className = 'text-muted text-center my-4';
    stickyBoard.appendChild(emptyMessage);
    return;
  }
  
  // Create cards in grid or free positions
  if (useGridLayout) {
    // Create in grid layout - reset all positions
    arrangeCardsInGrid(savedStickers, cardContainer);
  } else {
    // Create with saved positions
  savedStickers.forEach((sticker, index) => {
      createDraggableCard(sticker, index, cardContainer);
    });
  }
  
  stickyBoard.appendChild(cardContainer);
}

// Function to arrange cards in a grid layout
function arrangeCardsInGrid(stickers, container) {
  const cardWidth = 200;
  const cardHeight = 240;
  const gapX = 20;
  const gapY = 20;
  const rightMargin = 30; // Additional margin to ensure cards stay within view
  
  // Calculate available width, accounting for a safe margin on right side
  const availableWidth = window.innerWidth - rightMargin;
  
  // Ensure we leave enough space for at least 1 card plus margins
  const safeWidth = Math.max(availableWidth - (cardWidth + gapX*2), cardWidth + gapX*2);
  
  // Calculate number of cards per row based on available width
  const cardsPerRow = Math.floor(safeWidth / (cardWidth + gapX));
  
  console.log(`Grid layout: ${cardsPerRow} cards per row (window width: ${window.innerWidth}px)`);
  
  stickers.forEach((sticker, index) => {
    const row = Math.floor(index / cardsPerRow);
    const col = index % cardsPerRow;
    
    const left = col * (cardWidth + gapX) + 10;
    const top = row * (cardHeight + gapY) + 10;
    
    // Update sticker with new position
    sticker.posX = left;
    sticker.posY = top;
    
    // Create the card with updated position
    createDraggableCard(sticker, index, container);
  });
  
  // Save the updated positions to localStorage
  saveStickersToStorage(stickers);
}

// Updated function to create a draggable card with NEW indicator
function createDraggableCard(sticker, index, container) {
  // Create card for each item
  const card = document.createElement('div');
  card.className = 'item-card draggable';
  card.style.position = 'absolute';
  
  // Set position from saved data or default
  card.style.left = (sticker.posX !== undefined) ? `${sticker.posX}px` : '10px';
  card.style.top = (sticker.posY !== undefined) ? `${sticker.posY}px` : '10px';
  card.style.zIndex = 1;
  
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
  
  // Add NEW indicator if sticker is new
  if (sticker.isNew) {
    const newIndicator = document.createElement('div');
    newIndicator.className = 'new-indicator';
    newIndicator.textContent = 'NEW';
    card.appendChild(newIndicator);
    
    // Add event listeners to remove NEW indicator on interaction
    card.addEventListener('click', () => removeNewIndicator(index));
  }
  
  // Add drag functionality
  makeDraggable(card, index);
  
  // Assemble card
  cardBody.appendChild(itemName);
  cardBody.appendChild(expireDate);
  cardBody.appendChild(deleteBtn);
  
  card.appendChild(cardBody);
  container.appendChild(card);
}

// Function to remove NEW indicator
function removeNewIndicator(index) {
  const stickers = loadStickersFromStorage();
  if (stickers[index] && stickers[index].isNew) {
    console.log(`Removing NEW indicator from sticker at index ${index}`);
    stickers[index].isNew = false;
    saveStickersToStorage(stickers);
    
    // Remove indicator from DOM
    const newIndicators = document.querySelectorAll('.new-indicator');
    if (newIndicators.length > 0) {
      const cardElements = document.querySelectorAll('.item-card');
      if (cardElements[index]) {
        const indicator = cardElements[index].querySelector('.new-indicator');
        if (indicator) {
          indicator.remove();
        }
      }
    }
  }
}

// Function to make an element draggable
function makeDraggable(element, stickerIndex) {
  let initialX, initialY;
  let initialMouseX, initialMouseY;
  let isDragging = false;
  
  element.addEventListener('mousedown', dragMouseDown);
  element.addEventListener('touchstart', dragTouchStart, { passive: false });
  
  function dragMouseDown(e) {
    e.preventDefault();
    
    // Get initial positions
    initialX = element.offsetLeft;
    initialY = element.offsetTop;
    initialMouseX = e.clientX;
    initialMouseY = e.clientY;
    
    // Bring card to front when clicked
    element.style.zIndex = 10;
    
    document.addEventListener('mouseup', closeDragElement);
    document.addEventListener('mousemove', elementDrag);
    
    isDragging = false; // Reset flag
  }
  
  function dragTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    
    // Get initial positions
    initialX = element.offsetLeft;
    initialY = element.offsetTop;
    initialMouseX = touch.clientX;
    initialMouseY = touch.clientY;
    
    // Bring card to front when touched
    element.style.zIndex = 10;
    
    document.addEventListener('touchend', closeTouchDragElement);
    document.addEventListener('touchmove', elementTouchDrag, { passive: false });
    
    isDragging = false; // Reset flag
  }
  
  function elementDrag(e) {
    e.preventDefault();
    isDragging = true;
    
    // Calculate how far the mouse has moved from its initial position
    const deltaX = e.clientX - initialMouseX;
    const deltaY = e.clientY - initialMouseY;
    
    // Apply that same delta to the card position
    element.style.left = (initialX + deltaX) + "px";
    element.style.top = (initialY + deltaY) + "px";
  }
  
  function elementTouchDrag(e) {
    e.preventDefault();
    isDragging = true;
    
    const touch = e.touches[0];
    
    // Calculate how far the touch has moved from its initial position
    const deltaX = touch.clientX - initialMouseX;
    const deltaY = touch.clientY - initialMouseY;
    
    // Apply that same delta to the card position
    element.style.left = (initialX + deltaX) + "px";
    element.style.top = (initialY + deltaY) + "px";
  }
  
  function closeDragElement() {
    // Stop moving when mouse button is released
    document.removeEventListener('mouseup', closeDragElement);
    document.removeEventListener('mousemove', elementDrag);
    
    // Save position if actually dragged
    if (isDragging) {
      saveCardPosition(stickerIndex, element.offsetLeft, element.offsetTop);
      // Remove NEW indicator when dragged
      removeNewIndicator(stickerIndex);
    }
    
    // Reset z-index to normal
    setTimeout(() => {
      element.style.zIndex = 1;
    }, 200);
  }
  
  function closeTouchDragElement() {
    // Stop moving when touch ends
    document.removeEventListener('touchend', closeTouchDragElement);
    document.removeEventListener('touchmove', elementTouchDrag);
    
    // Save position if actually dragged
    if (isDragging) {
      saveCardPosition(stickerIndex, element.offsetLeft, element.offsetTop);
      // Remove NEW indicator when dragged
      removeNewIndicator(stickerIndex);
    }
    
    // Reset z-index to normal
    setTimeout(() => {
      element.style.zIndex = 1;
    }, 200);
  }
}

// Function to save card position to localStorage
function saveCardPosition(index, left, top) {
  const stickers = loadStickersFromStorage();
  
  if (stickers[index]) {
    stickers[index].posX = left;
    stickers[index].posY = top;
    saveStickersToStorage(stickers);
  }
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

// Updated function to add a sticky note with position data
async function addSticky({title, expDate, quantity, color = "#fffef5", category = null, posX = null, posY = null}, shouldSave = true, index = null) {
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
    console.log(`Need to categorize item: "${title}"`);
    category = await categorizeSticker(title);
    console.log(`Categorization result: "${category}"`);
  } else {
    console.log(`Using provided category "${category}" or categorization skipped (shouldSave=${shouldSave})`);
  }

  // Only save to localStorage if shouldSave is true
  if (shouldSave) {
    // Load existing stickers
    const stickers = loadStickersFromStorage();
    
    // Use provided position or get a new one
    if (posX === null || posY === null) {
      const newPosition = getNewItemPosition();
      posX = newPosition.x;
      posY = newPosition.y;
      console.log(`Placing new item at position (${posX}, ${posY})`);
    }
    
    console.log('Adding new sticker to storage:', {title, expDate, quantity, color, category, posX, posY});
    // Add isNew flag for new items
    stickers.push({title, expDate, quantity, color, category, posX, posY, isNew: true});
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

      // Get a position for the scanned sticker in the upper left region
      const position = getNewItemPosition();
      
      // Pass the position explicitly to ensure it's placed in the upper left
      addSticky({
        title, 
        expDate, 
        quantity, 
        posX: position.x, 
        posY: position.y
      }, true);

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

// Event listener for "Tidy Up" button
tidyUpBtn.addEventListener('click', () => {
  // Remove all NEW indicators when tidying up
  const stickers = loadStickersFromStorage();
  let hasChanges = false;
  
  stickers.forEach((sticker, index) => {
    if (sticker.isNew) {
      sticker.isNew = false;
      hasChanges = true;
    }
  });
  
  if (hasChanges) {
    saveStickersToStorage(stickers);
  }
  
  // Arrange all stickers in grid layout
  refreshStickerDisplay(true);
});

console.log("============= STICKER JS LOADED =============");