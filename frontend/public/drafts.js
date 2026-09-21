// ===========================================================
// drafts.js — sauvegarde automatique des brouillons de tâche
// dans le LocalStorage (Fonctionnalité 7)
// ===========================================================

function draftKey(projectId) {
  return `taskflow_draft_task_${projectId}`;
}

function saveDraft(projectId, data) {
  localStorage.setItem(draftKey(projectId), JSON.stringify(data));
}

function loadDraft(projectId) {
  try {
    const raw = localStorage.getItem(draftKey(projectId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function clearDraft(projectId) {
  localStorage.removeItem(draftKey(projectId));
}

// Branche la sauvegarde automatique (événement 'input') sur un formulaire de tâche.
// formEl: élément <form>, projectId: id du projet courant.
function attachDraftAutosave(formEl, projectId) {
  const fields = ['title', 'description', 'priority', 'status', 'dueDate', 'assignedTo'];

  formEl.addEventListener('input', () => {
    const data = {};
    fields.forEach((f) => {
      const input = formEl.querySelector(`[name="${f}"]`);
      if (input) data[f] = input.value;
    });
    saveDraft(projectId, data);
  });
}

function applyDraftToForm(formEl, draft) {
  Object.keys(draft).forEach((key) => {
    const input = formEl.querySelector(`[name="${key}"]`);
    if (input) input.value = draft[key];
  });
}
