/**
 * Met à jour le badge cloche (client / admin / agency) selon le rôle de la page.
 * Attendu : #notifBadge ou #clientNotifBadge, dropdown #notifList / #clientNotifList
 */
(function () {
  function roleFromBody() {
    const b = document.body;
    if (b.classList.contains('role-admin')) return 'admin';
    if (b.classList.contains('role-agency')) return 'agency';
    return 'client';
  }

  function render() {
    if (typeof camtravelNotify === 'undefined') return;
    const role = roleFromBody();
    const items = camtravelNotify.list({ role });
    const unread = items.filter(n => !n.read).length;

    const badge = document.getElementById('clientNotifBadge') || document.getElementById('notifBadge');
    if (badge) {
      if (unread > 0) {
        badge.style.display = 'flex';
        badge.textContent = unread > 9 ? '9+' : String(unread);
      } else {
        badge.style.display = 'none';
      }
    }

    const list = document.getElementById('clientNotifList') || document.getElementById('notifList');
    if (list) {
      if (items.length === 0) {
        list.innerHTML = `<div style="padding:14px 10px; font-size:13px; color:var(--gray-text);">Aucune notification pour l'instant.</div>`;
      } else {
        list.innerHTML = items.slice(0, 8).map(n => `
          <a href="${n.url || 'notifications.html'}" style="display:block; padding:10px; border-radius:8px; font-size:12.5px; color:var(--ink); text-decoration:none; ${n.read ? '' : 'background:rgba(11,92,61,0.06);'}">
            <strong>${n.title}</strong>
            <div style="color:var(--gray-text); margin-top:2px;">${n.body || ''}</div>
            <div style="font-size:11px; color:var(--gray-text); margin-top:2px;">${new Date(n.createdAt).toLocaleString('fr-FR')}</div>
          </a>
        `).join('');
      }
    }
  }

  function wireToggle() {
    const btn = document.getElementById('clientNotifBtn') || document.getElementById('notifBtn');
    const dropdown = document.getElementById('clientNotifDropdown') || document.getElementById('notifDropdown');
    if (!btn || !dropdown) return;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = dropdown.style.display === 'block';
      dropdown.style.display = open ? 'none' : 'block';
      if (!open && typeof camtravelNotify !== 'undefined') {
        camtravelNotify.markAllRead({ role: roleFromBody() });
        render();
      }
    });
    document.addEventListener('click', (e) => {
      if (!dropdown.contains(e.target) && !btn.contains(e.target)) {
        dropdown.style.display = 'none';
      }
    });
  }

  function boot() {
    render();
    wireToggle();
    document.addEventListener('camtravel:notification', render);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
