function nav() {
	const html = `
        <div class="nav-bar">
			<a href="../html/sticker.html" class="nav-item">
				<img class="nav-icon" src="../img/home.svg" alt="Home">
				<div class="nav-text">Home</div>
			</a>
			<a href="../html/category.html" class="nav-item">
				<img class="nav-icon" src="../img/grid.svg" alt="Sort">
				<div class="nav-text">Sort</div>
			</a>
			<a href="../html/expiration.html" class="nav-item">
				<img class="nav-icon" src="../img/calendar.svg" alt="Track">
				<div class="nav-text">Track</div>
			</a>
			<a href="../html/shopping.html" class="nav-item">
				<img class="nav-icon" src="../img/cart.svg" alt="Shop">
				<div class="nav-text">Shop</div>
			</a>
			<a href="###" class="nav-item">
				<img class="nav-icon" src="../img/user.svg" alt="Me">
				<div class="nav-text">Me</div>
			</a>
		</div>`;
	document.body.innerHTML += html;
}

function bar() {
	const items = document.querySelectorAll('.nav-item');
	for (item of items) {
		if (window.location.pathname.includes(item.getAttribute('href').slice(2))) {
			item.classList.add('active');
			const icon = item.querySelector('.nav-icon');
			const src = icon.getAttribute('src').replace('.svg', '-active.svg');
			icon.setAttribute('src', src);
		}
	}
}

nav();
bar();