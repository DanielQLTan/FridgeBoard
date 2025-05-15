function daysBetween(date){
    const due = new Date(date);
    const now = new Date();
    const diff = (due - now) / (24 * 60 * 60 * 1000);
    return Math.ceil(diff) + 1;
}
  
function makeGroup(title, key){
 	const section = document.createElement('div');
    section.className = `group ${key}`;
    const name = document.createElement('h2');
    name.textContent = title;
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
    name.style.fontSize = '18px';
    const date = document.createElement('p');
    date.textContent = sticker.expDate;
    date.style.color = 'gray';
    const diff = document.createElement('p');
    diff.textContent = daysBetween(sticker.expDate);
    diff.style.color = 'red';
    diff.style.fontSize = '24px';
    const text = document.createElement('p');
    text.textContent = 'Days Left!';
    card.append(name, date, diff, text);
    return card;
}

const groupMap = {};
const groupDiv = document.getElementById('groups');
const groups = [
	{key:'week', title:'Expiring within a Week!'},
	{key:'month', title:'Expiring within a Month'},
	{key:'past', title:'Already Expired!!!'},
	{key:'far', title:'In Good Condition~'}];
for (group of groups) {
	const make = makeGroup(group.title, group.key);
	groupMap[group.key] = make;
	groupDiv.append(make.section);
}

const stickers = JSON.parse(localStorage.getItem('stickers'));
for (sticker of stickers) {
	const card = addSticker(sticker);
	const days = daysBetween(sticker.expDate);
	if (days < 0) {
		groupMap['past'].grid.append(card);
	} else if (days <= 7) {
		groupMap['week'].grid.append(card);
	} else if (days <= 30) {
		groupMap['month'].grid.append(card);
	} else {
		groupMap['far'].grid.append(card);
	}
}