// ===========================================================
// tasks.js — Fonctionnalités 3, 4, 6, 7
// Kanban de tâches, assignation, filtres/recherche/pagination,
// et brouillon auto-sauvegardé dans le formulaire de tâche.
// ===========================================================

let taskFilters = { status: '', priority: '', assignedTo: '', search: '', page: 1 };
const TASKS_PER_PAGE = 30;

function renderTasksTab() {
  const el = document.getElementById('project-tab-content');
  const members = [currentProjectData.owner, ...(currentProjectData.members || [])];

  el.innerHTML = `
    <div class="filter-bar">
      <input type="text" id="task-search" placeholder="Rechercher une tâche…">
      <select id="filter-status">
        <option value="">Tous les statuts</option>
        <option value="à faire">À faire</option>
        <option value="en cours">En cours</option>
        <option value="terminé">Terminé</option>
      </select>
      <select id="filter-priority">
        <option value="">Toutes les priorités</option>
        <option value="haute">Haute</option>
        <option value="moyenne">Moyenne</option>
        <option value="basse">Basse</option>
      </select>
      <select id="filter-assigned">
        <option value="">Tous les membres</option>
        ${members.map((m) => `<option value="${m._id}">${escapeHtml(m.fullName)}</option>`).join('')}
      </select>
      <button class="btn btn-primary btn-sm" id="new-task-btn">+ Nouvelle tâche</button>
    </div>
    <div class="kanban" id="kanban-board"></div>
    <div class="pager" id="tasks-pager"></div>
  `;

  document.getElementById('task-search').addEventListener('input', debounce(() => {
    taskFilters.search = document.getElementById('task-search').value;
    taskFilters.page = 1;
    loadTasks();
  }, 350));
  document.getElementById('filter-status').addEventListener('change', (e) => {
    taskFilters.status = e.target.value; taskFilters.page = 1; loadTasks();
  });
  document.getElementById('filter-priority').addEventListener('change', (e) => {
    taskFilters.priority = e.target.value; taskFilters.page = 1; loadTasks();
  });
  document.getElementById('filter-assigned').addEventListener('change', (e) => {
    taskFilters.assignedTo = e.target.value; taskFilters.page = 1; loadTasks();
  });
  document.getElementById('new-task-btn').addEventListener('click', () => openTaskModal());

  loadTasks();
}

function debounce(fn, delay) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}

async function loadTasks() {
  const board = document.getElementById('kanban-board');
  if (!board) return;
  board.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><p>Chargement…</p></div>`;

  const params = new URLSearchParams();
  if (taskFilters.status) params.set('status', taskFilters.status);
  if (taskFilters.priority) params.set('priority', taskFilters.priority);
  if (taskFilters.assignedTo) params.set('assignedTo', taskFilters.assignedTo);
  if (taskFilters.search) params.set('search', taskFilters.search);
  params.set('page', taskFilters.page);
  params.set('limit', TASKS_PER_PAGE);

  try {
    const { data } = await api.get(`/projects/${currentProjectId}/tasks?${params.toString()}`);
    renderKanban(data.data);
    renderPager('tasks-pager', data.page, data.totalPages, (p) => {
      taskFilters.page = p;
      loadTasks();
    });
  } catch (err) {
    board.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><p>Impossible de charger les tâches.</p></div>`;
  }
}

function renderKanban(tasks) {
  const board = document.getElementById('kanban-board');
  const cols = [
    { key: 'à faire', label: 'À FAIRE' },
    { key: 'en cours', label: 'EN COURS' },
    { key: 'terminé', label: 'TERMINÉ' },
  ];

  board.innerHTML = cols
    .map((col) => {
      const colTasks = tasks.filter((t) => t.status === col.key);
      return `
      <div class="kanban-col">
        <div class="col-head"><span>${col.label}</span><span>${colTasks.length}</span></div>
        ${
          colTasks.length
            ? colTasks.map((t) => taskCardHtml(t)).join('')
            : `<div style="text-align:center;color:var(--text-faint);font-size:12px;padding:14px 0">Vide</div>`
        }
      </div>`;
    })
    .join('');

  board.querySelectorAll('.task-card').forEach((el) => {
    const task = tasks.find((t) => t._id === el.dataset.id);
    el.addEventListener('click', (e) => {
      if (e.target.classList.contains('quick-status-select')) return;
      openTaskModal(task);
    });
  });

  // Changement rapide de statut — utilise la route dédiée PATCH /api/tasks/:id/status
  board.querySelectorAll('.quick-status-select').forEach((sel) => {
    sel.addEventListener('click', (e) => e.stopPropagation());
    sel.addEventListener('change', async (e) => {
      e.stopPropagation();
      try {
        await api.patch(`/tasks/${sel.dataset.id}/status`, { status: sel.value });
        showToast('Statut mis à jour', 'success');
        loadTasks();
      } catch (err) {
        showToast(err.response?.data?.error || 'Impossible de changer le statut', 'error');
      }
    });
  });
}

function taskCardHtml(t) {
  const overdue = t.dueDate && t.status !== 'terminé' && new Date(t.dueDate) < new Date();
  return `
    <div class="task-card" data-id="${t._id}">
      <div class="t-title">${escapeHtml(t.title)}</div>
      <div class="t-meta">
        <span>${t.assignedTo ? escapeHtml(t.assignedTo.fullName) : 'Non assignée'}</span>
        <span class="priority-tag ${t.priority}">${t.priority}</span>
      </div>
      ${t.dueDate ? `<div class="t-meta" style="margin-top:6px"><span class="${overdue ? 'overdue-flag' : ''}">${overdue ? '⚠ En retard — ' : ''}${new Date(t.dueDate).toLocaleDateString('fr-FR')}</span></div>` : ''}
      <select class="field-select quick-status-select" data-id="${t._id}" style="margin-top:8px;font-size:11.5px;padding:5px 6px">
        <option value="à faire" ${t.status === 'à faire' ? 'selected' : ''}>À faire</option>
        <option value="en cours" ${t.status === 'en cours' ? 'selected' : ''}>En cours</option>
        <option value="terminé" ${t.status === 'terminé' ? 'selected' : ''}>Terminé</option>
      </select>
    </div>`;
}

function openTaskModal(task = null) {
  const members = [currentProjectData.owner, ...(currentProjectData.members || [])];
  const isEdit = !!task;
  const currentUserId = getStoredUser().id;
  const isOwner = (currentProjectData.owner._id || currentProjectData.owner) === currentUserId;

  openModal(`
    <h3>${isEdit ? 'Modifier la tâche' : 'Nouvelle tâche'}</h3>
    ${!isEdit ? `<div id="draft-banner-slot"></div>` : ''}
    <form id="task-form">
      <div class="field">
        <label>Titre</label>
        <input type="text" name="title" required value="${isEdit ? escapeHtml(task.title) : ''}">
      </div>
      <div class="field">
        <label>Description</label>
        <textarea class="field-textarea" name="description">${isEdit ? escapeHtml(task.description || '') : ''}</textarea>
      </div>
      <div class="field-row">
        <div class="field">
          <label>Priorité</label>
          <select class="field-select" name="priority">
            <option value="basse" ${isEdit && task.priority === 'basse' ? 'selected' : ''}>Basse</option>
            <option value="moyenne" ${!isEdit || task.priority === 'moyenne' ? 'selected' : ''}>Moyenne</option>
            <option value="haute" ${isEdit && task.priority === 'haute' ? 'selected' : ''}>Haute</option>
          </select>
        </div>
        <div class="field">
          <label>Statut</label>
          <select class="field-select" name="status">
            <option value="à faire" ${!isEdit || task.status === 'à faire' ? 'selected' : ''}>À faire</option>
            <option value="en cours" ${isEdit && task.status === 'en cours' ? 'selected' : ''}>En cours</option>
            <option value="terminé" ${isEdit && task.status === 'terminé' ? 'selected' : ''}>Terminé</option>
          </select>
        </div>
      </div>
      <div class="field-row">
        <div class="field">
          <label>Échéance</label>
          <input type="date" name="dueDate" value="${isEdit && task.dueDate ? task.dueDate.substring(0, 10) : ''}">
        </div>
        <div class="field">
          <label>Assignée à</label>
          <select class="field-select" name="assignedTo" ${isEdit && !isOwner ? 'disabled' : ''}>
            <option value="">— Aucun —</option>
            ${members
              .map(
                (m) =>
                  `<option value="${m._id}" ${isEdit && task.assignedTo && task.assignedTo._id === m._id ? 'selected' : ''}>${escapeHtml(m.fullName)}</option>`
              )
              .join('')}
          </select>
        </div>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-ghost" id="cancel-task-form">Annuler</button>
        <button type="submit" class="btn btn-primary">${isEdit ? 'Enregistrer' : 'Créer la tâche'}</button>
      </div>
      ${isEdit && isOwner ? `<button type="button" class="btn btn-danger" id="delete-task-btn" style="width:100%;margin-top:10px">Supprimer la tâche</button>` : ''}
    </form>
  `);

  const form = document.getElementById('task-form');

  // Fonctionnalité 7 : brouillon auto-sauvegardé (uniquement en création)
  if (!isEdit) {
    const draft = loadDraft(currentProjectId);
    if (draft) {
      document.getElementById('draft-banner-slot').innerHTML = `
        <div class="draft-banner">
          <span>Un brouillon non terminé a été trouvé.</span>
          <button type="button" id="restore-draft-btn">Restaurer</button>
        </div>`;
      document.getElementById('restore-draft-btn').addEventListener('click', () => {
        applyDraftToForm(form, draft);
      });
    }
    attachDraftAutosave(form, currentProjectId);
  }

  document.getElementById('cancel-task-form').addEventListener('click', closeModal);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const payload = {
      title: fd.get('title'),
      description: fd.get('description'),
      priority: fd.get('priority'),
      status: fd.get('status'),
      dueDate: fd.get('dueDate') || null,
      assignedTo: fd.get('assignedTo') || null,
    };

    try {
      if (isEdit) {
        await api.put(`/tasks/${task._id}`, payload);
        showToast('Tâche mise à jour', 'success');
      } else {
        payload.project = currentProjectId;
        await api.post('/tasks', payload);
        clearDraft(currentProjectId); // brouillon supprimé après soumission réussie
        showToast('Tâche créée', 'success');
      }
      closeModal();
      loadTasks();
    } catch (err) {
      showToast(err.response?.data?.error || "Erreur lors de l'enregistrement", 'error');
    }
  });

  const deleteBtn = document.getElementById('delete-task-btn');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', async () => {
      try {
        await api.delete(`/tasks/${task._id}`);
        closeModal();
        showToast('Tâche supprimée', 'success');
        loadTasks();
      } catch (err) {
        showToast('Impossible de supprimer cette tâche', 'error');
      }
    });
  }
}
