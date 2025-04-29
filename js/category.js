const p = document.querySelector("p");
console.log("loaded categories");

function loadCategorizedStickers() {
    const stickersData = localStorage.getItem('stickers');
    return stickersData ? JSON.parse(stickersData) : [];
}

function displayStickersByCategory() {
    const stickers = loadCategorizedStickers();
    const categories = {};

    stickers.forEach(sticker => {
        const { category } = sticker;
        if (!categories[category]) {
            categories[category] = [];
        }
        categories[category].push(sticker);
    });

    const container = document.createElement('div');

    Object.keys(categories).forEach(category => {
        const categorySection = document.createElement('section');
        categorySection.innerHTML = `<h2>${category}</h2>`;

        categories[category].forEach(sticker => {
            const stickerDiv = document.createElement('div');
            stickerDiv.className = 'sticker';
            stickerDiv.innerHTML = `
                <h4>${sticker.title}</h4>
                <p>Expires: ${sticker.expDate}</p>
                <p>Quantity: ${sticker.quantity}</p>
            `;
            categorySection.appendChild(stickerDiv);
        });

        container.appendChild(categorySection);
    });

    document.body.appendChild(container);
}

window.addEventListener('load', displayStickersByCategory);