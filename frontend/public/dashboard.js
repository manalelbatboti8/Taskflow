// ===========================================================
// dashboard.js — Fonctionnalité 5 : tableau de bord personnel
// Un seul appel Axios charge toutes les métriques.
// ===========================================================

async function renderDashboardPage(container) {
  container.innerHTML = `<div class="empty-state"><p>Chargement du tableau de bord…</p></div>`;

  try {
    const { data } = await api.get('/dashboard');
    const d = data.data;

    container.innerHTML = `
      <div class="stat-grid">
        <div class="stat-card accent-blueprint">
          <div class="label">PROJETS ACTIFS</div>
          <div class="value">${d.activeProjects}</div>
        </div>
        <div class="stat-card accent-green">
          <div class="label">TÂCHES ASSIGNÉES</div>
          <div class="value">${d.assignedTasks}</div>
        </div>
        <div class="stat-card accent-amber">
          <div class="label">TÂCHES TERMINÉES</div>
          <div class="value">${d.completedTasks}</div>
        </div>
        <div class="stat-card accent-red">
          <div class="label">TÂCHES EN RETARD</div>
          <div class="value">${d.overdueTasks}</div>
        </div>
      </div>

      <div class="section-title">En cours <div class="rule"></div></div>
      <div id="dashboard-in-progress"></div>
    `;

    const listEl = document.getElementById('dashboard-in-progress');
    if (!d.inProgressTasks.length) {
      listEl.innerHTML = `
        <div class="empty-state">
          <div class="icon">◇</div>
          <p>Aucune tâche en cours pour le moment.</p>
        </div>`;
      return;
    }

    listEl.innerHTML = `<div class="kanban-col" style="max-width:640px">` +
      d.inProgressTasks
        .map((t) => {
          const overdue = t.dueDate && new Date(t.dueDate) < new Date();
          return `
          <div class="task-card">
            <div class="t-title">${escapeHtml(t.title)}</div>
            <div class="t-meta">
              <span>${t.project ? escapeHtml(t.project.title) : ''}</span>
              <span class="priority-tag ${t.priority}">${t.priority}</span>
            </div>
            ${t.dueDate ? `<div class="t-meta" style="margin-top:4px"><span class="${overdue ? 'overdue-flag' : ''}">Échéance : ${new Date(t.dueDate).toLocaleDateString('fr-FR')}</span></div>` : ''}
          </div>`;
        })
        .join('') + `</div>`;
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><p>Impossible de charger le tableau de bord.</p></div>`;
  }
}
