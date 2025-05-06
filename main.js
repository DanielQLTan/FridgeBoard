const btn = document.querySelector("button");
console.log("loaded well");

function nav() {
	const items = document.querySelectorAll('.nav-item');
	for (item of items) {
		if (item.getAttribute('href') == window.location.pathname) {
			item.classList.add('active');
			const icon = item.querySelector('.nav-icon');
			const src = icon.getAttribute('src').replace('.svg', '-active.svg');
			icon.setAttribute('src', src);
		}
	}
}
document.addEventListener('DOMContentLoaded', nav);