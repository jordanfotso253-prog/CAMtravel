/**
 * Statistiques mensuelles réelles à partir des réservations / colis / utilisateurs.
 * Génère des barres SVG pour les tableaux de bord.
 */
(function () {
  const MONTHS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
  const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  function monthKey(isoOrDate) {
    const d = new Date(isoOrDate);
    if (isNaN(d)) return null;
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  }

  function lastNMonths(n) {
    const out = [];
    const now = new Date();
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      out.push({
        key: d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'),
        label: (typeof camtravelGetLang === 'function' && camtravelGetLang() === 'en' ? MONTHS_EN : MONTHS_FR)[d.getMonth()],
        year: d.getFullYear(),
        month: d.getMonth()
      });
    }
    return out;
  }

  /**
   * @param {Array} items - objets avec date (createdAt ou date)
   * @param {number} nMonths
   * @param {function} valueFn - (item) => number (défaut 1 = count)
   */
  function aggregateByMonth(items, nMonths, valueFn) {
    const months = lastNMonths(nMonths || 6);
    const map = {};
    months.forEach(m => { map[m.key] = 0; });
    (items || []).forEach(it => {
      const key = monthKey(it.createdAt || it.date || it.at);
      if (key && map[key] !== undefined) {
        map[key] += valueFn ? Number(valueFn(it) || 0) : 1;
      }
    });
    return months.map(m => ({ ...m, value: map[m.key] || 0 }));
  }

  function renderBarChart(container, series, opts) {
    if (!container) return;
    opts = opts || {};
    const color = opts.color || 'var(--green-deep, #0b5c3d)';
    const height = opts.height || 160;
    const max = Math.max(1, ...series.map(s => s.value));
    const bars = series.map(s => {
      const h = Math.round((s.value / max) * (height - 36));
      return `
        <div class="mstat-bar-col" title="${s.label} ${s.year}: ${s.value.toLocaleString('fr-FR')}">
          <div class="mstat-val">${s.value > 0 ? (opts.format ? opts.format(s.value) : s.value) : ''}</div>
          <div class="mstat-bar" style="height:${h}px;background:${color};"></div>
          <div class="mstat-lbl">${s.label}</div>
        </div>`;
    }).join('');
    container.innerHTML = `<div class="mstat-chart" style="min-height:${height}px">${bars}</div>`;
  }

  function renderDualChart(container, seriesA, seriesB, opts) {
    if (!container) return;
    opts = opts || {};
    const height = opts.height || 160;
    const max = Math.max(1, ...seriesA.map(s => s.value), ...seriesB.map(s => s.value));
    const cols = seriesA.map((s, i) => {
      const hA = Math.round((s.value / max) * (height - 36));
      const hB = Math.round(((seriesB[i] && seriesB[i].value) || 0) / max * (height - 36));
      return `
        <div class="mstat-bar-col" title="${s.label}">
          <div class="mstat-val">${s.value || ''}</div>
          <div style="display:flex;align-items:flex-end;gap:3px;height:${height - 36}px;">
            <div class="mstat-bar" style="height:${hA}px;width:12px;background:${opts.colorA || '#0b5c3d'};"></div>
            <div class="mstat-bar" style="height:${hB}px;width:12px;background:${opts.colorB || '#f5921b'};"></div>
          </div>
          <div class="mstat-lbl">${s.label}</div>
        </div>`;
    }).join('');
    container.innerHTML = `<div class="mstat-chart" style="min-height:${height}px">${cols}</div>
      <div class="mstat-legend">
        <span><i style="background:${opts.colorA || '#0b5c3d'}"></i> ${opts.labelA || 'A'}</span>
        <span><i style="background:${opts.colorB || '#f5921b'}"></i> ${opts.labelB || 'B'}</span>
      </div>`;
  }

  window.camtravelMonthlyStats = {
    lastNMonths, aggregateByMonth, renderBarChart, renderDualChart, monthKey
  };
})();
