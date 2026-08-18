/** Agrège les réservations par jour sur les N derniers jours */
function aggregateByDay(items, nDays) {
  const days = [];
  const map = {};
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  for (let i = nDays - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    days.push({ key, label: d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }), value: 0 });
    map[key] = days[days.length - 1];
  }
  (items || []).forEach(it => {
    const raw = it.createdAt || it.date || it.at;
    if (!raw) return;
    const d = new Date(raw);
    if (isNaN(d)) return;
    const key = d.toISOString().slice(0, 10);
    if (map[key]) map[key].value += 1;
  });
  return days;
}

function renderDailyChart(container, series) {
  if (!container) return;
  const max = Math.max(1, ...series.map(s => s.value));
  const height = 160;
  const bars = series.map(s => {
    const h = Math.round((s.value / max) * (height - 28));
    return `
      <div class="mstat-bar-col" title="${s.label}: ${s.value} réservation${s.value > 1 ? 's' : ''}" style="flex:1;min-width:0;">
        <div class="mstat-val" style="font-size:9px;">${s.value > 0 ? s.value : ''}</div>
        <div class="mstat-bar" style="height:${h}px;background:#0b5c3d;width:100%;max-width:14px;margin:0 auto;border-radius:4px 4px 0 0;"></div>
      </div>`;
  }).join('');
  container.innerHTML = `<div class="mstat-chart" style="min-height:${height}px;display:flex;align-items:flex-end;gap:2px;padding:0 4px;">${bars}</div>`;
  const legend = document.getElementById('dailyChartLegend');
  if (legend) {
    const step = Math.max(1, Math.floor(series.length / 6));
    legend.innerHTML = series.filter((_, i) => i % step === 0 || i === series.length - 1)
      .map(s => `<span>${s.label}</span>`).join('');
  }
}

const resetAdminStatsBtn = document.getElementById('resetAdminStatsBtn');
if (resetAdminStatsBtn) {
  resetAdminStatsBtn.addEventListener('click', () => {
    const confirmed = window.confirm('Voulez-vous vraiment réinitialiser toutes les statistiques locales de la plateforme ?');
    if (!confirmed) return;

    resetAdminStatsBtn.disabled = true;
    resetAdminStatsBtn.textContent = 'Réinitialisation...';

    const ok = typeof camtravelResetLocalStats === 'function' ? camtravelResetLocalStats('admin') : false;
    if (ok) {
      window.location.reload();
    } else {
      resetAdminStatsBtn.disabled = false;
      resetAdminStatsBtn.textContent = 'Réinitialiser';
      alert('La réinitialisation a échoué.');
    }
  });
}

async function initAdminDashboard() {
  const [realUsers, realReservations, realColis, realPassengers, agencies] = await Promise.all([
    typeof camtravelGetUsers === 'function' ? camtravelGetUsers() : [],
    typeof camtravelGetReservations === 'function' ? camtravelGetReservations() : [],
    typeof camtravelGetColis === 'function' ? camtravelGetColis() : [],
    typeof camtravelGetPassengers === 'function' ? camtravelGetPassengers() : [],
    typeof camtravelGetAgencies === 'function' ? camtravelGetAgencies() : [],
  ]);

  const revenue = realReservations.reduce((s, r) => s + Number(r.total || 0), 0);
  const avgOrder = realReservations.length ? Math.round(revenue / realReservations.length) : 0;
  const refundRate = realReservations.length ? Math.round((realReservations.filter(r => r.refundStatus === 'requested').length / realReservations.length) * 100) : 0;
  const activeTrips = (typeof camtravelGetTrips === 'function' ? await camtravelGetTrips() : []).filter(t => t.active !== false).length;
  const performance = realReservations.length ? Math.min(100, Math.round((realReservations.filter(r => (r.total || 0) > 0).length / realReservations.length) * 100)) : 0;
  const elUsers = document.getElementById('statUsers');
  const elRes = document.getElementById('statReservations');
  const elRev = document.getElementById('statRevenue');
  const elAg = document.getElementById('statAgencies');
  const elAvg = document.getElementById('adminAvgOrder');
  const elRefund = document.getElementById('adminRefundRate');
  const elActive = document.getElementById('adminActiveTrips');
  const elPerf = document.getElementById('adminPerformance');
  if (elUsers) elUsers.textContent = realUsers.length.toLocaleString('fr-FR');
  if (elRes) elRes.textContent = realReservations.length.toLocaleString('fr-FR');
  if (elRev) elRev.textContent = revenue.toLocaleString('fr-FR') + ' FCFA';
  if (elAg) elAg.textContent = (agencies.length || 0).toLocaleString('fr-FR');
  if (elAvg) elAvg.textContent = `${avgOrder.toLocaleString('fr-FR')} FCFA`;
  if (elRefund) elRefund.textContent = `${refundRate}%`;
  if (elActive) elActive.textContent = activeTrips.toLocaleString('fr-FR');
  if (elPerf) elPerf.textContent = `${performance}%`;

  // Cartes stats cliquables
  document.querySelectorAll('.stat-card [data-link], .stat-card .value[data-link]').forEach(el => {
    const link = el.getAttribute('data-link');
    if (!link) return;
    const card = el.closest('.stat-card');
    if (card) {
      card.style.cursor = 'pointer';
      card.addEventListener('click', () => { window.location.href = link; });
    }
  });
  // Fallback : data-link sur les .value
  ['statUsers', 'statReservations', 'statAgencies', 'statRevenue'].forEach(id => {
    const el = document.getElementById(id);
    if (!el || !el.dataset.link) return;
    const card = el.closest('.stat-card');
    if (card && !card._linked) {
      card._linked = true;
      card.style.cursor = 'pointer';
      card.addEventListener('click', () => { window.location.href = el.dataset.link; });
    }
  });

  // Réservations récentes
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

  // ---- Notifications (bouton cloche) ----
  const notifBtn = document.getElementById('notifBtn');
  const notifBadge = document.getElementById('notifBadge');
  const notifDropdown = document.getElementById('notifDropdown');
  const notifList = document.getElementById('notifList');

  const events = [
    ...realUsers.map(u => ({ type: 'user', date: u.createdAt, text: `Nouvelle inscription : ${u.nom || u.email || '—'}` })),
    ...realReservations.map(r => ({ type: 'reservation', date: r.createdAt, text: `Nouvelle réservation ${r.ref || ''} : ${r.from || ''} → ${r.to || ''}` })),
    ...realColis.map(c => ({ type: 'colis', date: c.createdAt, text: `Nouveau colis ${c.ref || ''} : ${c.depart || ''} → ${c.arrivee || ''}` })),
  ].filter(ev => ev.date).sort((a, b) => new Date(b.date) - new Date(a.date));

  const unseenCount = typeof camtravelGetUnseenCount === 'function' ? await camtravelGetUnseenCount() : events.length;

  if (unseenCount > 0 && notifBadge) {
    notifBadge.style.display = 'flex';
    notifBadge.textContent = unseenCount > 9 ? '9+' : String(unseenCount);
  }

  if (notifList) {
    if (events.length === 0) {
      notifList.innerHTML = `<div style="padding:14px 10px; font-size:13px; color:var(--gray-text);">Aucune notification pour l'instant.</div>`;
    } else {
      notifList.innerHTML = events.slice(0, 12).map(ev => `
        <div style="padding:10px; border-radius:8px; font-size:12.5px; color:var(--ink); border-bottom:1px solid var(--border);">
          ${ev.text}
          <div style="font-size:11px; color:var(--gray-text); margin-top:2px;">${new Date(ev.date).toLocaleString('fr-FR')}</div>
        </div>
      `).join('');
    }
  }

  if (notifBtn && notifDropdown) {
    notifBtn.style.cursor = 'pointer';
    notifBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = notifDropdown.style.display === 'block';
      notifDropdown.style.display = isOpen ? 'none' : 'block';
      if (!isOpen) {
        if (typeof camtravelMarkAllSeen === 'function') camtravelMarkAllSeen();
        if (notifBadge) notifBadge.style.display = 'none';
      }
    });
    document.addEventListener('click', (e) => {
      if (!notifDropdown.contains(e.target) && !notifBtn.contains(e.target)) {
        notifDropdown.style.display = 'none';
      }
    });
  }

  // ---- Pièces d'identité ----
  const idListContainer = document.getElementById('passengerIdList');
  if (idListContainer) {
    if (realPassengers.length === 0) {
      idListContainer.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">Aucune pièce d'identité reçue pour l'instant.</div>`;
    } else {
      idListContainer.innerHTML = realPassengers.slice(0, 24).map(p => `
        <div style="border:1px solid var(--border); border-radius:10px; overflow:hidden; background:#fff;">
          ${p.photoData
            ? `<img src="${p.photoData}" alt="Pièce" style="width:100%;height:110px;object-fit:cover;display:block;">`
            : `<div style="height:110px;background:#f3f4f6;display:flex;align-items:center;justify-content:center;color:#9ca3af;font-size:12px;">Pas de photo</div>`}
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
            if (!refundContainer.querySelector('[data-refund-row]')) {
              refundContainer.innerHTML = `<div class="empty-state">Aucune demande en attente.</div>`;
            }
          } else {
            btn.closest('[data-refund-row]').style.opacity = '1';
          }
        });
      });
    }
  }

  // Stats mensuelles (6 mois)
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

  // Graphique 30 derniers jours (données réelles)
  const dailyEl = document.getElementById('dailyChartAdmin');
  if (dailyEl) {
    const daily = aggregateByDay(realReservations, 30);
    renderDailyChart(dailyEl, daily);
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
