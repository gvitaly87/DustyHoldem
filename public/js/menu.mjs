const nav = document.getElementById("nav");
const burger = document.getElementById("burger");
const overlay = document.getElementById("overlay");

const toggleSideBar = () => {
  burger.classList.toggle("active");
  nav.classList.toggle("active");
  overlay.classList.toggle("active");
};

burger.addEventListener("click", toggleSideBar);

export default toggleSideBar;
