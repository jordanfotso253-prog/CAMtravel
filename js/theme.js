// Thème clair/sombre : appliqué tout de suite (avant l'affichage de la
// page) pour éviter un flash, et réutilisable depuis n'importe quelle page.
(function () {
  function getTheme() { return localStorage.getItem('camtravel_theme') || 'light'; }
  function applyTheme(theme) { document.documentElement.setAttribute('data-theme', theme); }
  window.camtravelGetTheme = getTheme;
  window.camtravelSetTheme = function (theme) {
    localStorage.setItem('camtravel_theme', theme);
    applyTheme(theme);
  };
  applyTheme(getTheme());
})();
