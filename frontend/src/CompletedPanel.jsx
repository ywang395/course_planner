import { useState } from 'react';
import { normalizeCode, validateCode } from './completed.js';

// Summary of completed classes plus a free-text form that also accepts
// off-catalog prerequisite codes (e.g. MATH 19).
export default function CompletedPanel({
  completed,
  implied = [],
  knownCodes = [],
  courseNames = {},
  storageAvailable = true,
  lastCleared = null,
  onAdd,
  onRemove,
  onClear,
  onUndoClear,
}) {
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const covered = new Set(implied.map((entry) => entry.code));
  const suggestions = knownCodes.filter((code) => !completed.includes(code) && !covered.has(code));

  function handleSubmit(event) {
    event.preventDefault();
    const message = validateCode(draft, completed);
    setError(message);
    if (message) return;
    onAdd(normalizeCode(draft));
    setDraft('');
  }

  return (
    <section className="panel" aria-labelledby="completed-title">
      <h2 id="completed-title">Completed classes <span className="panel-count">({completed.length})</span></h2>
      <p className="panel-hint">Add any code below, including prerequisites outside this catalog such as MATH 19, or tick <strong>Completed</strong> on a ranked class.</p>

      <form className="add-form" onSubmit={handleSubmit} noValidate>
        <label htmlFor="completed-input">Add a completed class</label>
        <div className="inline-field">
          <input
            id="completed-input"
            type="text"
            list="known-course-codes"
            autoComplete="off"
            placeholder="e.g. CS 46A"
            value={draft}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={error ? 'completed-error' : undefined}
            onChange={(event) => { setDraft(event.target.value); if (error) setError(''); }}
          />
          <button type="submit">Add</button>
        </div>
        <datalist id="known-course-codes">
          {suggestions.map((code) => <option key={code} value={code}>{courseNames[code] ?? 'Referenced prerequisite'}</option>)}
        </datalist>
        {error && <p id="completed-error" className="field-error" role="alert">{error}</p>}
      </form>

      {completed.length > 0 ? (
        <>
          <ul className="chip-list" aria-label="Completed classes">
            {completed.map((code) => (
              <li key={code} className="chip">
                <span title={courseNames[code] ?? 'Not in catalog'}>{code}</span>
                <button type="button" className="chip-remove" aria-label={`Remove ${code} from completed classes`} onClick={() => onRemove(code)}>×</button>
              </li>
            ))}
          </ul>
          <button type="button" className="secondary" onClick={onClear}>Clear all</button>
        </>
      ) : (
        <p className="panel-empty">No completed classes yet.</p>
      )}

      {implied.length > 0 && (
        <div className="implied">
          <h3 className="implied-title">Also counted as completed <span className="panel-count">({implied.length})</span></h3>
          <p className="panel-hint">Prerequisites of your completed classes, including alternatives you may not have taken. Remove the class that covers one to undo it.</p>
          <ul className="chip-list" aria-label="Classes counted as completed through prerequisites">
            {implied.map(({ code, via }) => (
              <li key={code} className="chip implied-chip" title={courseNames[code] ?? 'Not in catalog'}>
                {code}<span className="chip-via">via {via}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div role="status">
        {lastCleared && lastCleared.length > 0 && completed.length === 0 && (
          <p className="panel-hint">
            Cleared {lastCleared.length} {lastCleared.length === 1 ? 'class' : 'classes'}.{' '}
            <button type="button" className="link-button" onClick={onUndoClear}>Undo</button>
          </p>
        )}
      </div>
      {!storageAvailable && (
        <p className="panel-hint warning">This browser isn't saving your selection, so it will reset when you reload the page.</p>
      )}
    </section>
  );
}
