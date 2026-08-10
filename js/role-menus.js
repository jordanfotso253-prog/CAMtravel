(function () {
  function groupFor(role, href, text) {
    const value = (href + ' ' + text).toLowerCase();
    if (role === 'admin') {
      if (value.includes('agenc')) return 'Gestion des agences';
      if (value.includes('user')) return 'Gestion des utilisateurs';
      if (value.includes('reservation') || value.includes('remboursement')) return 'Réservations';
      if (value.includes('commission') || value.includes('paiement') || value.includes('revenu')) return 'Paiements';
      if (value.includes('vehicul') || value.includes('chauff') || value.includes('ticket')) return 'Transport';
      if (value.includes('rapport') || value.includes('adminreports')) return 'Rapports';
      if (value.includes('param')) return 'Paramètres';
      return null;
    }
    if (role === 'agency') {
      if (value.includes('ticket')) return 'Billets';
      if (value.includes('vehicle') || value.includes('bus')) return 'Mes bus';
      if (value.includes('#trips') || value.includes('trajet')) return 'Trajets';
      if (value.includes('#bookings') || value.includes('reservation') || value.includes('rental')) return 'Réservations';
      if (value.includes('staff') || value.includes('equipe')) return 'Personnel';
      if (value.includes('param') || value.includes('location')) return 'Profil agence';
      return null;
    }
    if (value.includes('ticket')) return 'Mes billets';
    if (value.includes('reservation')) return 'Mes réservations';
    if (value.includes('paiement') || value.includes('refund')) return 'Paiements';
    if (value.includes('notification')) return 'Notifications';
    if (value.includes('profil') || value.includes('param')) return 'Mon profil';
    if (value.includes('tracking') || value.includes('suivi')) return 'Historique';
    if (value.includes('location') || value.includes('colis') || value.includes('recherche')) return 'Voyages';
    return null;
  }

  function build() {
    const queryRole = new URLSearchParams(window.location.search).get('role');
    const role = queryRole === 'agency' ? 'agency'
      : queryRole === 'admin' ? 'admin'
      : document.body.classList.contains('role-admin') ? 'admin'
      : document.body.classList.contains('role-agency') ? 'agency' : 'client';
    const nav = document.querySelector('.sidebar > .sidebar-nav');
    if (!nav || nav.dataset.toggleMenusReady === 'true') return;
    nav.dataset.toggleMenusReady = 'true';

    const sidebar = nav.closest('.sidebar');
    if (sidebar && !document.querySelector('.sidebar-toggle')) {
      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'sidebar-toggle';
      toggle.setAttribute('aria-label', 'Ouvrir le menu');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.innerHTML = '<span></span><span></span><span></span>';
      const backdrop = document.createElement('button');
      backdrop.type = 'button';
      backdrop.className = 'sidebar-backdrop';
      backdrop.setAttribute('aria-label', 'Fermer le menu');
      document.body.append(toggle, backdrop);

      const close = () => {
        sidebar.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Ouvrir le menu');
      };
      toggle.addEventListener('click', () => {
        const open = sidebar.classList.toggle('is-open');
        toggle.setAttribute('aria-expanded', String(open));
        toggle.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
      });
      backdrop.addEventListener('click', close);
      nav.addEventListener('click', event => {
        if (event.target.closest('a')) close();
      });
      window.addEventListener('resize', () => {
        if (window.innerWidth > 760) close();
      });
    }

    const anchors = Array.from(nav.children).filter(child => child.tagName === 'A');
    const dashboard = anchors.find(a => /dashboard\.html/i.test(a.getAttribute('href') || ''));
    const groups = new Map();
    anchors.forEach(anchor => {
      if (anchor === dashboard) return;
      const group = groupFor(role, anchor.getAttribute('href') || '', anchor.textContent.trim());
      if (!group) return;
      if (!groups.has(group)) groups.set(group, []);
      groups.get(group).push(anchor);
    });

    nav.replaceChildren();
    if (dashboard) nav.appendChild(dashboard);
    groups.forEach((links, label) => {
      const details = document.createElement('details');
      details.className = 'sidebar-group';
      const summary = document.createElement('summary');
      summary.textContent = label;
      const subnav = document.createElement('div');
      subnav.className = 'sidebar-subnav';
      links.forEach(link => subnav.appendChild(link));
      details.append(summary, subnav);
      nav.appendChild(details);
    });

    buildMobileBottomNav(role);
  }

  function buildMobileBottomNav(role) {
    if (document.querySelector('.mobile-bottom-nav')) return;
    const items = role === 'admin'
      ? [
          ['admin-dashboard.html', 'Accueil', '<path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/>'],
          ['admin-parametres.html', 'Profil', '<circle cx="12" cy="8" r="3"/><path d="M5 21a7 7 0 0 1 14 0"/>'],
          ['admin-users.html', 'Utilisateurs', '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>'],
          ['agencies.html', 'Agences', '<path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6M8 10h.01M12 10h.01M16 10h.01"/>'],
          ['notifications.html?role=admin', 'Alertes', '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>']
        ]
      : role === 'agency'
      ? [
          ['agency-dashboard.html', 'Accueil', '<path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/>'],
          ['agency-parametres.html', 'Profil', '<circle cx="12" cy="8" r="3"/><path d="M5 21a7 7 0 0 1 14 0"/>'],
          ['agency-staff.html', 'Équipe', '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>'],
          ['agency-locations.html', 'Lieux', '<path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>'],
          ['notifications.html?role=agency', 'Alertes', '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>']
        ]
      : [
          ['dashboard.html', 'Accueil', '<path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/>'],
          ['profil.html', 'Profil', '<circle cx="12" cy="8" r="3"/><path d="M5 21a7 7 0 0 1 14 0"/>'],
          ['mes-reservations.html', 'Billets', '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9h10M7 13h6"/>'],
          ['tracking.html', 'Localiser', '<path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>'],
          ['notifications.html', 'Alertes', '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>']
        ];
    const nav = document.createElement('nav');
    nav.className = 'mobile-bottom-nav';
    nav.setAttribute('aria-label', 'Navigation mobile');
    const current = window.location.pathname.split('/').pop() || 'dashboard.html';
    items.forEach(([href, label, icon]) => {
      const link = document.createElement('a');
      link.href = href;
      link.className = current === href.split('?')[0] ? 'is-active' : '';
      link.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">${icon}</svg><span>${label}</span>`;
      nav.appendChild(link);
    });
    document.body.appendChild(nav);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();
