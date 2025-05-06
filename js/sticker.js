// =============================================================================
// JS for Sticker Page
// Sections:
//   1. Global DOM Elements
//   2. Add Item Pop-up page (typing/handwriting panel)
//   3. Section 3: Scan Stickers (camera capture)
//   4. LocalStorage for sticker objects
//   5. Sticker Display & Layout
//   6. Drag & Positioning Utilities
//   7. Tidy Up & Grid Arrangement
// =============================================================================

// ============================================================================
// Section 1: Global DOM Elements & Helper function
// ============================================================================

const stickyBoard = document.getElementById("sticky-board");
const modal = document.getElementById('handwriting-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const addItemBtn = document.getElementById('add-item-btn');
const addItemSubmit = document.getElementById('add-item-submit');
const tidyUpBtn = document.getElementById('tidy-up-btn');

let gridActive = false;   // true when board is in grid layout

// Tidy up by grid
function setGridMode(on){
  gridActive = on;
  localStorage.setItem('gridMode', on ? '1' : '0');
}

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
// Section 3: Scan Stickers (camera capture)
// ============================================================================

const scanForm  = document.querySelector(".upload-sticker form");
const scanBtn   = scanForm.querySelector('input[type="submit"]');  // green button
const scanModal    = document.getElementById('scan-modal');
const scanCloseBtn = document.getElementById('scan-close-btn');

const videoEl       = document.getElementById('camera-video');
const capturedImgEl = document.getElementById('captured-img');
const captureBtn    = document.getElementById('capture-btn');
const recaptureBtn  = document.getElementById('recapture-btn');
const confirmBtn    = document.getElementById('confirm-btn');

let videoStream = null;
let capturedDataUrl = null;
let videoReady = false;
captureBtn.disabled = true;

function openScanModal(){
  scanModal.style.display = 'flex';
}
function closeScanModal(){
  scanModal.style.display = 'none';
  videoEl.classList.remove('d-none');
  capturedImgEl.classList.add('d-none');
  captureBtn.style.display  = '';
  recaptureBtn.style.display= 'none';
  confirmBtn.style.display  = 'none';
  capturedDataUrl = null;
}

//------------- open the pop-up page ----------------------------
scanBtn.addEventListener('click', async (e) => {
  e.preventDefault();

  if (!videoStream){
    try{
      videoStream = await navigator.mediaDevices.getUserMedia({video:true});
      videoEl.srcObject = videoStream;
      videoReady = false;
      videoEl.onloadedmetadata = () => {
        videoReady = true;
        captureBtn.disabled = false;
      };
    }catch(err){
      alert('Unable to access camera.');
      return;
    }
  }
  captureBtn.disabled = !videoReady;
  openScanModal();
});

//---------------- close the pop-up page ---------------------------
scanCloseBtn.addEventListener('click', closeScanModal);

//---------------- capture the sticker ----------------------------
captureBtn.addEventListener('click', () => {
  if (!videoReady) return;

  const canvas = document.createElement('canvas');
  canvas.width  = videoEl.videoWidth  || videoEl.clientWidth;
  canvas.height = videoEl.videoHeight || videoEl.clientHeight;

  canvas.getContext('2d').drawImage(videoEl, 0, 0, canvas.width, canvas.height);

  capturedDataUrl = canvas.toDataURL('image/jpeg');
  capturedImgEl.src = capturedDataUrl;
  capturedImgEl.style.display = '';
  capturedImgEl.classList.remove('d-none');
  videoEl.classList.add('d-none');

  captureBtn.style.display  = 'none';
  recaptureBtn.style.display= '';
  recaptureBtn.classList.remove('d-none');
  confirmBtn.style.display  = '';
  confirmBtn.classList.remove('d-none');
});

//------------ re‑capture the sticker if user wants to ----------
recaptureBtn.addEventListener('click', () => {
  videoEl.classList.remove('d-none');
  capturedImgEl.style.display='none';
  captureBtn.style.display  = '';
  recaptureBtn.style.display= 'none';
  confirmBtn.style.display  = 'none';
  capturedDataUrl = null;
});

//----------- confirm submission of the sticker -----------------
confirmBtn.addEventListener('click', async ()=>{
  if(!capturedDataUrl) return;

  confirmBtn.disabled=true;
  confirmBtn.textContent='Processing…';

  const resp = await fetch(
    'https://noggin.rea.gent/wily-starfish-4015',
    {
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        Authorization:'Bearer rg_v1_f19t3fxicscspdee1x5rk3i9frr873wzsb9j_ngk'
      },
      body:JSON.stringify({sticker:capturedDataUrl})
    }
  ).then(r=>r.text());

  const [title,expDate,quantity] = resp.trim().split('\n').map(s=>s.trim());
  const {x:posX,y:posY} = getNewItemPosition();
  await addSticky({title,expDate,quantity,posX,posY},true);

  confirmBtn.disabled=false;
  confirmBtn.textContent='Confirm';
  captureBtn.disabled = true;
  closeScanModal();
});


// ============================================================================
// Section 4: LocalStorage for sticker objects
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
// Section 5: Sticker Display & Layout
// ============================================================================
// Load existing stickers on page load
window.addEventListener('load', () => {
  gridActive = localStorage.getItem('gridMode') === '1';
  refreshStickerDisplay(gridActive);
  return;
});

// Function to delete a sticker by its index
function deleteSticker(indexToRemove) {
  const stickers = loadStickersFromStorage();

  // 1. Grab the current DOM cards and their true pixel positions
  const container = document.querySelector('.card-container');
  if (container) {
    const boardRect = container.getBoundingClientRect();
    const cardNodes = container.querySelectorAll('.item-card');

    cardNodes.forEach((card, domIdx) => {
      if (domIdx === indexToRemove) return;     // skip the one we’ll delete
      if (!stickers[domIdx]) return;            // safety

      const rect = card.getBoundingClientRect();
      stickers[domIdx].posX = rect.left - boardRect.left;
      stickers[domIdx].posY = rect.top  - boardRect.top;
    });
  }

  // 2. Remove the chosen sticker from the data array
  stickers.splice(indexToRemove, 1);

  // 3. Persist and redraw in the current layout mode
  saveStickersToStorage(stickers);
  refreshStickerDisplay(gridActive);   // gridActive is true if you were tidied
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
    arrangeCardsInGrid(savedStickers, cardContainer);
  } else {
    savedStickers.forEach((sticker, index) => {
      createDraggableCard(sticker, index, cardContainer, false);
    });
  }
  
  stickyBoard.appendChild(cardContainer);
}

// Function to arrange cards in a grid layout
function arrangeCardsInGrid(stickers, container){
  container.style.display = 'grid';
  container.style.gridTemplateColumns = 'repeat(auto-fill, 220px)';
  container.style.gap = '15px';
  container.style.gridAutoRows = '100px';  

  stickers.forEach((s, idx) =>
    createDraggableCard(s, idx, container, /*grid=*/true)
  );

  gridActive = true;
}

// Updated function to create a draggable card with NEW indicator
function createDraggableCard(sticker, index, container, grid = false) {
  // Create card for each item
  const card = document.createElement('div');
  card.className = 'item-card draggable';
  card.style.position = grid ? 'relative' : 'absolute';
  if (!grid) {
    card.style.left = (sticker.posX ?? 10) + 'px';
    card.style.top  = (sticker.posY ?? 10) + 'px';
  }
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
// Section 6: Drag & Positioning Utilities
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
    setGridMode(false);

    if (getComputedStyle(element).position !== 'absolute') {
      const boardRect = stickyBoard.getBoundingClientRect();
      const cardRect  = element.getBoundingClientRect();
      element.style.position = 'absolute';
      element.style.left = (cardRect.left - boardRect.left) + 'px';
      element.style.top  = (cardRect.top  - boardRect.top)  + 'px';
    }
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
    setGridMode(false);

    if (getComputedStyle(element).position !== 'absolute') {
      const boardRect = stickyBoard.getBoundingClientRect();
      const cardRect  = element.getBoundingClientRect();
      element.style.position = 'absolute';
      element.style.left = (cardRect.left - boardRect.left) + 'px';
      element.style.top  = (cardRect.top  - boardRect.top)  + 'px';
    }

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

// Key function: add a sticky note
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
  
  // Get Category by name
  if (!category) {
    try {
      const catResp = await fetch(
        'https://noggin.rea.gent/better-termite-1234',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer rg_v1_mi5yaxvwg3hy61pnupbog4s47to2qr6gru3r_ngk'
          },
          body: JSON.stringify({ name: title })
        }
      ).then(r => r.text());

      category = catResp.trim() || 'Others';
    } catch (err) {
      console.error('Category API error:', err);
      category = 'Other';
    }
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
    
    refreshStickerDisplay(gridActive);
  }
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
  
  setGridMode(true);

  // Arrange all stickers in grid layout
  refreshStickerDisplay(true);
});