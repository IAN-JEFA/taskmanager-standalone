import { useState } from 'react';

const todayISO = () => new Date().toISOString().slice(0, 10);

export default function TaskFormModal({ onClose, onCreate, submitting }) {
  const [form, setForm] = useState({
    title: '',
    due_date: todayISO(),
    priority: 'medium',
  });
  const [errors, setErrors] = useState({});

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors({});
    const res = await onCreate(form);
    if (!res.success) {
      setErrors(res.errors || {});
    }
  }

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div className="modal-panel" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-panel__header">
          <h2>New task</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <label className="field">
            <span className="field__label">Title</span>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Write the deployment checklist"
              autoFocus
            />
            {errors.title && <span className="field__error">{errors.title[0]}</span>}
          </label>

          <label className="field">
            <span className="field__label">Due date</span>
            <input
              type="date"
              required
              min={todayISO()}
              value={form.due_date}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
            />
            {errors.due_date && <span className="field__error">{errors.due_date[0]}</span>}
          </label>

          <label className="field">
            <span className="field__label">Priority</span>
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>

          <div className="modal-panel__footer">
            <button type="button" className="btn btn--ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary" disabled={submitting}>
              {submitting ? 'Creating…' : 'Create task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
