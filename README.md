# TaskFlow

Application web de gestion de projets collaboratifs — Module JavaScript · Express · MongoDB · Docker · GitHub.

## Stack technique

- **Frontend** : HTML / CSS / JavaScript (vanilla) + Axios, servi par un petit serveur Express
- **Backend** : Node.js + Express (API REST)
- **Base de données** : MongoDB (conteneur Docker)
- **Authentification** : JWT + bcryptjs
- **Conteneurisation** : Docker + docker-compose

## Répartition des fonctionnalités (à compléter par l'équipe)

| # | Fonctionnalité | 
|---|-----------------|
| 1 | Authentification (JWT, bcrypt) |
| 2 | Création et gestion des projets |
| 3 | Gestion des tâches |
| 4 | Assignation des tâches |
| 5 | Tableau de bord personnel |
| 6 | Filtrage, recherche, pagination |
| 7 | Sauvegarde automatique des brouillons |
| 8 | Gestion des membres d'un projet |
| 9 | Historique des activités |
| 10 | Notifications côté client |

## Lancer le projet

```bash
docker-compose up --build
```

- Frontend : http://localhost:3000
- Backend (API) : http://localhost:5000

## Structure du projet

```
Taskflow/
├── backend/
│   ├── src/
│   │   ├── controllers/   # logique métier de chaque route
│   │   ├── models/        # schémas Mongoose (User, Project, Task, Activity, Notification)
│   │   ├── routes/        # définition des routes Express
│   │   └── middleware/    # auth.js (JWT) et projectAccess.js (rôles owner/membre)
│   ├── server.js
│   └── .env               # jamais versionné (voir .gitignore)
├── frontend/
│   └── public/
│       ├── index.html
│       ├── css/style.css
│       └── js/             # api.js, auth.js, dashboard.js, projects.js, tasks.js,
│                            # notifications.js, drafts.js, app.js
└── docker-compose.yml
```

## Workflow Git

- `main` : code stable et validé uniquement.
- `develop` : intégration du travail de l'équipe.
- `feature/xxx` : une branche par fonctionnalité, fusionnée dans `develop` via Pull Request relue par un autre membre.
- Convention de commit : `feat:`, `fix:`, `docs:`, `refactor:`.
