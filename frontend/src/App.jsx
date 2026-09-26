import { useEffect, useMemo, useState } from 'react';
import { getCourses } from './api.js';
import CompletedPanel from './CompletedPanel.jsx';
import PrerequisiteRanking from './PrerequisiteRanking.jsx';
import {
  addCompleted, collectKnownCodes, impliedCompleted, loadCompleted, removeCompleted, saveCompleted, sortCodes,
  toggleCompleted,
} from './completed.js';

export default function App() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [completed, setCompleted] = useState(() => loadCompleted());
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [lastCleared, setLastCleared] = useState(null);

  useEffect(() => {
    setStorageAvailable(saveCompleted(completed));
  }, [completed]);

  function updateCompleted(change) {
    setLastCleared(null);
    setCompleted(change);
  }

  function clearCompleted() {
    setLastCleared(completed);
    setCompleted([]);
  }

  function undoClear() {
    if (lastCleared) setCompleted(lastCleared);
    setLastCleared(null);
  }

  const knownCodes = useMemo(() => collectKnownCodes(courses), [courses]);
  // Prerequisites of completed classes count as completed too.
  const implied = useMemo(() => impliedCompleted(completed, courses), [completed, courses]);
  const effectiveCompleted = useMemo(
    () => sortCodes([...completed, ...implied.map((entry) => entry.code)]),
    [completed, implied],
  );
  const courseNames = useMemo(
    () => Object.fromEntries(courses.map((course) => [course.code, course.name])),
    [courses],
  );

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');

    getCourses(controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setCourses(result);
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
  }, [attempt]);

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="/">Course<span>Planner</span></a>
        <span className="header-label">SJSU · Computer Science</span>
      </header>
      <main>
        <section className="intro" aria-labelledby="page-title">
          <p className="eyebrow">Your next semester starts here</p>
          <h1 id="page-title">Find your key prerequisites.</h1>
          <p>Mark the classes you've completed, then pick a subject to see which classes appear in the most prerequisite lists.</p>
        </section>
        <aside className="notice">
          <strong>Plan with context.</strong> Prerequisite codes may include alternatives or conditional requirements—not every listed course is required. Verify provisional information with SJSU.
        </aside>
        {loading ? (
          <p className="state-panel" role="status">Loading courses…</p>
        ) : error ? (
          <div className="state-panel error" role="alert">
            <p>{error}</p>
            <button onClick={() => setAttempt((current) => current + 1)}>Retry</button>
          </div>
        ) : courses.length === 0 ? (
          <p className="state-panel">No courses have been imported yet. Follow the database import steps in the project README.</p>
        ) : (
          <div className="planner-grid">
            <CompletedPanel
              completed={completed}
              implied={implied}
              knownCodes={knownCodes}
              courseNames={courseNames}
              storageAvailable={storageAvailable}
              lastCleared={lastCleared}
              onAdd={(code) => updateCompleted((current) => addCompleted(current, code))}
              onRemove={(code) => updateCompleted((current) => removeCompleted(current, code))}
              onClear={clearCompleted}
              onUndoClear={undoClear}
            />
            <PrerequisiteRanking
              completed={effectiveCompleted}
              implied={implied}
              courses={courses}
              onToggleCompleted={(code) => updateCompleted((current) => toggleCompleted(current, code))}
            />
          </div>
        )}
      </main>
      <footer>2026–2027 roadmap sample · Planning aid, not official enrollment approval.</footer>
    </div>
  );
}
