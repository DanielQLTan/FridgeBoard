// Create Group Wrappers
const groups = [
  { key:'week', title:'Expiring This Week', css:'exp-week'},
  { key:'month', title:'Expiring This Month', css:'exp-month'},
  { key:'past', title:'Past Expiry', css:'exp-past'}
];

const groupMap = {};
const groupsParent = document.getElementById('exp-groups');
groups.forEach(def=>{
  const g = makeGroup(def.title, def.css);
  groupMap[def.key] = g;
  groupsParent.appendChild(g.wrapper);
});

// Add stickers to each group wrapper
const stickers = JSON.parse(localStorage.getItem('stickers') || '[]');

stickers.forEach(sticker => {
  const diff = daysBetween(sticker.expDate);
  if (diff === null) return;

  let bucketKey;

  if (diff < 0) {
    bucketKey = 'past';
  } else if (diff < 7) {
    bucketKey = 'week';
  } else if (diff < 30) {
    bucketKey = 'month';
  } else {
    return;
  }

  const bucket = groupMap[bucketKey];
  bucket.grid.appendChild(addSticker(sticker));
});

//------------------------ helper functions ----------------------------
// calculate date countdown for each sticker
function daysBetween(dateStr){
    if (!dateStr) return null;
    
    const target = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    return Math.ceil((target - today) / (1000*60*60*24));
  }
  
  // make a group wrapper
  function makeGroup(title, className){
    const wrapper = document.createElement('section');
    wrapper.className = `exp-group ${className}`;
  
    const h2 = document.createElement('h2');
    h2.textContent = title;
    wrapper.appendChild(h2);
  
    const grid = document.createElement('div');
    grid.className = 'exp-grid';
    wrapper.appendChild(grid);
  
    return { wrapper, grid };
  }
  
  // add a sticker to a group
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