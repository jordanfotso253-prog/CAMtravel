// Thème clair/sombre : appliqué tout de suite (avant l'affichage de la
// page) pour éviter un flash, et réutilisable depuis n'importe quelle page.
(function () {
  function getTheme() { return localStorage.getItem('camtravel_theme') || 'light'; }
  function applyTheme(theme) { document.documentElement.setAttribute('data-theme', theme); }
  function getPalette() { return localStorage.getItem('camtravel_palette') || 'forest'; }
  function applyPalette(palette) { document.documentElement.setAttribute('data-palette', palette); }
  window.camtravelGetTheme = getTheme;
  window.camtravelSetTheme = function (theme) {
    localStorage.setItem('camtravel_theme', theme);
    applyTheme(theme);
  };
  window.camtravelGetPalette = getPalette;
  window.camtravelSetPalette = function (palette) {
    const allowed = ['forest', 'ocean', 'sunset', 'berry', 'gold'];
    const selected = allowed.includes(palette) ? palette : 'forest';
    localStorage.setItem('camtravel_palette', selected);
    applyPalette(selected);
  };
  applyTheme(getTheme());
  applyPalette(getPalette());
})();
