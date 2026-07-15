# Task Ops Console — Standalone Edition

This is the **same Task Management system** from the assignment, but with the
Laravel + MySQL backend replaced by a mock data layer that runs entirely in
your browser. There is no server, no PHP, no database to install — it behaves
exactly like the full-stack version (same validation rules, same error
messages, same request/response shapes), it just persists data to
`localStorage` instead of MySQL.

Use this version to demo the UI/UX quickly, or as a reference for exactly how
the business rules are supposed to behave, without needing XAMPP or a
deployed API.

---

## Run it

```bash
npm install
npm run dev
```

Open the printed local URL (usually `http://localhost:5173`). That's it — no
`.env`, no backend, no database setup.

## Try it

- Register a new account, or log in with the seeded demo account:
  **`demo@taskops.dev`** / **`password123`**
- Create tasks, advance their status, delete completed ones, check the daily
  report — everything works exactly like the real API-backed version.

---

## How it works

- **`src/api/db.js`** is a small in-browser "database" — it reads/writes
  arrays of users and tasks to `localStorage`, and implements every business
  rule from the original Laravel controllers:
  - Duplicate title + due_date rejected (scoped per user)
  - `due_date` must be today or later
  - `priority` restricted to low/medium/high
  - Tasks sorted by priority (high → low), then due_date ascending
  - Optional status filter on the list view
  - Status can only progress forward: `pending → in_progress → done` (no
    skipping or reverting)
  - Delete only allowed once a task is `done`, otherwise a 403-shaped error
  - Daily report grouped by priority × status for a given date, matching the
    assignment's exact JSON shape

- **`src/api/client.js`** is a drop-in replacement for the real Axios client.
  It exposes the same `get/post/patch/delete` methods, on the same URL paths
  (`/register`, `/tasks`, `/tasks/:id/status`, `/tasks/report`, etc.), and
  throws errors shaped exactly like real Axios/Laravel errors
  (`err.response.status`, `err.response.data.message`, `.errors`). Because of
  this, every page and component (`Dashboard.jsx`, `TaskFormModal.jsx`,
  `ReportPanel.jsx`, `AuthContext.jsx`) is **completely unchanged** from the
  full-stack version — they have no idea there's no real server behind them.

- A small simulated network delay (250–550ms) is added to every "request" so
  loading states in the UI are visible, just like a real API call.

---

## Data & limitations (read this before demoing to someone else)

- **Data lives only in your browser**, scoped to this site's origin. It does
  **not** sync across browsers, devices, or incognito windows.
- **Clearing site data / browser storage wipes everything** — there's no
  server-side backup.
- **Passwords are not securely hashed.** The "hashing" in `db.js` is a toy
  stand-in for bcrypt, sufficient for a local demo — never reuse this pattern
  for anything handling real user data.
- This is **not** a substitute for the deployed, database-backed version —
  it's meant for quick local demos, UI iteration, or offline presentation.

## Resetting demo data

Open your browser's devtools console on the running app and run:

```js
resetTaskOpsDemo()
```

This wipes all local data and reseeds the original demo account + sample
tasks, then redirects you to the login page.

---

## Building a static bundle (optional)

If you want to hand someone a folder they can open without running `npm run
dev` at all:

```bash
npm run build
```

This produces a `dist/` folder. Since this version needs no backend, you can
open `dist/index.html` directly in a browser, or drop the whole `dist/`
folder onto any static host (GitHub Pages, Netlify, Vercel, or just a local
file server) — no environment variables, no API URL to configure.
