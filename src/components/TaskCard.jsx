const NEXT_STATUS = {
  pending: 'in_progress',
  in_progress: 'done',
  done: null,
};

const STATUS_LABEL = {
  pending: 'Pending',
  in_progress: 'In progress',
  done: 'Done',
};

const ACTION_LABEL = {
  pending: 'Start task',
  in_progress: 'Mark done',
};

export default function TaskCard({ task, onAdvanceStatus, onDelete, busy }) {
  const nextStatus = NEXT_STATUS[task.status];
  const isDeletable = task.status === 'done';

  return (
    <article className={`task-card task-card--${task.priority}`}>
      <div className="task-card__top">
        <span className={`beacon beacon--${task.priority}`} title={`${task.priority} priority`} />
        <h3 className="task-card__title">{task.title}</h3>
        <span className={`status-pill status-pill--${task.status}`}>
          {STATUS_LABEL[task.status]}
        </span>
      </div>

      <div className="task-card__meta">
        <span className="task-card__meta-item">
          <span className="task-card__meta-label">DUE</span> {task.due_date}
        </span>
        <span className="task-card__meta-item">
          <span className="task-card__meta-label">PRIORITY</span> {task.priority}
        </span>
      </div>

      <div className="task-card__actions">
        {nextStatus && (
          <button
            className="btn btn--ghost"
            disabled={busy}
            onClick={() => onAdvanceStatus(task, nextStatus)}
          >
            {ACTION_LABEL[task.status]} →
          </button>
        )}

        <button
          className="btn btn--danger"
          disabled={busy || !isDeletable}
          title={isDeletable ? 'Delete this task' : 'Only done tasks can be deleted'}
          onClick={() => onDelete(task)}
        >
          Delete
        </button>
      </div>
    </article>
  );
}
