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
  const savedStickers = loadStickersFromStorage();
  savedStickers.forEach(sticker => {
    addSticky(sticker, false); // false means don't save to storage
  });
});

async function categorizeSticker(title) {
    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'REMOVED_KEY' // Replace with your actual API key
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
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

async function addSticky({title, expDate, quantity, color = "#fffef5"}, shouldSave = true) {
    if (!quantity){
        quantity = "1";
    }

    if (!expDate) {
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
    
    const note = document.createElement("div");
    note.className = "sticky";
    note.style.backgroundColor = color;

    note.innerHTML = `
      <h4 class="sticky-title">${title}</h4>
  
      <div class="sticky-meta">
        <p>Expires:<br><strong>${expDate}</strong></p>
        <p>Quantity:<br><strong>${quantity}</strong></p>
      </div>
    `;
  
    stickyBoard.appendChild(note);

    const category = await categorizeSticker(title);

    // Only save to localStorage if shouldSave is true
    if (shouldSave) {
      console.log('Adding new sticker to storage:', {title, expDate, quantity, color, category});
      const stickers = loadStickersFromStorage();
      stickers.push({title, expDate, quantity, color, category});
      saveStickersToStorage(stickers);
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

console.log("loaded stickers");