import { useEffect, useState } from 'react';
import { getPrerequisiteRanking } from './api.js';
import { groupRanking, prepareRanking } from './prerequisiteFrequency.js';

// Ranked rows of one subject, already filtered and in rank order. coveredBy
// maps codes counted as completed through prerequisites to the covering class.
function RankingList({ rows, completed, coveredBy, onToggleCompleted }) {
  return (
    <ol className="ranking-list">
      {rows.map((row, index) => {
        const checkboxId = `rank-completed-${row.code.replace(/\s+/g, '-')}`;
        const via = coveredBy.get(row.code);
        return (
          <li key={row.code} className={`rank-row${row.completed ? ' is-completed' : ''}`}>
            <span className="rank-number" aria-hidden="true">{index + 1}</span>
            <div className="rank-body">
              <div className="rank-head">
                <span className="course-code">{row.code}</span>
                {row.completed && <span className="badge">{via ? `Covered by ${via}` : 'Completed'}</span>}
              </div>
              <p className={`rank-name${row.inCatalog ? '' : ' muted'}`}>{row.name ?? 'Not in catalog'}</p>
              <p className="required-by">
                <span className="required-by-label">Listed by</span>
                {row.requiredBy.map((code) => (
                  <span key={code} className={`mini-chip${completed.includes(code) ? ' done' : ''}`}>
                    {code}{completed.includes(code) && <span className="visually-hidden"> (completed)</span>}
                  </span>
                ))}
              </p>
              <label className="check-label" htmlFor={checkboxId}>
                <input id={checkboxId} type="checkbox" checked={row.completed} disabled={Boolean(via)} onChange={() => onToggleCompleted(row.code)} />
                {via ? `Completed (prerequisite of ${via})` : 'Completed'}
              </label>
            </div>
            <div className="rank-score" aria-label={`Listed by ${row.remainingCount} courses you have not completed, out of ${row.count} total`}>
              <span className="score-value">{row.remainingCount}<span className="score-total">/{row.count}</span></span>
              <span className="score-label">still ahead / total</span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

// Major and GE sections, each listing its subjects as collapsed headers; a
// subject's classes appear only after its header is clicked. Exported
// separately so it can be rendered in tests.
export function RankingGroups({ rows, courses, completed, implied = [], hideCompleted, onToggleCompleted }) {
  if (rows.length === 0) {
    return <p className="panel-empty">No prerequisite references are recorded yet.</p>;
  }
  const visible = prepareRanking(rows, completed, { hideCompleted });
  const coveredBy = new Map(implied.map((entry) => [entry.code, entry.via]));
  if (visible.length === 0) {
    return <p className="panel-empty">You've completed every referenced class. Clear “Hide completed” to see them.</p>;
  }

  return groupRanking(visible, courses).map((group) => (
    <section key={group.id} className="category" aria-labelledby={`category-${group.id}`}>
      <h3 id={`category-${group.id}`} className="category-title">{group.title}</h3>
      {group.subjects.length === 0 ? (
        <p className="panel-empty">No {group.label} classes to show.</p>
      ) : (
        group.subjects.map(({ subject, rows: subjectRows }) => (
          <details key={subject} className="subject-group">
            <summary>
              <span className="subject-name">{subject}</span>
              <span className="subject-count">{subjectRows.length} {subjectRows.length === 1 ? 'class' : 'classes'}</span>
            </summary>
            <RankingList rows={subjectRows} completed={completed} coveredBy={coveredBy} onToggleCompleted={onToggleCompleted} />
          </details>
        ))
      )}
    </section>
  ));
}

export default function PrerequisiteRanking({ completed, implied = [], courses, onToggleCompleted }) {
  const [rows, setRows] = useState([]);
  const [source, setSource] = useState('api');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [hideCompleted, setHideCompleted] = useState(false);
  const completedKey = completed.join('|');

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');

    getPrerequisiteRanking(completedKey ? completedKey.split('|') : [], courses, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) {
          setRows(result.rows);
          setSource(result.source);
        }
      })
      .catch((failure) => {
        if (!controller.signal.aborted) {
          setError(failure instanceof TypeError
            ? 'Cannot reach the API. Check that Spring Boot and PostgreSQL are running, then retry.'
            : failure.message);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [completedKey, courses, attempt]);

  return (
    <section className="panel" aria-labelledby="ranking-title" aria-busy={loading}>
      <div className="panel-heading">
        <h2 id="ranking-title">Most-referenced prerequisites</h2>
        <label className="check-label" htmlFor="hide-completed">
          <input id="hide-completed" type="checkbox" checked={hideCompleted} onChange={(event) => setHideCompleted(event.target.checked)} />
          Hide completed
        </label>
      </div>
      <p className="panel-hint">
        Classes that appear in the most prerequisite lists, split into major, GE, elective, and other (not required) classes. Prerequisites of your completed classes count as completed. Click a subject to see its classes. Lists include alternatives (for example “MATH 19 or MATH 18A”), so a high rank means <em>most referenced</em>, not required.
        The score shows how many courses you haven't completed still list it, out of all courses that list it.
      </p>
      {source === 'browser' && !error && (
        <p className="panel-hint warning">The ranking endpoint isn't available on this backend yet, so it was calculated in your browser from the catalog.</p>
      )}

      {error ? (
        <div className="state-panel error compact" role="alert">
          <p>{error}</p>
          <button type="button" onClick={() => setAttempt((current) => current + 1)}>Retry</button>
        </div>
      ) : loading && rows.length === 0 ? (
        <p className="panel-empty" role="status">Loading ranking…</p>
      ) : (
        <>
          <p className="visually-hidden" role="status">{loading ? 'Updating ranking…' : `${rows.length} referenced classes ranked.`}</p>
          <RankingGroups
            rows={rows}
            courses={courses}
            completed={completed}
            implied={implied}
            hideCompleted={hideCompleted}
            onToggleCompleted={onToggleCompleted}
          />
        </>
      )}
    </section>
  );
}
