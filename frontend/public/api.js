// ===========================================================
// api.js — instance Axios centrale + gestion du token JWT
// ===========================================================

// Le backend est exposé sur le port 5000 de l'hôte (voir docker-compose.yml),
// que l'app tourne en local (npm run dev) ou via Docker.
const API_BASE_URL = `http://${window.location.hostname}:5000/api`;

const api = axios.create({ baseURL: API_BASE_URL });

// Le token JWT est stocké dans le LocalStorage et joint automatiquement
// à chaque requête Axios via cet intercepteur.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('taskflow_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token invalide/expiré : on nettoie la session et on revient au login
      localStorage.removeItem('taskflow_token');
      localStorage.removeItem('taskflow_user');
      if (window.showAuthScreen) window.showAuthScreen();
    }
    return Promise.reject(error);
  }
);

function saveSession(token, user) {
  localStorage.setItem('taskflow_token', token);
  localStorage.setItem('taskflow_user', JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem('taskflow_token');
  localStorage.removeItem('taskflow_user');
}

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('taskflow_user'));
  } catch {
    return null;
  }
}

function showToast(message, type = 'default') {
  const stack = document.getElementById('toast-stack');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = message;
  stack.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "à l'instant";
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
  return `il y a ${Math.floor(diff / 86400)} j`;
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function initials(name) {
  if (!name) return '?';
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
}
