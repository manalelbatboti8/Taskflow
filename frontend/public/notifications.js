// ===========================================================
// notifications.js — Fonctionnalité 10
// Récupération via Axios, badge temps réel, polling (setInterval),
// archivage des notifications lues dans le LocalStorage.
// ===========================================================

let notificationsCache = [];
let pollingHandle = null;

const READ_ARCHIVE_KEY = 'taskflow_read_notifications_archive';

function getReadArchive() {
  try {
    return JSON.parse(localStorage.getItem(READ_ARCHIVE_KEY)) || [];
  } catch {
    return [];
  }
}

function archiveReadNotification(notification) {
  const archive = getReadArchive();
  if (!archive.find((n) => n._id === notification._id)) {
    archive.unshift(notification);
    localStorage.setItem(READ_ARCHIVE_KEY, JSON.stringify(archive.slice(0, 200)));
  }
}

async function fetchNotifications() {
  try {
    const { data } = await api.get('/notifications');
    notificationsCache = data.data;
    updateBellBadge(data.unreadCount);
    if (!document.getElementById('notif-panel').classList.contains('hidden')) {
      renderNotifPanel();
    }
  } catch (err) {
    // silencieux : le polling ne doit pas spammer l'utilisateur d'erreurs
    console.error('Erreur notifications:', err.message);
  }
}

function updateBellBadge(count) {
  const badge = document.getElementById('bell-badge');
  if (count > 0) {
    badge.textContent = count > 99 ? '99+' : count;
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }
}

function renderNotifPanel() {
  const panel = document.getElementById('notif-panel');

  if (!notificationsCache.length) {
    panel.innerHTML = `
      <div class="head"><span>Notifications</span></div>
      <div class="notif-empty">Aucune notification pour le moment.</div>`;
    return;
  }

  panel.innerHTML = `
    <div class="head"><span>Notifications</span></div>
    ${notificationsCache
      .map(
        (n) => `
      <div class="notif-item ${n.read ? 'read' : ''}" data-id="${n._id}">
        <span class="unread-dot"></span>
        <div class="txt">
          <div>${escapeHtml(n.message)}</div>
          <div class="time">${timeAgo(n.createdAt)}</div>
        </div>
      </div>`
      )
      .join('')}
  `;

  panel.querySelectorAll('.notif-item').forEach((el) => {
    el.addEventListener('click', () => markNotificationRead(el.dataset.id));
  });
}

async function markNotificationRead(id) {
  const notification = notificationsCache.find((n) => n._id === id);
  if (!notification || notification.read) return;

  try {
    await api.patch(`/notifications/${id}/read`);
    notification.read = true;
    archiveReadNotification(notification);
    const unread = notificationsCache.filter((n) => !n.read).length;
    updateBellBadge(unread);
    renderNotifPanel();
  } catch (err) {
    showToast('Impossible de marquer la notification comme lue', 'error');
  }
}

function setupNotificationBell() {
  const bellBtn = document.getElementById('bell-btn');
  const panel = document.getElementById('notif-panel');

  bellBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    panel.classList.toggle('hidden');
    if (!panel.classList.contains('hidden')) renderNotifPanel();
  });

  document.addEventListener('click', (e) => {
    if (!panel.contains(e.target) && e.target !== bellBtn) {
      panel.classList.add('hidden');
    }
  });
}

// Mécanisme de polling : interroge /api/notifications toutes les 30 secondes
function startNotificationPolling() {
  fetchNotifications();
  if (pollingHandle) clearInterval(pollingHandle);
  pollingHandle = setInterval(fetchNotifications, 30000);
}

function stopNotificationPolling() {
  if (pollingHandle) clearInterval(pollingHandle);
  pollingHandle = null;
}
