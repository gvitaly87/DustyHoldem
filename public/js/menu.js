const nav = document.getElementById('nav');
const burger = document.getElementById('burger');
const overlay = document.getElementById('overlay');

burger.addEventListener('click', () => {
    burger.classList.toggle('active');
    nav.classList.toggle('active');
    overlay.classList.toggle('active');
});