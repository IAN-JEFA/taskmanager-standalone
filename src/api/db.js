// ---------------------------------------------------------------------------
// A tiny in-browser "database" that stands in for MySQL + Laravel.
// Data is persisted to localStorage so it survives page refreshes, just like
// a real database would survive a server restart.
// ---------------------------------------------------------------------------

const USERS_KEY = 'taskops_db_users';
const TASKS_KEY = 'taskops_db_tasks';

function readTable(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeTable(key, rows) {
  localStorage.setItem(key, JSON.stringify(rows));
}

function nextId(rows) {
  return rows.length ? Math.max(...rows.map((r) => r.id)) + 1 : 1;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function simpleHash(str) {
  // Not real cryptography — this is a client-only demo standing in for
  // Laravel's bcrypt hashing. Never do this in a real backend.
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return `demo_hash_${hash}`;
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export function register({ name, email, password, password_confirmation }) {
  const errors = {};
  if (!name) errors.name = ['The name field is required.'];
  if (!email) errors.email = ['The email field is required.'];
  if (password && password.length < 8) {
    errors.password = ['The password must be at least 8 characters.'];
  }
  if (password !== password_confirmation) {
    errors.password = [...(errors.password || []), 'The password confirmation does not match.'];
  }

  const users = readTable(USERS_KEY);
  if (email && users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    errors.email = ['The email has already been taken.'];
  }

  if (Object.keys(errors).length > 0) {
    throw { response: { status: 422, data: { message: 'Validation failed.', errors } } };
  }

  const user = {
    id: nextId(users),
    name,
    email,
    password_hash: simpleHash(password),
    token: crypto.randomUUID(),
  };
  users.push(user);
  writeTable(USERS_KEY, users);

  return {
    message: 'Account created successfully.',
    user: { id: user.id, name: user.name, email: user.email },
    token: user.token,
  };
}

export function login({ email, password }) {
  const users = readTable(USERS_KEY);
  const user = users.find((u) => u.email.toLowerCase() === (email || '').toLowerCase());

  if (!user || user.password_hash !== simpleHash(password)) {
    throw {
      response: { status: 401, data: { message: 'The provided credentials are incorrect.' } },
    };
  }

  user.token = crypto.randomUUID();
  writeTable(USERS_KEY, users);

  return {
    message: 'Logged in successfully.',
    user: { id: user.id, name: user.name, email: user.email },
    token: user.token,
  };
}

export function logout(token) {
  const users = readTable(USERS_KEY);
  const user = users.find((u) => u.token === token);
  if (user) {
    user.token = null;
    writeTable(USERS_KEY, users);
  }
  return { message: 'Logged out successfully.' };
}

export function currentUserFromToken(token) {
  if (!token) return null;
  const users = readTable(USERS_KEY);
  const user = users.find((u) => u.token === token);
  return user ? { id: user.id, name: user.name, email: user.email } : null;
}

function requireUser(token) {
  const user = currentUserFromToken(token);
  if (!user) {
    throw { response: { status: 401, data: { message: 'Unauthenticated.' } } };
  }
  return user;
}

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };
const STATUS_FLOW = { pending: 'in_progress', in_progress: 'done', done: null };

export function listTasks(token, { status } = {}) {
  const user = requireUser(token);
  let tasks = readTable(TASKS_KEY).filter((t) => t.user_id === user.id);

  if (status) {
    tasks = tasks.filter((t) => t.status === status);
  }

  tasks.sort((a, b) => {
    const pDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    if (pDiff !== 0) return pDiff;
    return a.due_date.localeCompare(b.due_date);
  });

  if (tasks.length === 0) {
    return { message: 'No tasks found.', data: [] };
  }
  return { message: 'Tasks retrieved successfully.', data: tasks };
}

export function createTask(token, { title, due_date, priority }) {
  const user = requireUser(token);
  const errors = {};

  if (!title) errors.title = ['The title field is required.'];
  if (!due_date) errors.due_date = ['The due date field is required.'];
  else if (due_date < todayISO()) {
    errors.due_date = ['Due date must be today or later.'];
  }
  if (!['low', 'medium', 'high'].includes(priority)) {
    errors.priority = ['Priority must be low, medium, or high.'];
  }

  const tasks = readTable(TASKS_KEY);
  const duplicate = tasks.some(
    (t) =>
      t.user_id === user.id &&
      t.title.toLowerCase() === (title || '').toLowerCase() &&
      t.due_date === due_date
  );
  if (duplicate) {
    errors.title = ['You already have a task with this title due on this date.'];
  }

  if (Object.keys(errors).length > 0) {
    throw { response: { status: 422, data: { message: 'Validation failed.', errors } } };
  }

  const task = {
    id: nextId(tasks),
    user_id: user.id,
    title,
    due_date,
    priority,
    status: 'pending',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  tasks.push(task);
  writeTable(TASKS_KEY, tasks);

  return { message: 'Task created successfully.', data: task };
}

export function updateTaskStatus(token, taskId, status) {
  const user = requireUser(token);
  const tasks = readTable(TASKS_KEY);
  const task = tasks.find((t) => t.id === Number(taskId) && t.user_id === user.id);

  if (!task) {
    throw { response: { status: 404, data: { message: 'Task not found.' } } };
  }

  if (STATUS_FLOW[task.status] !== status) {
    throw {
      response: {
        status: 422,
        data: {
          message: `Cannot change status from '${task.status}' to '${status}'. Status can only move forward: pending -> in_progress -> done.`,
        },
      },
    };
  }

  task.status = status;
  task.updated_at = new Date().toISOString();
  writeTable(TASKS_KEY, tasks);

  return { message: 'Task status updated successfully.', data: task };
}

export function deleteTask(token, taskId) {
  const user = requireUser(token);
  const tasks = readTable(TASKS_KEY);
  const task = tasks.find((t) => t.id === Number(taskId) && t.user_id === user.id);

  if (!task) {
    throw { response: { status: 404, data: { message: 'Task not found.' } } };
  }
  if (task.status !== 'done') {
    throw {
      response: {
        status: 403,
        data: { message: 'Only tasks with status "done" can be deleted.' },
      },
    };
  }

  writeTable(
    TASKS_KEY,
    tasks.filter((t) => t.id !== task.id)
  );
  return { message: 'Task deleted successfully.' };
}

export function dailyReport(token, date) {
  const user = requireUser(token);
  const tasks = readTable(TASKS_KEY).filter((t) => t.user_id === user.id && t.due_date === date);

  const summary = {};
  for (const priority of ['high', 'medium', 'low']) {
    summary[priority] = { pending: 0, in_progress: 0, done: 0 };
  }
  for (const task of tasks) {
    summary[task.priority][task.status] += 1;
  }

  return { date, summary };
}

// ---------------------------------------------------------------------------
// Demo seed data — mirrors the Laravel DatabaseSeeder so the app isn't empty
// on first load.
// ---------------------------------------------------------------------------

export function seedIfEmpty() {
  const users = readTable(USERS_KEY);
  if (users.length > 0) return;

  const demoUser = {
    id: 1,
    name: 'Demo User',
    email: 'demo@taskops.dev',
    password_hash: simpleHash('password123'),
    token: null,
  };
  writeTable(USERS_KEY, [demoUser]);

  const today = todayISO();
  const inDays = (n) => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  };

  const tasks = [
    { title: 'Ship API documentation', due_date: today, priority: 'high', status: 'pending' },
    { title: 'Review pull requests', due_date: today, priority: 'medium', status: 'done' },
    { title: 'Fix login race condition', due_date: today, priority: 'high', status: 'in_progress' },
    { title: 'Write onboarding guide', due_date: inDays(1), priority: 'medium', status: 'pending' },
    { title: 'Update dependency versions', due_date: inDays(2), priority: 'low', status: 'pending' },
    { title: 'Design daily report UI', due_date: inDays(3), priority: 'high', status: 'done' },
    { title: 'Refactor auth middleware', due_date: inDays(5), priority: 'medium', status: 'in_progress' },
    { title: 'Plan sprint retro', due_date: inDays(7), priority: 'low', status: 'pending' },
  ].map((t, i) => ({
    id: i + 1,
    user_id: 1,
    ...t,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));

  writeTable(TASKS_KEY, tasks);
}

export function resetAllData() {
  localStorage.removeItem(USERS_KEY);
  localStorage.removeItem(TASKS_KEY);
  localStorage.removeItem('taskops_token');
  localStorage.removeItem('taskops_user');
  seedIfEmpty();
}
