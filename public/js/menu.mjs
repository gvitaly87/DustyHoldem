const nav = document.getElementById("nav");
const burger = document.getElementById("burger");
const overlay = document.getElementById("overlay");

const toggleSideBar = () => {
  burger.classList.toggle("active");
  nav.classList.toggle("active");
  overlay.classList.toggle("active");
  const playNow = document.querySelector(".play-now::before");
  playNow.style.setProperty("--transform-rotate-var", "-45deg");
  playNow.style.setProperty("--transform-bg-color", "rgba(255, 255, 255, 0)");
};

burger.addEventListener("click", toggleSideBar);

export default toggleSideBar;
