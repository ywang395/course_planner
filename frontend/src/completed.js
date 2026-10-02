// Pure helpers for the "completed classes" selection. No React here so each
// function can be unit tested on its own.

export const STORAGE_KEY = 'course-planner.completed.v1';

// Subject letters, one space, then a course number with an optional letter suffix
// (e.g. "CS 46A", "MATH 19", "CMPE 102"). "CS146" is a different code in the API.
const CODE_PATTERN = /^[A-Z]{2,6} \d{1,3}[A-Z]{0,2}$/;

// Matches the backend: trim, collapse repeated whitespace, uppercase.
export function normalizeCode(value) {
  return String(value ?? '').trim().replace(/\s+/g, ' ').toUpperCase();
}

// Returns an error message for the input, or '' when the code can be added.
export function validateCode(value, completed = []) {
  const code = normalizeCode(value);
  if (!code) return 'Enter a course code, such as MATH 19.';
  if (!CODE_PATTERN.test(code)) {
    return `“${code}” doesn't look like a course code. Use the subject, a space, then the number (for example CS 46A).`;
  }
  if (completed.includes(code)) return `${code} is already marked as completed.`;
  return '';
}

// Natural order so "CS 47" comes before "CS 146".
export function sortCodes(codes) {
  return [...codes].sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
}

export function addCompleted(completed, value) {
  const code = normalizeCode(value);
  if (!code || completed.includes(code)) return completed;
  return sortCodes([...completed, code]);
}

export function removeCompleted(completed, value) {
  const code = normalizeCode(value);
  return completed.includes(code) ? completed.filter((item) => item !== code) : completed;
}

export function toggleCompleted(completed, value) {
  const code = normalizeCode(value);
  return completed.includes(code) ? removeCompleted(completed, code) : addCompleted(completed, code);
}

// Every catalog code plus every code referenced in a prerequisite list, for suggestions.
export function collectKnownCodes(courses = []) {
  const codes = new Set();
  for (const course of courses) {
    const own = normalizeCode(course?.code);
    if (own) codes.add(own);
    for (const reference of course?.prerequisites ?? []) {
      const code = normalizeCode(reference);
      if (code) codes.add(code);
    }
  }
  return sortCodes(codes);
}

// Prerequisites of completed classes count as completed too, transitively
// (CS 146 -> CS 46B -> CS 46A ...). Returns [{ code, via }] sorted by code,
// where via is the explicitly completed class that covers it. Explicitly
// completed codes are not repeated. Prerequisite lists include alternatives,
// so every listed alternative is covered, not only the one actually taken.
export function impliedCompleted(completed = [], courses = []) {
  const prerequisites = new Map(courses.map((course) => [normalizeCode(course.code), course.prerequisites ?? []]));
  const explicit = new Set(completed.map(normalizeCode));
  const via = new Map();

  for (const root of sortCodes(explicit)) {
    const queue = [root];
    const seen = new Set([root]);
    while (queue.length > 0) {
      for (const reference of prerequisites.get(queue.shift()) ?? []) {
        const code = normalizeCode(reference);
        if (!code || seen.has(code)) continue;
        seen.add(code);
        queue.push(code);
        if (!explicit.has(code) && !via.has(code)) via.set(code, root);
      }
    }
  }

  return sortCodes(via.keys()).map((code) => ({ code, via: via.get(code) }));
}

// localStorage can throw (private mode, disabled storage, sandboxed iframes).
export function getStorage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function loadCompleted(storage = getStorage()) {
  if (!storage) return [];
  try {
    const parsed = JSON.parse(storage.getItem(STORAGE_KEY) ?? '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.reduce((list, value) => (typeof value === 'string' ? addCompleted(list, value) : list), []);
  } catch {
    return [];
  }
}

// Returns true when saved, false when the browser refused.
export function saveCompleted(completed, storage = getStorage()) {
  if (!storage) return false;
  try {
    if (completed.length === 0) storage.removeItem(STORAGE_KEY);
    else storage.setItem(STORAGE_KEY, JSON.stringify(completed));
    return true;
  } catch {
    return false;
  }
}
