const p = document.querySelector("p");

const stickyBoard = document.getElementById("sticky-board");

async function addSticky({title, expDate, quantity, color = "#fffef5"}) {
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
        expDate = response.trim();
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
  }

  const uploadSticker = document.querySelector(".upload-sticker");
  const fileInput  = uploadSticker.querySelector('input[type="file"]');
  const submitBtn  = uploadSticker.querySelector('input[type="submit"]');

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

            addSticky({title, expDate, quantity});

            submitBtn.disabled = false;
            submitBtn.value = "Scan Sticker";
            fileInput.value = "";
          };

          fileReader.readAsDataURL(file);
        });

console.log("loaded stickers");