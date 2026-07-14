// ---------------------------------------------------------------------------
// Drop-in replacement for the real Axios client. Every page/component in this
// app talks to `client.get/post/patch/delete(...)` exactly as if a Laravel
// API were running — this file is the only thing that changed to make the
// whole system work with zero real backend.
// ---------------------------------------------------------------------------

import * as db from './db.js';

db.seedIfEmpty();

const TOKEN_KEY = 'taskops_token';

// Simulated network latency so it *feels* like a real request round-trip
// (also makes loading states in the UI visible instead of instant/jarring).
function withLatency(fn) {
  const delay = 250 + Math.random() * 300;
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        resolve({ data: fn() });
      } catch (err) {
        reject(err);
      }
    }, delay);
  });
}

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function matchTaskStatusRoute(path) {
  const m = path.match(/^\/tasks\/(\d+)\/status$/);
  return m ? m[1] : null;
}

function matchTaskRoute(path) {
  const m = path.match(/^\/tasks\/(\d+)$/);
  return m ? m[1] : null;
}

const client = {
  get(path, config = {}) {
    if (path === '/tasks') {
      return withLatency(() => db.listTasks(getToken(), config.params || {}));
    }
    if (path === '/tasks/report') {
      const date = config.params?.date;
      return withLatency(() => db.dailyReport(getToken(), date));
    }
    if (path === '/user') {
      return withLatency(() => {
        const user = db.currentUserFromToken(getToken());
        if (!user) throw { response: { status: 401, data: { message: 'Unauthenticated.' } } };
        return { user };
      });
    }
    return Promise.reject({ response: { status: 404, data: { message: `Unknown route: ${path}` } } });
  },

  post(path, body = {}) {
    if (path === '/register') {
      return withLatency(() => db.register(body));
    }
    if (path === '/login') {
      return withLatency(() => db.login(body));
    }
    if (path === '/logout') {
      return withLatency(() => db.logout(getToken()));
    }
    if (path === '/tasks') {
      return withLatency(() => db.createTask(getToken(), body));
    }
    return Promise.reject({ response: { status: 404, data: { message: `Unknown route: ${path}` } } });
  },

  patch(path, body = {}) {
    const statusTaskId = matchTaskStatusRoute(path);
    if (statusTaskId) {
      return withLatency(() => db.updateTaskStatus(getToken(), statusTaskId, body.status));
    }
    return Promise.reject({ response: { status: 404, data: { message: `Unknown route: ${path}` } } });
  },

  delete(path) {
    const taskId = matchTaskRoute(path);
    if (taskId) {
      return withLatency(() => db.deleteTask(getToken(), taskId));
    }
    return Promise.reject({ response: { status: 404, data: { message: `Unknown route: ${path}` } } });
  },
};

export default client;
