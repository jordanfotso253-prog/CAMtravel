// Menu mobile de la page d'accueil (bouton .nav-toggle)
const navToggle = document.querySelector('.nav-toggle');
if (navToggle) {
  const navLinks = document.querySelector('.nav-links');
  navToggle.addEventListener('click', () => {
    navLinks.classList.toggle('mobile-open');
  });
}

// Menu déroulant des pages internes (bouton .search-toggle)
const searchToggle = document.querySelector('.search-toggle');
if (searchToggle) {
  const dropdown = document.querySelector('.search-dropdown');
  if (dropdown) {
    searchToggle.addEventListener('click', () => {
      dropdown.classList.toggle('open');
    });
    document.addEventListener('click', (e) => {
      if (!dropdown.contains(e.target) && !searchToggle.contains(e.target)) {
        dropdown.classList.remove('open');
      }
    });
  }
}
