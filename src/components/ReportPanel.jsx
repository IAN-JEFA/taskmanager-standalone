import { useEffect, useState, useCallback } from 'react';
import client from '../api/client';

const todayISO = () => new Date().toISOString().slice(0, 10);
const PRIORITIES = ['high', 'medium', 'low'];
const STATUSES = ['pending', 'in_progress', 'done'];

export default function ReportPanel() {
  const [date, setDate] = useState(todayISO());
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchReport = useCallback(async (targetDate) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await client.get('/tasks/report', { params: { date: targetDate } });
      setSummary(data.summary);
    } catch {
      setError('Could not load the report for this date.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReport(date);
  }, [date, fetchReport]);

  const total = summary
    ? PRIORITIES.reduce(
        (acc, p) => acc + STATUSES.reduce((sum, s) => sum + (summary[p]?.[s] || 0), 0),
        0
      )
    : 0;

  return (
    <aside className="report-panel">
      <div className="report-panel__header">
        <h2>Daily report</h2>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="report-panel__date"
        />
      </div>

      {loading && <p className="report-panel__status">Loading…</p>}
      {error && <p className="report-panel__status report-panel__status--error">{error}</p>}

      {!loading && !error && summary && (
        <>
          <p className="report-panel__total">
            <span className="report-panel__total-number">{total}</span> task
            {total === 1 ? '' : 's'} due
          </p>

          <table className="report-table">
            <thead>
              <tr>
                <th>Priority</th>
                {STATUSES.map((s) => (
                  <th key={s}>{s === 'in_progress' ? 'In prog.' : s}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PRIORITIES.map((priority) => (
                <tr key={priority}>
                  <td>
                    <span className={`beacon beacon--${priority}`} /> {priority}
                  </td>
                  {STATUSES.map((status) => (
                    <td key={status}>{summary[priority]?.[status] ?? 0}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </aside>
  );
}
