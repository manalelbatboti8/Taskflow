// ===========================================================
// projects.js — Fonctionnalités 2 (CRUD projets) et 8 (membres)
// ===========================================================

let projectsPage = 1;
const PROJECTS_PER_PAGE = 9;

async function loadSidebarProjects() {
  try {
    const { data } = await api.get('/projects?page=1&limit=50');
    const list = document.getElementById('sidebar-project-list');
    list.innerHTML = data.data
      .map(
        (p) => `<a href="#" class="nav-item" data-route="project" data-id="${p._id}">
          <span class="dot"></span> ${escapeHtml(p.title)}
        </a>`
      )
      .join('') || `<div style="padding:8px 10px;font-size:12px;color:var(--text-faint)">Aucun projet</div>`;
  } catch (err) {
    // silencieux
  }
}

function statusClass(status) {
  return status === 'actif' ? 'actif' : status === 'en pause' ? 'en-pause' : 'archive';
}

async function renderProjectsPage(container) {
  container.innerHTML = `
    <div class="detail-header">
      <div>
        <div class="section-title" style="margin-bottom:2px">Tous les projets</div>
        <p class="detail-header .desc" style="color:var(--text-dim);font-size:13.5px;margin:0">Créez, organisez et suivez vos projets d'équipe.</p>
      </div>
      <button class="btn btn-primary" id="new-project-btn">+ Nouveau projet</button>
    </div>
    <div id="projects-grid" class="project-grid"></div>
    <div class="pager" id="projects-pager"></div>
  `;

  document.getElementById('new-project-btn').addEventListener('click', openCreateProjectModal);
  await loadProjectsGrid();
}

async function loadProjectsGrid() {
  const grid = document.getElementById('projects-grid');
  grid.innerHTML = `<div class="empty-state"><p>Chargement…</p></div>`;

  try {
    const { data } = await api.get(`/projects?page=${projectsPage}&limit=${PROJECTS_PER_PAGE}`);

    if (!data.data.length) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1">
          <div class="icon">▦</div>
          <p>Vous n'avez encore aucun projet.</p>
          <p>Créez votre premier projet pour commencer.</p>
        </div>`;
      document.getElementById('projects-pager').innerHTML = '';
      return;
    }

    grid.innerHTML = data.data
      .map((p) => {
        const members = [p.owner, ...(p.members || [])].filter(Boolean);
        return `
        <div class="project-card" data-route="project" data-id="${p._id}" style="cursor:pointer">
          <div class="top-row">
            <h3>${escapeHtml(p.title)}</h3>
            <span class="status-pill ${statusClass(p.status)}">${p.status}</span>
          </div>
          <p>${escapeHtml(p.description || 'Aucune description')}</p>
          <div class="meta-row">
            <div class="member-stack">
              ${members
                .slice(0, 4)
                .map((m) => `<div class="avatar" title="${escapeHtml(m.fullName)}">${initials(m.fullName)}</div>`)
                .join('')}
            </div>
            <span>${p.deadline ? new Date(p.deadline).toLocaleDateString('fr-FR') : 'Sans échéance'}</span>
          </div>
        </div>`;
      })
      .join('');

    grid.querySelectorAll('[data-route="project"]').forEach((el) => {
      el.addEventListener('click', () => navigateTo('project', el.dataset.id));
    });

    renderPager('projects-pager', data.page, data.totalPages, (p) => {
      projectsPage = p;
      loadProjectsGrid();
    });
  } catch (err) {
    grid.innerHTML = `<div class="empty-state"><p>Impossible de charger les projets.</p></div>`;
  }
}

function renderPager(elId, page, totalPages, onChange) {
  const el = document.getElementById(elId);
  if (totalPages <= 1) {
    el.innerHTML = '';
    return;
  }
  el.innerHTML = `
    <button ${page <= 1 ? 'disabled' : ''} id="pager-prev">‹</button>
    <span>PAGE ${page} / ${totalPages}</span>
    <button ${page >= totalPages ? 'disabled' : ''} id="pager-next">›</button>
  `;
  const prev = document.getElementById('pager-prev');
  const next = document.getElementById('pager-next');
  if (prev) prev.addEventListener('click', () => onChange(page - 1));
  if (next) next.addEventListener('click', () => onChange(page + 1));
}

function openCreateProjectModal() {
  openModal(`
    <h3>Nouveau projet</h3>
    <p class="modal-sub">Donnez un nom clair à votre projet d'équipe.</p>
    <form id="create-project-form">
      <div class="field">
        <label>Titre</label>
        <input type="text" name="title" required>
      </div>
      <div class="field">
        <label>Description</label>
        <textarea class="field-textarea" name="description"></textarea>
      </div>
      <div class="field-row">
        <div class="field">
          <label>Date limite</label>
          <input type="date" name="deadline">
        </div>
        <div class="field">
          <label>Statut</label>
          <select class="field-select" name="status">
            <option value="actif">Actif</option>
            <option value="en pause">En pause</option>
            <option value="archivé">Archivé</option>
          </select>
        </div>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-ghost" id="cancel-create-project">Annuler</button>
        <button type="submit" class="btn btn-primary">Créer le projet</button>
      </div>
    </form>
  `);

  document.getElementById('cancel-create-project').addEventListener('click', closeModal);
  document.getElementById('create-project-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      await api.post('/projects', {
        title: fd.get('title'),
        description: fd.get('description'),
        deadline: fd.get('deadline') || null,
        status: fd.get('status'),
      });
      closeModal();
      showToast('Projet créé avec succès', 'success');
      loadSidebarProjects();
      loadProjectsGrid();
    } catch (err) {
      showToast(err.response?.data?.error || 'Erreur lors de la création', 'error');
    }
  });
}

// ---------------- Détail d'un projet ----------------

let currentProjectId = null;
let currentProjectData = null;
let currentProjectTab = 'tasks';

async function renderProjectDetailPage(container, projectId) {
  currentProjectId = projectId;
  currentProjectTab = 'tasks';
  container.innerHTML = `<div class="empty-state"><p>Chargement du projet…</p></div>`;

  try {
    const { data } = await api.get(`/projects/${projectId}`);
    currentProjectData = data.data;
    renderProjectShell(container);
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><p>Projet introuvable ou accès refusé.</p></div>`;
  }
}

function renderProjectShell(container) {
  const p = currentProjectData;
  const isOwner = p.owner._id
    ? p.owner._id === getStoredUser().id
    : p.owner === getStoredUser().id;

  container.innerHTML = `
    <div class="detail-header">
      <div>
        <div class="section-title" style="margin-bottom:4px">
          ${escapeHtml(p.title)}
          <span class="status-pill ${statusClass(p.status)}">${p.status}</span>
        </div>
        <p class="desc">${escapeHtml(p.description || 'Aucune description')}</p>
      </div>
      <div style="display:flex;gap:8px">
        ${isOwner ? `<button class="btn btn-ghost btn-sm" id="edit-project-btn">Modifier</button>
        <button class="btn btn-danger btn-sm" id="delete-project-btn">Supprimer</button>` : ''}
      </div>
    </div>

    <div class="tabs">
      <button class="tab-btn active" data-tab="tasks">Tâches</button>
      <button class="tab-btn" data-tab="members">Membres</button>
      <button class="tab-btn" data-tab="activity">Activité</button>
    </div>

    <div id="project-tab-content"></div>
  `;

  container.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      currentProjectTab = btn.dataset.tab;
      renderProjectTabContent();
    });
  });

  if (isOwner) {
    document.getElementById('edit-project-btn').addEventListener('click', openEditProjectModal);
    document.getElementById('delete-project-btn').addEventListener('click', confirmDeleteProject);
  }

  renderProjectTabContent();
}

function renderProjectTabContent() {
  if (currentProjectTab === 'tasks') renderTasksTab();
  else if (currentProjectTab === 'members') renderMembersTab();
  else if (currentProjectTab === 'activity') renderActivityTab();
}

async function renderActivityTab() {
  const el = document.getElementById('project-tab-content');
  el.innerHTML = `<div class="empty-state"><p>Chargement…</p></div>`;
  try {
    const { data } = await api.get(`/projects/${currentProjectId}/activities`);
    if (!data.data.length) {
      el.innerHTML = `<div class="empty-state"><div class="icon">◈</div><p>Aucune activité pour le moment.</p></div>`;
      return;
    }
    el.innerHTML = `<div class="card activity-list" style="padding:6px 16px">` +
      data.data
        .map(
          (a) => `
        <div class="activity-item">
          <span class="a-dot"></span>
          <div>
            <div>${escapeHtml(a.message)}</div>
            <div class="a-time">${timeAgo(a.createdAt)}</div>
          </div>
        </div>`
        )
        .join('') + `</div>`;
  } catch (err) {
    el.innerHTML = `<div class="empty-state"><p>Impossible de charger l'activité.</p></div>`;
  }
}

function renderMembersTab() {
  const p = currentProjectData;
  const isOwner = (p.owner._id || p.owner) === getStoredUser().id;
  const el = document.getElementById('project-tab-content');

  const allMembers = [{ ...p.owner, role: 'Créateur' }, ...(p.members || []).map((m) => ({ ...m, role: 'Membre' }))];

  el.innerHTML = `
    ${isOwner ? `
    <div class="card" style="padding:16px;margin-bottom:16px">
      <form id="invite-form" style="display:flex;gap:10px">
        <input type="email" id="invite-email" placeholder="email@exemple.com" required style="flex:1;background:var(--bg);border:1px solid var(--border);color:var(--text);padding:9px 12px;border-radius:6px;font-size:13.5px">
        <button class="btn btn-primary btn-sm" type="submit">Inviter</button>
      </form>
    </div>` : ''}
    <div class="card" style="padding:6px 16px">
      ${allMembers
        .map(
          (m) => `
        <div class="member-row">
          <div class="who">
            <div class="avatar">${initials(m.fullName)}</div>
            <div>
              <div class="n">${escapeHtml(m.fullName)} <span class="mono" style="font-size:10px;color:var(--text-faint)">${m.role}</span></div>
              <div class="e">${escapeHtml(m.email)}</div>
            </div>
          </div>
          ${isOwner && m.role === 'Membre' ? `<button class="btn btn-ghost btn-sm remove-member-btn" data-id="${m._id}">Retirer</button>` : ''}
        </div>`
        )
        .join('')}
    </div>
  `;

  if (isOwner) {
    document.getElementById('invite-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('invite-email').value.trim();
      try {
        const { data } = await api.post(`/projects/${currentProjectId}/members`, { email });
        showToast('Membre ajouté avec succès', 'success');
        const { data: refreshed } = await api.get(`/projects/${currentProjectId}`);
        currentProjectData = refreshed.data;
        renderMembersTab();
      } catch (err) {
        showToast(err.response?.data?.error || "Impossible d'inviter ce membre", 'error');
      }
    });

    el.querySelectorAll('.remove-member-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        try {
          await api.delete(`/projects/${currentProjectId}/members/${btn.dataset.id}`);
          const { data: refreshed } = await api.get(`/projects/${currentProjectId}`);
          currentProjectData = refreshed.data;
          renderMembersTab();
          showToast('Membre retiré', 'success');
        } catch (err) {
          showToast('Impossible de retirer ce membre', 'error');
        }
      });
    });
  }
}

function openEditProjectModal() {
  const p = currentProjectData;
  openModal(`
    <h3>Modifier le projet</h3>
    <form id="edit-project-form">
      <div class="field">
        <label>Titre</label>
        <input type="text" name="title" value="${escapeHtml(p.title)}" required>
      </div>
      <div class="field">
        <label>Description</label>
        <textarea class="field-textarea" name="description">${escapeHtml(p.description || '')}</textarea>
      </div>
      <div class="field-row">
        <div class="field">
          <label>Date limite</label>
          <input type="date" name="deadline" value="${p.deadline ? p.deadline.substring(0, 10) : ''}">
        </div>
        <div class="field">
          <label>Statut</label>
          <select class="field-select" name="status">
            <option value="actif" ${p.status === 'actif' ? 'selected' : ''}>Actif</option>
            <option value="en pause" ${p.status === 'en pause' ? 'selected' : ''}>En pause</option>
            <option value="archivé" ${p.status === 'archivé' ? 'selected' : ''}>Archivé</option>
          </select>
        </div>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-ghost" id="cancel-edit-project">Annuler</button>
        <button type="submit" class="btn btn-primary">Enregistrer</button>
      </div>
    </form>
  `);

  document.getElementById('cancel-edit-project').addEventListener('click', closeModal);
  document.getElementById('edit-project-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      const { data } = await api.put(`/projects/${currentProjectId}`, {
        title: fd.get('title'),
        description: fd.get('description'),
        deadline: fd.get('deadline') || null,
        status: fd.get('status'),
      });
      currentProjectData = { ...currentProjectData, ...data.data };
      closeModal();
      showToast('Projet mis à jour', 'success');
      renderProjectShell(document.getElementById('main-content'));
      loadSidebarProjects();
    } catch (err) {
      showToast(err.response?.data?.error || 'Erreur lors de la modification', 'error');
    }
  });
}

function confirmDeleteProject() {
  openModal(`
    <h3>Supprimer ce projet ?</h3>
    <p class="modal-sub">Cette action supprimera aussi toutes les tâches associées. Elle est irréversible.</p>
    <div class="modal-actions">
      <button class="btn btn-ghost" id="cancel-delete-project">Annuler</button>
      <button class="btn btn-danger" id="confirm-delete-project">Supprimer</button>
    </div>
  `);
  document.getElementById('cancel-delete-project').addEventListener('click', closeModal);
  document.getElementById('confirm-delete-project').addEventListener('click', async () => {
    try {
      await api.delete(`/projects/${currentProjectId}`);
      closeModal();
      showToast('Projet supprimé', 'success');
      loadSidebarProjects();
      navigateTo('projects');
    } catch (err) {
      showToast('Impossible de supprimer ce projet', 'error');
    }
  });
}
