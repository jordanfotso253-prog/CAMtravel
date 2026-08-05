async function initAdminDashboard() {
  const [realUsers, realReservations, realColis, realPassengers, agencies] = await Promise.all([
    typeof camtravelGetUsers === 'function' ? camtravelGetUsers() : [],
    typeof camtravelGetReservations === 'function' ? camtravelGetReservations() : [],
    typeof camtravelGetColis === 'function' ? camtravelGetColis() : [],
    typeof camtravelGetPassengers === 'function' ? camtravelGetPassengers() : [],
    typeof camtravelGetAgencies === 'function' ? camtravelGetAgencies() : [],
  ]);

  const revenue = realReservations.reduce((s, r) => s + Number(r.total || 0), 0);
  const elUsers = document.getElementById('statUsers');
  const elRes = document.getElementById('statReservations');
  const elRev = document.getElementById('statRevenue');
  const elAg = document.getElementById('statAgencies');
  if (elUsers) elUsers.textContent = realUsers.length.toLocaleString('fr-FR');
  if (elRes) elRes.textContent = realReservations.length.toLocaleString('fr-FR');
  if (elRev) elRev.textContent = revenue.toLocaleString('fr-FR') + ' FCFA';
  if (elAg) elAg.textContent = (agencies.length || 0).toLocaleString('fr-FR');

  const recentContainer = document.getElementById('recentReservations');
  if (recentContainer) {
    if (realReservations.length === 0) {
      recentContainer.innerHTML = `<div class="empty-state">Aucune réservation pour l'instant.</div>`;
    } else {
      recentContainer.innerHTML = realReservations.slice(0, 8).map(r => {
        const dateStr = r.createdAt ? new Date(r.createdAt).toLocaleDateString('fr-FR') : (r.date || '');
        return `
        <div class="admin-trip-row">
          <div>
            <div class="trip-ref">${r.ref || '—'}</div>
            <div class="trip-route">${r.from || ''} → ${r.to || ''}</div>
            <div class="trip-meta">${r.passagerNom || ''} · ${Number(r.total || 0).toLocaleString('fr-FR')} FCFA</div>
          </div>
          <div class="trip-meta">${dateStr}</div>
        </div>`;
      }).join('');
    }
  }

  // ---- Notifications ----
  const notifBtn = document.getElementById('notifBtn');
  const notifBadge = document.getElementById('notifBadge');
  const notifDropdown = document.getElementById('notifDropdown');
  const notifList = document.getElementById('notifList');

  const events = [
    ...realUsers.map(u => ({ type: 'user', date: u.createdAt, text: `Nouvelle inscription : ${u.nom}` })),
    ...realReservations.map(r => ({ type: 'reservation', date: r.createdAt, text: `Nouvelle réservation ${r.ref} : ${r.from} → ${r.to}` })),
    ...realColis.map(c => ({ type: 'colis', date: c.createdAt, text: `Nouveau colis ${c.ref} : ${c.depart} → ${c.arrivee}` })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  const unseenCount = typeof camtravelGetUnseenCount === 'function' ? await camtravelGetUnseenCount() : 0;

  if (unseenCount > 0 && notifBadge) {
    notifBadge.style.display = 'flex';
    notifBadge.textContent = unseenCount > 9 ? '9+' : unseenCount;
  }

  if (notifList) {
    if (events.length === 0) {
      notifList.innerHTML = `<div style="padding:14px 10px; font-size:13px; color:var(--gray-text);">Aucune notification pour l'instant.</div>`;
    } else {
      notifList.innerHTML = events.slice(0, 10).map(ev => `
        <div style="padding:10px; border-radius:8px; font-size:12.5px; color:var(--ink);">
          ${ev.text}
          <div style="font-size:11px; color:var(--gray-text); margin-top:2px;">${new Date(ev.date).toLocaleString('fr-FR')}</div>
        </div>
      `).join('');
    }
  }

  if (notifBtn && notifDropdown) {
    notifBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = notifDropdown.style.display === 'block';
      notifDropdown.style.display = isOpen ? 'none' : 'block';
      if (!isOpen) {
        if (typeof camtravelMarkAllSeen === 'function') camtravelMarkAllSeen();
        notifBadge.style.display = 'none';
      }
    });
    document.addEventListener('click', (e) => {
      if (!notifDropdown.contains(e.target) && !notifBtn.contains(e.target)) {
        notifDropdown.style.display = 'none';
      }
    });
  }
  // ---- Pièces d'identité des passagers ----
  const idListContainer = document.getElementById('passengerIdList');
  if (idListContainer) {
    if (realPassengers.length === 0) {
      idListContainer.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">Aucune pièce d'identité reçue pour l'instant.</div>`;
    } else {
      idListContainer.innerHTML = realPassengers.slice(0, 12).map(p => `
        <div style="border:1px solid var(--border); border-radius:10px; overflow:hidden; background:#fff;">
          ${p.photoData
            ? `<img src="${p.photoData}" style="width:100%; height:100px; object-fit:cover; display:block;">`
            : `<div style="width:100%; height:100px; display:flex; align-items:center; justify-content:center; background:#f4f6f5; color:var(--gray-text); font-size:11px;">Pas de photo</div>`
          }
          <div style="padding:10px;">
            <div style="font-size:12.5px; font-weight:700; color:var(--ink);">${p.nom || 'Sans nom'}</div>
            <div style="font-size:11px; color:var(--gray-text); margin-top:2px;">${p.piece || 'Pièce non précisée'}</div>
            <div style="font-size:11px; color:var(--gray-text);">N° ${p.pieceNum || '—'}</div>
            <div style="font-size:10.5px; color:var(--green-deep); margin-top:4px; font-weight:600;">${p.trajet || ''}</div>
          </div>
        </div>
      `).join('');
    }
  }

  // ---- Demandes de remboursement ----
  const refundContainer = document.getElementById('refundRequestsList');
  if (refundContainer) {
    const pending = realReservations.filter(r => r.refundStatus === 'requested');
    if (pending.length === 0) {
      refundContainer.innerHTML = `<div class="empty-state">Aucune demande en attente.</div>`;
    } else {
      refundContainer.innerHTML = pending.map(r => `
        <div class="admin-trip-row" data-refund-row="${r.id}">
          <div>
            <div class="trip-ref">${r.ref}</div>
            <div class="trip-route">${r.from} → ${r.to}</div>
            <div class="trip-meta">${r.passagerNom || ''} · ${Number(r.total || 0).toLocaleString('fr-FR')} FCFA${r.refundReason ? ' · « ' + r.refundReason + ' »' : ''}</div>
          </div>
          <div style="display:flex; gap:8px;">
            <button type="button" class="btn-secondary" data-refund-action="approved" data-id="${r.id}" style="width:auto; padding:8px 14px;">Approuver</button>
            <button type="button" class="btn-secondary" data-refund-action="rejected" data-id="${r.id}" style="width:auto; padding:8px 14px;">Refuser</button>
          </div>
        </div>
      `).join('');

      refundContainer.querySelectorAll('[data-refund-action]').forEach(btn => {
        btn.addEventListener('click', async () => {
          btn.closest('[data-refund-row]').style.opacity = '0.5';
          const ok = typeof camtravelSetRefundStatus === 'function'
            ? await camtravelSetRefundStatus(btn.dataset.id, btn.dataset.refundAction)
            : false;
          if (ok) {
            const row = btn.closest('[data-refund-row]');
            const refEl = row && row.querySelector('.trip-ref');
            const ref = refEl ? refEl.textContent.trim().split(/\s+/)[0] : 'REF';
            if (typeof camtravelNotify !== 'undefined') {
              try { await camtravelNotify.refundUpdate(ref, btn.dataset.refundAction); } catch (e) {}
            }
            if (typeof camtravelEmail !== 'undefined') {
              try { await camtravelEmail.sendRefund(btn.dataset.refundAction, { ref }); } catch (e) {}
            }
            row.remove();
          } else {
            btn.closest('[data-refund-row]').style.opacity = '1';
          }
        });
      });
    }
  }

  // Stats mensuelles réelles
  const chartEl = document.getElementById('monthlyChartAdmin');
  if (chartEl && typeof camtravelMonthlyStats !== 'undefined') {
    const byCount = camtravelMonthlyStats.aggregateByMonth(realReservations, 6);
    const byRevenue = camtravelMonthlyStats.aggregateByMonth(realReservations, 6, r => Number(r.total || 0));
    const revK = byRevenue.map(s => ({ ...s, value: Math.round(s.value / 1000) }));
    camtravelMonthlyStats.renderDualChart(chartEl, byCount, revK, {
      labelA: 'Réservations',
      labelB: 'Revenus (k FCFA)',
      colorA: '#1e3a5f',
      colorB: '#f5921b',
      height: 170
    });
  }

  if (typeof camtravelStaff !== 'undefined') {
    const st = document.getElementById('statStaff');
    if (st) st.textContent = camtravelStaff.list().length;
  }

  const busSt = document.getElementById('busApiStatus');
  if (busSt && typeof camtravelBusApi !== 'undefined') {
    const s = camtravelBusApi.status();
    busSt.innerHTML = 'API Bus : catalogue local ✓'
      + (s.supabase ? ' · Supabase ✓' : ' · Supabase —')
      + (s.externalConfigured ? ' · API externe activée (' + s.baseUrl + ')' : ' · API externe non configurée (js/bus-api-config.js)');
  }
}

initAdminDashboard();

