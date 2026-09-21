// ===========================================================
// auth.js — inscription, connexion, restauration de session
// ===========================================================

let currentUser = null;

function showAuthScreen() {
  document.getElementById('auth-screen').classList.remove('hidden');
  document.getElementById('app-shell').classList.add('hidden');
}

function showAppShell() {
  document.getElementById('auth-screen').classList.add('hidden');
  document.getElementById('app-shell').classList.remove('hidden');
}

function setupAuthForms() {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');

  document.getElementById('show-register').addEventListener('click', () => {
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
  });
  document.getElementById('show-login').addEventListener('click', () => {
    registerForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
  });

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const errBox = document.getElementById('login-error');
    errBox.innerHTML = '';

    try {
      const { data } = await api.post('/auth/login', { email, password });
      saveSession(data.token, data.user);
      currentUser = data.user;
      showAppShell();
      window.initApp();
    } catch (err) {
      errBox.innerHTML = `<div class="form-error">${escapeHtml(err.response?.data?.error || 'Erreur de connexion')}</div>`;
    }
  });

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fullName = document.getElementById('register-fullname').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;
    const errBox = document.getElementById('register-error');
    errBox.innerHTML = '';

    try {
      const { data } = await api.post('/auth/register', { fullName, email, password });
      saveSession(data.token, data.user);
      currentUser = data.user;
      showAppShell();
      window.initApp();
    } catch (err) {
      errBox.innerHTML = `<div class="form-error">${escapeHtml(err.response?.data?.error || 'Erreur d\'inscription')}</div>`;
    }
  });

  document.getElementById('logout-btn').addEventListener('click', () => {
    clearSession();
    currentUser = null;
    showAuthScreen();
  });
}

// Au rechargement de la page : vérifie le token stocké et restaure la session
async function restoreSession() {
  const token = localStorage.getItem('taskflow_token');
  if (!token) {
    showAuthScreen();
    return false;
  }

  try {
    const { data } = await api.get('/auth/me');
    currentUser = data.user;
    localStorage.setItem('taskflow_user', JSON.stringify(data.user));
    showAppShell();
    return true;
  } catch {
    clearSession();
    showAuthScreen();
    return false;
  }
}

window.showAuthScreen = showAuthScreen;
