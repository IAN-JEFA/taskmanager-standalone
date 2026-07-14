import { useEffect, useState, useCallback, useMemo } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext.jsx';
import TaskCard from '../components/TaskCard.jsx';
import TaskFormModal from '../components/TaskFormModal.jsx';
import ReportPanel from '../components/ReportPanel.jsx';

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'done', label: 'Done' },
];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [busyTaskId, setBusyTaskId] = useState(null);
  const [clock, setClock] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const fetchTasks = useCallback(async (status) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await client.get('/tasks', {
        params: status ? { status } : {},
      });
      setTasks(data.data || []);
    } catch {
      setError('Could not load tasks. Check that the API is running.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks(statusFilter);
  }, [statusFilter, fetchTasks]);

  async function handleCreate(form) {
    setCreating(true);
    try {
      await client.post('/tasks', form);
      await fetchTasks(statusFilter);
      setShowModal(false);
      return { success: true };
    } catch (err) {
      return { success: false, errors: err.response?.data?.errors };
    } finally {
      setCreating(false);
    }
  }

  async function handleAdvanceStatus(task, nextStatus) {
    setBusyTaskId(task.id);
    try {
      await client.patch(`/tasks/${task.id}/status`, { status: nextStatus });
      await fetchTasks(statusFilter);
    } catch {
      setError('Could not update task status.');
    } finally {
      setBusyTaskId(null);
    }
  }

  async function handleDelete(task) {
    setBusyTaskId(task.id);
    try {
      await client.delete(`/tasks/${task.id}`);
      await fetchTasks(statusFilter);
    } catch {
      setError('Only tasks marked "done" can be deleted.');
    } finally {
      setBusyTaskId(null);
    }
  }

  const counts = useMemo(() => {
    return tasks.reduce(
      (acc, t) => {
        acc[t.status] = (acc[t.status] || 0) + 1;
        return acc;
      },
      { pending: 0, in_progress: 0, done: 0 }
    );
  }, [tasks]);

  return (
    <div className="console">
      <header className="console__topbar">
        <div className="console__brand">
          <span className="beacon beacon--ok" />
          <span className="console__brand-text">TASK OPS CONSOLE</span>
        </div>

        <div className="console__status-line">
          SYSTEM: OPERATIONAL // {tasks.length} ACTIVE TASKS //{' '}
          {clock.toLocaleTimeString()}
        </div>

        <div className="console__user">
          <span className="console__user-name">{user?.name}</span>
          <button className="btn btn--ghost btn--small" onClick={logout}>
            Log out
          </button>
        </div>
      </header>

      <main className="console__body">
        <section className="console__main">
          <div className="console__toolbar">
            <div className="filter-tabs">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.value}
                  className={`filter-tab ${statusFilter === f.value ? 'is-active' : ''}`}
                  onClick={() => setStatusFilter(f.value)}
                >
                  {f.label}
                  {f.value && (
                    <span className="filter-tab__count">{counts[f.value] ?? 0}</span>
                  )}
                </button>
              ))}
            </div>

            <button className="btn btn--primary" onClick={() => setShowModal(true)}>
              + New task
            </button>
          </div>

          {error && <div className="auth-error">{error}</div>}

          {loading ? (
            <p className="console__empty">Loading tasks…</p>
          ) : tasks.length === 0 ? (
            <div className="console__empty">
              <p>No tasks match this view.</p>
              <button className="btn btn--primary" onClick={() => setShowModal(true)}>
                Create your first task
              </button>
            </div>
          ) : (
            <div className="task-grid">
              {tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onAdvanceStatus={handleAdvanceStatus}
                  onDelete={handleDelete}
                  busy={busyTaskId === task.id}
                />
              ))}
            </div>
          )}
        </section>

        <ReportPanel />
      </main>

      {showModal && (
        <TaskFormModal
          onClose={() => setShowModal(false)}
          onCreate={handleCreate}
          submitting={creating}
        />
      )}
    </div>
  );
}
