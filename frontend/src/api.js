import { buildFrequencyQuery, computePrerequisiteFrequency } from './prerequisiteFrequency.js';

// Error with the HTTP status attached so callers can react to specific codes (e.g. 404).
export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// Reads an application/problem+json body (detail and validation errors) when present.
async function problemDetail(response) {
  try {
    const body = await response.json();
    const errors = Array.isArray(body?.errors)
      ? body.errors.map((item) => (typeof item === 'string' ? item : item?.message ?? item?.defaultMessage)).filter(Boolean)
      : [];
    const detail = typeof body?.detail === 'string' ? body.detail : '';
    if (errors.length === 0) return detail;
    return `${detail ? `${detail}: ` : ''}${errors.join('; ')}`;
  } catch {
    return '';
  }
}

export async function getCourses(signal) {
  const response = await fetch('/api/courses', { signal });

  if (!response.ok) {
    throw new ApiError(`Could not load courses (HTTP ${response.status}). Check that Spring Boot and PostgreSQL are running, then retry.`, response.status);
  }

  const courses = await response.json();
  if (!Array.isArray(courses)) {
    throw new Error('The API returned an unexpected response instead of a course list.');
  }

  return courses;
}

// GET /api/courses/prerequisite-frequency?completed=...&completed=...
export async function getPrerequisiteFrequency(completed = [], signal) {
  const response = await fetch(`/api/courses/prerequisite-frequency${buildFrequencyQuery(completed)}`, { signal });

  if (!response.ok) {
    const message = response.status === 404
      ? 'The prerequisite ranking endpoint was not found (HTTP 404). Restart Spring Boot with the latest backend code.'
      : `Could not load the prerequisite ranking (HTTP ${response.status}). Check that Spring Boot and PostgreSQL are running, then retry.`;
    throw new ApiError(message, response.status);
  }

  const rows = await response.json();
  if (!Array.isArray(rows)) {
    throw new Error('The API returned an unexpected response instead of a prerequisite ranking.');
  }

  return rows;
}

// Loads the ranking from the backend. If the endpoint is missing (HTTP 404, e.g. an
// older backend build), computes the same ranking in the browser from the catalog.
export async function getPrerequisiteRanking(completed, courses, signal) {
  try {
    return { rows: await getPrerequisiteFrequency(completed, signal), source: 'api' };
  } catch (failure) {
    if (failure instanceof ApiError && failure.status === 404 && courses?.length > 0) {
      return { rows: computePrerequisiteFrequency(courses, completed), source: 'browser' };
    }
    throw failure;
  }
}

// POST /api/plans with { semester, maxUnits, courseCodes }. Resolves to the saved plan.
export async function createPlan({ semester, maxUnits, courseCodes = [] }, signal) {
  const response = await fetch('/api/plans', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ semester, maxUnits, courseCodes }),
    signal,
  });

  if (!response.ok) {
    const detail = await problemDetail(response);
    throw new ApiError(`Could not save the plan (HTTP ${response.status}).${detail ? ` ${detail}` : ''}`, response.status);
  }

  return response.json();
}
