// =============================================================================
// JS for Sticker Page
// Sections:
//   1. Global DOM Elements
//   2. Add Item Pop-up page (typing/handwriting panel)
//   3. Sticker Data Persistence (localStorage) & Category Helpers
//   4. Sticker Display & Layout
//   5. Drag & Positioning Utilities
//   6. Sticker Upload (Image OCR)
//   7. Tidy Up & Grid Arrangement
//   8. Initialization
// =============================================================================
import { OPENAI_API_KEY } from './config.js';

// ============================================================================
// Section 1: Global DOM Elements
// ============================================================================

const stickyBoard = document.getElementById("sticky-board");
const modal = document.getElementById('handwriting-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const addItemBtn = document.getElementById('add-item-btn');
const addItemSubmit = document.getElementById('add-item-submit');
const tidyUpBtn = document.getElementById('tidy-up-btn');


// ============================================================================
// Section 2: Add Item Pop-up page (typing/handwriting panel)
// ============================================================================

const handwritingCanvas  = document.getElementById('handwriting-canvas');
const ctx                = handwritingCanvas.getContext('2d');

const typingForm         = document.getElementById('typing-form');
const handwritingForm    = document.getElementById('handwriting-form');
const toggleBtn          = document.getElementById('toggle-handwriting-btn');

const itemInput      = document.getElementById('item-input');
const dateInput      = document.getElementById('date-input');
const quantityInput  = document.getElementById('quantity-input');

//------------------ hand writing panel helpers ---------------------------
// logic for drawing
let drawing = false;
handwritingCanvas.addEventListener('mousedown', e => {
  drawing = true;
  ctx.beginPath();
  ctx.moveTo(e.offsetX, e.offsetY);
});
handwritingCanvas.addEventListener('mousemove', e => {
  if (!drawing) return;
  ctx.lineTo(e.offsetX, e.offsetY);
  ctx.stroke();
});
['mouseup', 'mouseleave'].forEach(ev =>
  handwritingCanvas.addEventListener(ev, () => (drawing = false))
);

// clear the handwriting traces and set up a white background
function clearCanvas () {
  ctx.clearRect(0, 0, handwritingCanvas.width, handwritingCanvas.height);
  ctx.fillStyle = '#ffffff'; 
  ctx.fillRect(0, 0, handwritingCanvas.width, handwritingCanvas.height);
}

// enter handwriting mode
let handwritingMode = false;
toggleBtn.addEventListener('click', () => {
  handwritingMode = !handwritingMode;
  typingForm.style.display      = handwritingMode ? 'none'  : 'block';
  handwritingForm.style.display = handwritingMode ? 'block' : 'none';
  // update icon & tooltip
  toggleBtn.querySelector('img').src = handwritingMode
    ? '../img/Keyboard.svg'
    : '../img/Edit.svg';
  toggleBtn.title = handwritingMode
    ? 'Back to typing'
    : 'Switch to handwriting';
  clearCanvas();
});

// Process handwriting using reagent
async function processHandwriting(dataUrl, type) {
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

//------------------ open pop-up page ---------------------------------------
addItemBtn.addEventListener('click', () => {
  // reset inputs & canvas
  itemInput.value = dateInput.value = quantityInput.value = '';
  clearCanvas();

  // default to typing mode
  handwritingMode = false;
  typingForm.style.display      = 'block';
  handwritingForm.style.display = 'none';
  toggleBtn.querySelector('img').src = '../img/Edit.svg';
  toggleBtn.title = 'Switch to handwriting';

  modal.style.display = 'flex';
});


//------------------ submit sticker item -----------------------------------
addItemSubmit.addEventListener('click', async () => {
  let title, expDate, quantity;
  addItemSubmit.disabled = true;
  addItemSubmit.textContent = 'Processing...';

  if (handwritingMode) {
    const dataURL = handwritingCanvas.toDataURL('image/png');
    const ocr     = (await processHandwriting(dataURL, 'item')).trim();
    [title, expDate, quantity] = ocr.split(/\n/).map(s => s.trim());
  } else {
    title     = itemInput.value.trim();
    expDate   = dateInput.value.trim();
    quantity  = quantityInput.value.trim();
  }

  if (!title) {
    alert('Please enter at least an item name.');
    addItemSubmit.disabled  = false;
    addItemSubmit.textContent = 'Add item';
    return;
  }

  await addSticky({ title, expDate, quantity }, true);
  modal.style.display = 'none';
  addItemSubmit.disabled = false;
  addItemSubmit.textContent = 'Add item';
});

//------------------ close pop-up page ------------------------------------
closeModalBtn.addEventListener('click', function() {
  modal.style.display = 'none';
});


// ============================================================================
// Section 3: Sticker Data Persistence (localStorage) & Category Helpers
// ============================================================================
// Function to save stickers to localStorage
function saveStickersToStorage(stickers) {
  localStorage.setItem('stickers', JSON.stringify(stickers));
}

// Function to load stickers from localStorage
function loadStickersFromStorage() {
  const stickersData = localStorage.getItem('stickers');
  const stickers = stickersData ? JSON.parse(stickersData) : [];
  return stickers;
}

// ============================================================================
// Section 4: Sticker Display & Layout
// ============================================================================
// Load existing stickers on page load
window.addEventListener('load', () => {
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
    const category = data.choices[0].message.content.trim();
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

// ============================================================================
// Section 5: Drag & Positioning Utilities
// ============================================================================
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
    category = await categorizeSticker(title);
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
    }
    // Add isNew flag for new items
    stickers.push({title, expDate, quantity, color, category, posX, posY, isNew: true});
    saveStickersToStorage(stickers);
    
    // Refresh the display to show the new item
    refreshStickerDisplay();
  }
}

// ============================================================================
// Section 6: Sticker Upload (Image OCR)
// ============================================================================
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
  // No-op for production
}

// ============================================================================
// Section 7: Tidy Up & Grid Arrangement
// ============================================================================
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

// ============================================================================
// Section 8: Initialization
// ============================================================================

console.log("============= STICKER JS LOADED =============");