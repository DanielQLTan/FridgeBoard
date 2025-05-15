function makeCategory(category){
 	const section = document.createElement('div');
    section.className = `group ${category}`;
    const name = document.createElement('h2');
    name.textContent = category;
    const grid = document.createElement('div');
    grid.className = 'grid';
    section.append(name, grid);
    return {section, grid};
}
  
function addSticker(sticker){
 	const card = document.createElement('div');
    card.className = 'item-card';
    const name = document.createElement('h4');
    const title = sticker.title + ' (';
    const quantity = sticker.quantity + ')';
    name.textContent = title + quantity;
    const date = document.createElement('p');
    date.textContent = sticker.expDate;
    date.style.color = 'gray';
    card.append(name, date);
    return card;
}

const categoryMap = {};
const categoryDiv = document.getElementById('groups');
const categories = [
	'Fruits',
	'Vegetables',
	'Dairy',
	'Meat', 
	'Seafood',
	'Beverage',
	'Others'];
for (category of categories) {
	const make = makeCategory(category);
	categoryMap[category] = make;
	categoryDiv.append(make.section);
}

const stickers = JSON.parse(localStorage.getItem('stickers'));
for (sticker of stickers) {
	const card = addSticker(sticker);
	categoryMap[sticker.category].grid.append(card);
}