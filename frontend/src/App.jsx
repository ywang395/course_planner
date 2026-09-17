import { useEffect, useState } from 'react';
import { getCourses } from './api.js';

function sourceUrl(value) {
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

function CourseCard({ course }) {
  const prerequisites = course.prerequisites ?? [];
  const source = sourceUrl(course.prerequisiteSource);

  return (
    <article className="course-card">
      <div className="card-top">
        <span className="course-code">{course.code}</span>
        <span className="units">{course.unit} {course.unit === 1 ? 'unit' : 'units'}</span>
      </div>
      <h2>{course.name}</h2>
      <p className="description">{course.description || 'No description available.'}</p>
      <details>
        <summary>Prerequisite details</summary>
        {prerequisites.length > 0 ? (
          <ul className="prerequisite-list" aria-label="Referenced prerequisite courses">
            {prerequisites.map((code) => <li key={code}>{code}</li>)}
          </ul>
        ) : (
          <p>No prerequisite course codes are recorded. Additional requirements may still apply.</p>
        )}
        <p>{course.prerequisiteNotes || 'No additional notes recorded. Verify requirements with the university.'}</p>
        <p className="source-type">Source type: {course.prerequisiteSourceType || 'Not recorded'}</p>
        {source && <a href={source} target="_blank" rel="noopener noreferrer">Read prerequisite source ↗</a>}
      </details>
    </article>
  );
}

export default function App() {
  const [courses, setCourses] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

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

  const search = query.trim().replace(/\s+/g, ' ').toLowerCase();
  const filteredCourses = courses.filter((course) =>
    `${course.code} ${course.name}`.toLowerCase().includes(search),
  );

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="/">Course<span>Planner</span></a>
        <span className="header-label">SJSU · Computer Science</span>
      </header>
      <main>
        <section className="intro" aria-labelledby="page-title">
          <p className="eyebrow">Your next semester starts here</p>
          <h1 id="page-title">Explore your courses.</h1>
          <p>Browse the imported CS roadmap courses and understand their prerequisite requirements.</p>
        </section>
        <aside className="notice">
          <strong>Plan with context.</strong> Prerequisite codes may include alternatives or conditional requirements—not every listed course is required. Read the notes and verify provisional information with SJSU.
        </aside>
        <section aria-label="Course browser">
          <div className="search-row">
            <div className="search-field">
              <label htmlFor="course-search">Search by course code or name</label>
              <input id="course-search" type="search" placeholder="Try CS 146 or data structures" value={query} onChange={(event) => setQuery(event.target.value)} />
            </div>
            {!loading && !error && <p className="result-count" role="status">{filteredCourses.length} of {courses.length} courses</p>}
          </div>
          {loading ? (
            <p className="state-panel" role="status">Loading courses…</p>
          ) : error ? (
            <div className="state-panel error" role="alert">
              <p>{error}</p>
              <button onClick={() => setAttempt((current) => current + 1)}>Retry</button>
            </div>
          ) : courses.length === 0 ? (
            <p className="state-panel">No courses have been imported yet. Follow the database import steps in the project README.</p>
          ) : filteredCourses.length === 0 ? (
            <div className="state-panel">
              <p>No courses match “{query}”. Try a different name or code.</p>
              <button onClick={() => setQuery('')}>Clear search</button>
            </div>
          ) : (
            <div className="course-grid">
              {filteredCourses.map((course) => <CourseCard key={course.code} course={course} />)}
            </div>
          )}
        </section>
      </main>
      <footer>2026–2027 roadmap sample · Planning aid, not official enrollment approval.</footer>
    </div>
  );
}
