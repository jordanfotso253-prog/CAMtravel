/**
 * Destinations / villes du Cameroun pour CAM travel
 */
(function () {
  const CITIES = [
    // Principales
    'Yaoundé', 'Douala', 'Bafoussam', 'Bamenda', 'Garoua', 'Maroua', 'Ngaoundéré',
    'Bertoua', 'Ebolowa', 'Kribi', 'Limbé', 'Buea', 'Kumba', 'Edéa', 'Nkongsamba',
    // Centre & Sud
    'Mbalmayo', 'Obala', 'Bafia', 'Sangmélima', 'Ambam', 'Akonolinga', 'Nanga-Eboko',
    // Littoral / Ouest
    'Dschang', 'Foumban', 'Mbouda', 'Bangangté', 'Melong', 'Loum', 'Manjo',
    // Nord / Extrême-Nord / Adamaoua
    'Garoua-Boulaï', 'Meiganga', 'Tibati', 'Yagoua', 'Kousseri', 'Mokolo', 'Guider',
    // Est
    'Abong-Mbang', 'Batouri', 'Yokadouma',
    // Nord-Ouest / Sud-Ouest
    'Wum', 'Fundong', 'Mamfé', 'Tiko', 'Mutengene'
  ].sort((a, b) => a.localeCompare(b, 'fr'));

  /** Suggestions de prix indicatifs (FCFA) pour paires courantes */
  const SUGGESTED_PRICES = {
    'Yaoundé|Douala': 12500,
    'Douala|Yaoundé': 12500,
    'Yaoundé|Bafoussam': 10000,
    'Douala|Bafoussam': 10000,
    'Yaoundé|Bamenda': 12000,
    'Douala|Bamenda': 11000,
    'Yaoundé|Bertoua': 15000,
    'Yaoundé|Garoua': 25000,
    'Yaoundé|Ngaoundéré': 20000,
    'Yaoundé|Maroua': 30000,
    'Douala|Kribi': 5000,
    'Yaoundé|Kribi': 8000,
    'Douala|Limbé': 2500,
    'Douala|Buea': 3000,
    'Yaoundé|Ebolowa': 5000,
    'Douala|Nkongsamba': 4000,
    'Bafoussam|Bamenda': 3500,
    'Garoua|Maroua': 5000,
    'Ngaoundéré|Garoua': 8000
  };

  function optionsHtml(selected) {
    return '<option value="">Choisir une ville</option>' +
      CITIES.map(c => `<option value="${c}"${c === selected ? ' selected' : ''}>${c}</option>`).join('');
  }

  function fillSelect(el, selected) {
    if (!el) return;
    el.innerHTML = optionsHtml(selected || '');
  }

  function fillAllCitySelects(selector) {
    document.querySelectorAll(selector || 'select[data-cities], #tFrom, #tTo, #depart, #arrivee, #editFrom, #editTo').forEach(el => {
      const cur = el.value || el.getAttribute('data-selected') || '';
      fillSelect(el, cur);
    });
  }

  function suggestedPrice(from, to) {
    return SUGGESTED_PRICES[from + '|' + to] || SUGGESTED_PRICES[to + '|' + from] || 10000;
  }

  window.camtravelCities = {
    CITIES,
    optionsHtml,
    fillSelect,
    fillAllCitySelects,
    suggestedPrice
  };
})();
