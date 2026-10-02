import { useMemo } from 'react';
import { suggestOrder } from './suggestedOrder.js';

// One required slot: a class, or a catalog choice listing its options.
function SlotCard({ slot, completed, coveredBy, onToggleCompleted }) {
  const single = slot.courses.length === 1 && !slot.unitsNeeded;
  return (
    <li className="order-slot">
      <div className="order-slot-head">
        <span className="course-code">{slot.label}</span>
        {slot.unitsNeeded && <span className="subject-count">{slot.unitsDone} of {slot.unitsNeeded} units</span>}
        {slot.unrecorded && <span className="tag">Prerequisites not recorded</span>}
      </div>
      {single && <p className="rank-name">{slot.courses[0].name}</p>}
      {slot.waitingFor.length > 0 && <p className="order-note">After {slot.waitingFor.join(', ')}</p>}
      {slot.detail && <p className="order-note">{slot.detail}</p>}
      <ul className="order-options">
        {slot.courses.map((course) => {
          const checkboxId = `order-completed-${course.code.replace(/\s+/g, '-')}`;
          const via = coveredBy.get(course.code);
          return (
            <li key={course.code}>
              <label className="check-label" htmlFor={checkboxId}>
                <input id={checkboxId} type="checkbox" checked={completed.includes(course.code)} disabled={Boolean(via)} onChange={() => onToggleCompleted(course.code)} />
                {single ? 'Completed' : `${course.code} · ${course.name}`}
              </label>
            </li>
          );
        })}
      </ul>
    </li>
  );
}

// Remaining required major classes in prerequisite order (a topological sort),
// one column per step. completed includes classes covered through prerequisites.
export default function SuggestedOrder({ courses, completed, implied = [], onToggleCompleted }) {
  const order = useMemo(() => suggestOrder(courses, completed), [courses, completed]);
  const coveredBy = new Map(implied.map((entry) => [entry.code, entry.via]));

  return (
    <section className="panel suggested-order" aria-labelledby="order-title">
      <div className="panel-heading">
        <h2 id="order-title">Suggested order</h2>
        <span className="panel-count">{order.finished} of {order.total} required done</span>
      </div>
      <p className="panel-hint">
        Your remaining required major classes, sorted so each one comes after its prerequisites. Steps follow prerequisites,
        not semesters. Only course prerequisites are checked; placement, class standing, and major restrictions are not.
        Electives and GE are not placed here because most electives have no prerequisites recorded.
      </p>
      {order.steps.length === 0 && order.blocked.length === 0 ? (
        <p className="panel-empty">You've completed every required major class.</p>
      ) : (
        <ol className="order-steps">
          {order.steps.map((step, index) => (
            <li key={step[0].id} className="order-step">
              <h3 className="category-title">
                {index === 0 ? 'Step 1 · Available now' : `Step ${index + 1}`}
                <span className="subject-count">{step.length} {step.length === 1 ? 'class' : 'classes'}</span>
              </h3>
              <ul className="order-slots">
                {step.map((slot) => (
                  <SlotCard key={slot.id} slot={slot} completed={completed} coveredBy={coveredBy} onToggleCompleted={onToggleCompleted} />
                ))}
              </ul>
            </li>
          ))}
        </ol>
      )}
      {order.blocked.length > 0 && (
        <p className="panel-hint warning">These classes could not be ordered because their prerequisites form a loop: {order.blocked.join(', ')}.</p>
      )}
    </section>
  );
}
