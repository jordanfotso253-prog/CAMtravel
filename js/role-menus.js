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
      if (value.includes('vehicle') || value.includes('bus')) return 'Mes bus';
      if (value.includes('#trips') || value.includes('trajet')) return 'Trajets';
      if (value.includes('#bookings') || value.includes('reservation') || value.includes('rental')) return 'Réservations';
      if (value.includes('staff') || value.includes('equipe')) return 'Personnel';
      if (value.includes('param') || value.includes('location')) return 'Profil agence';
      return null;
    }
    if (value.includes('reservation')) return 'Mes réservations';
    if (value.includes('paiement') || value.includes('refund')) return 'Paiements';
    if (value.includes('notification')) return 'Notifications';
    if (value.includes('profil') || value.includes('param')) return 'Mon profil';
    if (value.includes('tracking') || value.includes('suivi')) return 'Historique';
    if (value.includes('location') || value.includes('colis') || value.includes('recherche')) return 'Voyages';
    return null;
  }

  function build() {
    const role = document.body.classList.contains('role-admin') ? 'admin'
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
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();
