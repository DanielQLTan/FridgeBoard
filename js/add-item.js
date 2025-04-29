const p = document.querySelector("p");
const stickyBoard = document.getElementById("sticky-board");
const addItemForm = document.getElementById("add-item-form");

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
  const savedStickers = loadStickersFromStorage();
  savedStickers.forEach(sticker => {
    addSticky(sticker, false); // false means don't save to storage
  });
});

// Function to categorize items using OpenAI API - reusing from sticker.js
async function categorizeSticker(title) {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer REMOVED_KEY'
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that categorizes food items. Only respond with one of these categories without explanation: Dairy, Eggs, Vegetables, Fruits, Meats, Seafood, Drinks, Sauces, Other. If you are not sure, return Other."
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

// Function to add a sticky note - reusing from sticker.js with modifications
async function addSticky({title, expDate, quantity, color = "#fffef5", category = null}, shouldSave = true) {
  if (!quantity) {
    quantity = "1";
  }

  // If category not provided, use OpenAI to categorize
  if (!category) {
    category = await categorizeSticker(title);
  }
  
  const note = document.createElement("div");
  note.className = "sticky";
  note.style.backgroundColor = color;

  note.innerHTML = `
    <h4 class="sticky-title">${title}</h4>

    <div class="sticky-meta">
      <p>Expires:<br><strong>${expDate}</strong></p>
      <p>Quantity:<br><strong>${quantity}</strong></p>
      <p>Category:<br><strong>${category}</strong></p>
    </div>
  `;

  stickyBoard.appendChild(note);

  // Only save to localStorage if shouldSave is true
  if (shouldSave) {
    console.log('Adding new sticker to storage:', {title, expDate, quantity, color, category});
    const stickers = loadStickersFromStorage();
    stickers.push({title, expDate, quantity, color, category});
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
  
  // Add the item
  await addSticky({
    title,
    expDate: formattedDate || 'Not specified',
    quantity,
    color: "#fffef5"
  }, true);
  
  // Reset form
  addItemForm.reset();
});

console.log("loaded add-item page"); 