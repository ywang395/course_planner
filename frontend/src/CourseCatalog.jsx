import { useMemo } from 'react';
import { groupCatalog } from './catalog.js';
import { CATALOG_SOURCE, DEGREE_UNITS, TOTAL_UNITS } from './requirements.js';

function unitLabel(unit) {
  if (!(unit > 0)) return 'Units not published';
  return `${unit} ${unit === 1 ? 'unit' : 'units'}`;
}

// Courses of one subject. completed includes classes covered through
// prerequisites; coveredBy maps those to the class that covers them.
function CatalogList({ courses, completed, coveredBy, onToggleCompleted }) {
  return (
    <ul className="catalog-list">
      {courses.map((course) => {
        const checkboxId = `catalog-completed-${course.code.replace(/\s+/g, '-')}`;
        const done = completed.includes(course.code);
        const via = coveredBy.get(course.code);
        return (
          <li key={course.code} className={`catalog-row${done ? ' is-completed' : ''}`}>
            <div className="rank-body">
              <div className="rank-head">
                <span className="course-code">{course.code}</span>
                {done && <span className="badge">{via ? `Covered by ${via}` : 'Completed'}</span>}
              </div>
              <p className="rank-name">{course.name}</p>
              <label className="check-label" htmlFor={checkboxId}>
                <input id={checkboxId} type="checkbox" checked={done} disabled={Boolean(via)} onChange={() => onToggleCompleted(course.code)} />
                {via ? `Completed (prerequisite of ${via})` : 'Completed'}
              </label>
            </div>
            <span className="catalog-units">{unitLabel(course.unit)}</span>
          </li>
        );
      })}
    </ul>
  );
}

// The catalog's summary of degree units.
function DegreeUnits() {
  return (
    <section className="panel degree-units" aria-labelledby="degree-units-title">
      <h2 id="degree-units-title">Units to graduate <span className="panel-count">({TOTAL_UNITS})</span></h2>
      <p className="panel-hint">
        From the {CATALOG_SOURCE}. Classes used for the major need a C- or better, and at least 40 of the {TOTAL_UNITS} units
        must be upper division, including 18 in the major.
      </p>
      <dl className="unit-summary">
        {DEGREE_UNITS.map(({ label, units }) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{units}</dd>
          </div>
        ))}
        <div className="unit-total">
          <dt>Total</dt>
          <dd>{TOTAL_UNITS}</dd>
        </div>
      </dl>
    </section>
  );
}

// Every catalog course in two panels, lower and upper division, each split into
// GE, Major, Elective, and Other sections of collapsed subjects. Each section
// states how many units it needs toward graduation.
export default function CourseCatalog({ courses, completed, implied = [], onToggleCompleted }) {
  const divisions = useMemo(() => groupCatalog(courses), [courses]);
  const coveredBy = new Map(implied.map((entry) => [entry.code, entry.via]));

  return (
    <>
    <DegreeUnits />
    <div className="catalog-grid">
      {divisions.map((division) => (
        <section key={division.id} className="panel" aria-labelledby={`division-${division.id}`}>
          <h2 id={`division-${division.id}`}>{division.title} <span className="panel-count">({division.count})</span></h2>
          <p className="panel-hint">{division.hint}</p>
          {division.categories.map((group) => (
            <section key={group.id} className="category" aria-labelledby={`${division.id}-category-${group.id}`}>
              <h3 id={`${division.id}-category-${group.id}`} className="category-title">{group.title}</h3>
              <p className="requirement-note"><strong>{group.requirement.needed}</strong> {group.requirement.detail}</p>
              {group.subjects.length === 0 ? (
                <p className="panel-empty">No {division.id}-division {group.label} classes in the catalog.</p>
              ) : (
                group.subjects.map(({ subject, rows }) => (
                  <details key={subject} className="subject-group">
                    <summary>
                      <span className="subject-name">{subject}</span>
                      <span className="subject-count">{rows.length} {rows.length === 1 ? 'class' : 'classes'}</span>
                    </summary>
                    <CatalogList courses={rows} completed={completed} coveredBy={coveredBy} onToggleCompleted={onToggleCompleted} />
                  </details>
                ))
              )}
            </section>
          ))}
        </section>
      ))}
    </div>
    </>
  );
}
