import { normalizeCode } from './completed.js';

// Builds "?completed=CS%2046A&completed=MATH%2019" (or '' when nothing is completed).
// encodeURIComponent is used instead of URLSearchParams so spaces become %20, not '+'.
export function buildFrequencyQuery(completed = []) {
  const codes = [...new Set(completed.map(normalizeCode).filter(Boolean))];
  if (codes.length === 0) return '';
  return `?${codes.map((code) => `completed=${encodeURIComponent(code)}`).join('&')}`;
}

// Same ordering as the backend: remainingCount desc, count desc, code asc.
export function compareRankingRows(a, b) {
  return (b.remainingCount - a.remainingCount)
    || (b.count - a.count)
    || (a.code < b.code ? -1 : a.code > b.code ? 1 : 0);
}

// Client-side fallback that mirrors GET /api/courses/prerequisite-frequency.
// Used only when the backend endpoint is unavailable (HTTP 404).
export function computePrerequisiteFrequency(courses = [], completed = []) {
  const done = new Set(completed.map(normalizeCode));
  const catalog = new Map(courses.map((course) => [normalizeCode(course.code), course]));
  const referencedBy = new Map();

  for (const course of courses) {
    const courseCode = normalizeCode(course.code);
    const references = new Set((course.prerequisites ?? []).map(normalizeCode).filter(Boolean));
    for (const code of references) {
      if (!referencedBy.has(code)) referencedBy.set(code, new Set());
      referencedBy.get(code).add(courseCode);
    }
  }

  return [...referencedBy].map(([code, courseCodes]) => {
    const requiredBy = [...courseCodes].sort();
    const entry = catalog.get(code);
    return {
      code,
      name: entry?.name ?? null,
      unit: entry?.unit ?? null,
      inCatalog: Boolean(entry),
      completed: done.has(code),
      count: requiredBy.length,
      remainingCount: requiredBy.filter((courseCode) => !done.has(courseCode)).length,
      requiredBy,
    };
  }).sort(compareRankingRows);
}

// Subject prefix of a course code: "CS 46A" -> "CS", "math 30p" -> "MATH".
export function subjectOf(code) {
  return normalizeCode(code).match(/^[A-Z]+/)?.[0] ?? '';
}

// Fallback for courses without a category from the backend: the seeded roadmap
// descriptions tag general-education courses with "GE Area ...".
const GE_PATTERN = /\bGE\b/;
const CATEGORY_IDS = ['Major', 'GE', 'Elective'];

// "Major", "GE", or "Elective" for a code, from the course's category. Off-catalog
// variants inherit from the longest catalog code they extend ("ENGL 1AF" ->
// "ENGL 1A", "MATH 30PL" -> "MATH 30"); anything else unknown is a major class.
export function classifyCourse(code, courses = []) {
  const catalog = new Map(courses.map((course) => [normalizeCode(course.code), course]));
  let candidate = normalizeCode(code);
  while (candidate && !catalog.has(candidate) && /[A-Z]$/.test(candidate)) {
    candidate = candidate.slice(0, -1);
  }
  const course = catalog.get(candidate);
  if (CATEGORY_IDS.includes(course?.category)) return course.category;
  return GE_PATTERN.test(course?.description ?? '') ? 'GE' : 'Major';
}

const CATEGORIES = [
  { id: 'Major', title: 'Major classes', label: 'major' },
  { id: 'GE', title: 'GE classes', label: 'GE' },
  { id: 'Elective', title: 'Elective classes', label: 'elective' },
];

// Splits ranked rows into Major, GE, and Elective sections, each holding its subjects in
// alphabetical order. Rows keep their rank order within a subject; empty
// subjects are dropped.
export function groupRanking(rows = [], courses = []) {
  return CATEGORIES.map(({ id, title, label }) => {
    const subjects = new Map();
    for (const row of rows) {
      if (classifyCourse(row.code, courses) !== id) continue;
      const subject = subjectOf(row.code);
      if (!subjects.has(subject)) subjects.set(subject, []);
      subjects.get(subject).push(row);
    }
    return {
      id,
      title,
      label,
      subjects: [...subjects]
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
        .map(([subject, subjectRows]) => ({ subject, rows: subjectRows })),
    };
  });
}

// Optionally hides completed rows. The completed flag is recomputed from the
// current selection so rows never show a stale state while a refetch is pending.
export function prepareRanking(rows = [], completed = [], { hideCompleted = false } = {}) {
  const done = new Set(completed.map(normalizeCode));
  return rows
    .map((row) => ({ ...row, completed: done.has(normalizeCode(row.code)) }))
    .filter((row) => !hideCompleted || !row.completed);
}
