const categories = ['Fruits', 'Vegetables', 'Dairy', 'Meat', 'Seafood', 'Beverage', 'Others'];

const groupMap = {};

const groupsParent = document.getElementById('groups');

for (cat of categories) {
	const g = makeGroup(cat, cat);
  	groupMap[cat] = g;
  	groupsParent.appendChild(g.wrapper);
}



const stickers = JSON.parse(localStorage.getItem('stickers') || '[]');

for (sticker of stickers) {
	let bucketKey = sticker.category;
	const bucket = groupMap[sticker.category];
	bucket.grid.appendChild(addSticker(sticker));
}


  
function makeGroup(title, className){
	const wrapper = document.createElement('section');
    wrapper.className = `group ${className}`;
  
    const h2 = document.createElement('h2');
    h2.textContent = title;
    wrapper.appendChild(h2);
  
    const grid = document.createElement('div');
    grid.className = 'grid';
    wrapper.appendChild(grid);
    return { wrapper, grid };
}
  
function addSticker(sticker){
    const card = document.createElement('div');
    card.className = 'item-card';
  
    const title = document.createElement('h4');
    title.textContent = sticker.title ?? 'item';
    title.style.margin = '6px 8px 0';
    title.style.fontSize = '1.2rem';
  
    const date = document.createElement('p');
    date.textContent = sticker.expDate ?? '';
    date.style.margin = '2px 8px 0';
    date.style.fontSize = '0.8rem';
    date.style.color   = '#666';
  
    card.append(title, date);
    return card;
}