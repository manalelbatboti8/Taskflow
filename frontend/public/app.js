// ===========================================================
// app.js — routage simple, modales, démarrage de l'application
// ===========================================================

let currentRoute = 'dashboard';
let currentRouteParam = null;

function openModal(html) {
  const root = document.getElementById('modal-root');
  root.innerHTML = `<div class="modal-overlay" id="modal-overlay"><div class="modal">${html}</div></div>`;
  document.getElementById('modal-overlay').addEventListener('click', (e) => {
    if (e.target.id === 'modal-overlay') closeModal();
  });
}

function closeModal() {
  document.getElementById('modal-root').innerHTML = '';
}

function setActiveNav(route, id) {
  document.querySelectorAll('.nav-item').forEach((el) => {
    const match = el.dataset.route === route && (!id || el.dataset.id === id);
    el.classList.toggle('active', match);
  });
}

async function navigateTo(route, id = null) {
  currentRoute = route;
  currentRouteParam = id;
  const container = document.getElementById('main-content');
  const titleEl = document.getElementById('topbar-title');
  const crumbEl = document.getElementById('topbar-crumb');

  setActiveNav(route, id);

  if (route === 'dashboard') {
    titleEl.textContent = 'Tableau de bord';
    crumbEl.textContent = 'TASKFLOW / DASHBOARD';
    renderDashboardPage(container);
  } else if (route === 'projects') {
    titleEl.textContent = 'Projets';
    crumbEl.textContent = 'TASKFLOW / PROJECTS';
    renderProjectsPage(container);
  } else if (route === 'project') {
    titleEl.textContent = 'Projet';
    crumbEl.textContent = 'TASKFLOW / PROJECTS / DETAIL';
    renderProjectDetailPage(container, id);
  }
}

function setupNavigation() {
  document.addEventListener('click', (e) => {
    const navEl = e.target.closest('[data-route]');
    if (navEl) {
      e.preventDefault();
      navigateTo(navEl.dataset.route, navEl.dataset.id || null);
    }
  });
}

function renderSidebarUser() {
  const user = getStoredUser();
  if (!user) return;
  document.getElementById('sidebar-avatar').textContent = initials(user.fullName);
  document.getElementById('sidebar-name').textContent = user.fullName;
  document.getElementById('sidebar-email').textContent = user.email;
}

async function initApp() {
  renderSidebarUser();
  await loadSidebarProjects();
  startNotificationPolling();
  navigateTo('dashboard');
}

window.initApp = initApp;

// ---------------- Démarrage ----------------
document.addEventListener('DOMContentLoaded', async () => {
  setupAuthForms();
  setupNavigation();
  setupNotificationBell();

  const restored = await restoreSession();
  if (restored) {
    await initApp();
  }
});
