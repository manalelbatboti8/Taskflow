# TaskFlow

Full-stack collaborative project management web application — JavaScript · Express · MongoDB · Docker · GitHub module.

## Tech Stack

- **Frontend**: HTML / CSS / JavaScript (vanilla) + Axios, served by a lightweight Express server
- **Backend**: Node.js + Express (REST API)
- **Database**: MongoDB (Docker container)
- **Authentication**: JWT + bcryptjs
- **Containerization**: Docker + docker-compose

## Feature ownership (fill in with your team)

| # | Feature | Owner |
|---|---------|-------|
| 1 | Authentication (JWT, bcrypt) | |
| 2 | Project creation & management | |
| 3 | Task management | |
| 4 | Task assignment | |
| 5 | Personal dashboard | |
| 6 | Filtering, search & pagination | |
| 7 | Auto-save drafts | |
| 8 | Project member management | |
| 9 | Activity history | |
| 10 | Client-side notifications | |

## Running the project

```bash
docker-compose up --build
```

- Frontend: http://localhost:3000
- Backend (API): http://localhost:5000

## Project structure

```
Taskflow/
├── backend/
│   ├── src/
│   │   ├── controllers/   # business logic for each route
│   │   ├── models/        # Mongoose schemas (User, Project, Task, Activity, Notification)
│   │   ├── routes/        # Express route definitions
│   │   └── middleware/    # auth.js (JWT) and projectAccess.js (owner/member roles)
│   ├── server.js
│   └── .env               # never committed (see .gitignore)
├── frontend/
│   └── public/
│       ├── index.html
│       ├── css/style.css (or style.css)
│       └── js/             # api.js, auth.js, dashboard.js, projects.js, tasks.js,
│                            # notifications.js, drafts.js, app.js
└── docker-compose.yml
```

## Git Workflow

- `main`: stable, validated code only.
- `develop`: integration branch for the team's work.
- `feature/xxx`: one branch per feature, merged into `develop` via a Pull Request reviewed by another team member.
- Commit convention: `feat:`, `fix:`, `docs:`, `refactor:`.

## Main Features

1. **Authentication** — JWT-based signup/login, bcrypt-hashed passwords, token stored in LocalStorage and attached automatically via Axios, session restored on page reload.
2. **Projects** — Full CRUD REST API, paginated listing, status (active / paused / archived), cascade deletion of tasks via a Mongoose `pre('deleteOne')` hook.
3. **Tasks** — CRUD with priority/status enums, dedicated `PATCH /api/tasks/:id/status` route.
4. **Assignment** — Tasks assigned to project members via `assignedTo` + `.populate()` (password excluded from the response).
5. **Dashboard** — Personal metrics computed server-side with a MongoDB aggregation pipeline (`$match`, `$group`, `$count`).
6. **Filtering & search** — Conditional Mongoose filters by status/priority/assignee, `$regex` search, paginated response (`data`, `total`, `page`, `totalPages`).
7. **Draft auto-save** — Task form data auto-saved to LocalStorage on input, restorable on reload, cleared on successful submit.
8. **Members** — Project owner invites members by email, restricted permissions for non-owners.
9. **Activity feed** — Every significant project action logged and displayed chronologically.
10. **Notifications** — Client-side polling every 30 seconds, unread badge, read notifications archived in LocalStorage.