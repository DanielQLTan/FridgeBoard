function makeShop(shop){
 	const section = document.createElement('div');
    section.className = `group ${shop.slice(0, 1)}`;
    const name = document.createElement('h2');
    name.textContent = shop;
    const grid = document.createElement('div');
    grid.className = 'grid';
    section.append(name, grid);
    return {section, grid};
}
  
function addSticker(sticker){
 	const card = document.createElement('div');
    card.className = 'item-card';
    const name = document.createElement('h4');
    name.textContent = sticker.title;
    const img = document.createElement('img');
    img.src = "https://noggin.rea.gent/content-louse-5415?key=rg_v1_wyfuerdxn0c72guwxl0wssyn2h2nw06xxqfk_ngk&item=" + sticker.title;
    img.alt = sticker.title;
    card.append(name, img);
    return card;
}

const shopMap = {};
const shopDiv = document.getElementById('groups');
const shops = [
    'Costco',
    'Trader Joe',
    'Whole Foods Market',
    'Safeway'];
for (shop of shops) {
	const make = makeShop(shop);
	shopMap[shop] = make;
	shopDiv.append(make.section);
}

const stickers = JSON.parse(localStorage.getItem('stickers'));
for (sticker of stickers) {
	const card = addSticker(sticker);
    const category = sticker.category;
    if (category == 'Meat' || category == 'Beverage') {
        shopMap['Costco'].grid.append(card);
    } else if (category == 'Dairy' || category == 'Others') {
        shopMap['Trader Joe'].grid.append(card);
    } else if (category == 'Fruits' || category == 'Seafood') {
        shopMap['Whole Foods Market'].grid.append(card);
    } else {
        shopMap['Safeway'].grid.append(card);
    }
}