import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, createPlan, getCourses, getPrerequisiteFrequency, getPrerequisiteRanking } from './api.js';

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function mockFetch(...responses) {
  const fetchMock = vi.fn();
  for (const response of responses) fetchMock.mockResolvedValueOnce(response);
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => vi.unstubAllGlobals());

describe('getCourses', () => {
  it('returns the course array and passes the abort signal', async () => {
    const fetchMock = mockFetch(jsonResponse([{ code: 'CS 146' }]));
    const { signal } = new AbortController();
    await expect(getCourses(signal)).resolves.toEqual([{ code: 'CS 146' }]);
    expect(fetchMock).toHaveBeenCalledWith('/api/courses', { signal });
  });
  it('throws an ApiError with the status on HTTP errors', async () => {
    mockFetch(jsonResponse({}, 500));
    await expect(getCourses()).rejects.toMatchObject({ name: 'ApiError', status: 500, message: expect.stringMatching(/HTTP 500/) });
  });
  it('rejects a non-array body', async () => {
    mockFetch(jsonResponse({ oops: true }));
    await expect(getCourses()).rejects.toThrow(/unexpected response/);
  });
});

describe('getPrerequisiteFrequency', () => {
  const row = { code: 'CS 146', name: 'Data Structures and Algorithms', unit: 3, inCatalog: true, completed: false, count: 4, remainingCount: 4, requiredBy: ['CS 149'] };

  it('calls the endpoint without a query when nothing is completed', async () => {
    const fetchMock = mockFetch(jsonResponse([row]));
    await expect(getPrerequisiteFrequency([])).resolves.toEqual([row]);
    expect(fetchMock.mock.calls[0][0]).toBe('/api/courses/prerequisite-frequency');
  });
  it('sends repeated completed parameters and the signal', async () => {
    const fetchMock = mockFetch(jsonResponse([]));
    const { signal } = new AbortController();
    await getPrerequisiteFrequency(['CS 46A', 'math 19'], signal);
    expect(fetchMock).toHaveBeenCalledWith('/api/courses/prerequisite-frequency?completed=CS%2046A&completed=MATH%2019', { signal });
  });
  it('explains a 404 so the caller can fall back', async () => {
    mockFetch(jsonResponse({}, 404));
    const failure = await getPrerequisiteFrequency([]).catch((error) => error);
    expect(failure).toBeInstanceOf(ApiError);
    expect(failure.status).toBe(404);
    expect(failure.message).toMatch(/endpoint was not found/);
  });
  it('reports other HTTP errors with the status', async () => {
    mockFetch(jsonResponse({}, 503));
    await expect(getPrerequisiteFrequency([])).rejects.toMatchObject({ status: 503, message: expect.stringMatching(/HTTP 503/) });
  });
  it('rejects a non-array body', async () => {
    mockFetch(jsonResponse({ rows: [] }));
    await expect(getPrerequisiteFrequency([])).rejects.toThrow(/unexpected response/);
  });
  it('propagates aborts', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new DOMException('Aborted', 'AbortError')));
    await expect(getPrerequisiteFrequency([])).rejects.toMatchObject({ name: 'AbortError' });
  });
});

describe('getPrerequisiteRanking', () => {
  const courses = [
    { code: 'CS 146', name: 'Data Structures and Algorithms', unit: 3, prerequisites: ['CS 46B'] },
    { code: 'CS 149', name: 'Operating Systems', unit: 3, prerequisites: ['CS 146'] },
    { code: 'CS 157A', name: 'Database Management Systems', unit: 3, prerequisites: ['CS 146'] },
  ];

  it('returns API rows with source "api"', async () => {
    const rows = [{ code: 'CS 146', count: 2, remainingCount: 2 }];
    const fetchMock = mockFetch(jsonResponse(rows));
    await expect(getPrerequisiteRanking(['CS 46B'], courses)).resolves.toEqual({ rows, source: 'api' });
    expect(fetchMock.mock.calls[0][0]).toBe('/api/courses/prerequisite-frequency?completed=CS%2046B');
  });
  it('falls back to a browser computation on 404', async () => {
    mockFetch(jsonResponse({}, 404));
    const result = await getPrerequisiteRanking(['CS 149'], courses);
    expect(result.source).toBe('browser');
    expect(result.rows[0]).toMatchObject({ code: 'CS 146', count: 2, remainingCount: 1, requiredBy: ['CS 149', 'CS 157A'] });
  });
  it('does not fall back without a catalog or for other errors', async () => {
    mockFetch(jsonResponse({}, 404), jsonResponse({}, 500));
    await expect(getPrerequisiteRanking([], [])).rejects.toMatchObject({ status: 404 });
    await expect(getPrerequisiteRanking([], courses)).rejects.toMatchObject({ status: 500 });
  });
  it('does not fall back on network failures', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(getPrerequisiteRanking([], courses)).rejects.toBeInstanceOf(TypeError);
  });
});

describe('createPlan', () => {
  it('POSTs the plan as JSON and returns the saved plan', async () => {
    const saved = { id: 7, semester: 'Fall 2026', maxUnits: 15, totalUnits: 6, courses: [] };
    const fetchMock = mockFetch(jsonResponse(saved, 201));
    const { signal } = new AbortController();
    await expect(createPlan({ semester: 'Fall 2026', maxUnits: 15, courseCodes: ['CS 147', 'CS 151'] }, signal)).resolves.toEqual(saved);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/plans');
    expect(init).toMatchObject({ method: 'POST', signal, headers: { 'Content-Type': 'application/json' } });
    expect(JSON.parse(init.body)).toEqual({ semester: 'Fall 2026', maxUnits: 15, courseCodes: ['CS 147', 'CS 151'] });
  });
  it('defaults courseCodes to an empty draft', async () => {
    const fetchMock = mockFetch(jsonResponse({ id: 1 }, 201));
    await createPlan({ semester: 'Spring 2027', maxUnits: 12 });
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).courseCodes).toEqual([]);
  });
  it('includes problem+json detail and validation errors in the message', async () => {
    mockFetch(new Response(JSON.stringify({ detail: 'Invalid request fields', errors: ['maxUnits: must be greater than 0', 'semester: must not be blank'] }), {
      status: 400, headers: { 'Content-Type': 'application/problem+json' },
    }));
    await expect(createPlan({ semester: 'Fall 2026', maxUnits: 0, courseCodes: [] }))
      .rejects.toMatchObject({ status: 400, message: 'Could not save the plan (HTTP 400). Invalid request fields: maxUnits: must be greater than 0; semester: must not be blank' });
  });
  it('uses the detail alone when there are no field errors', async () => {
    mockFetch(jsonResponse({ detail: 'A plan cannot contain duplicate courses' }, 400));
    await expect(createPlan({ semester: 'Fall 2026', maxUnits: 15, courseCodes: ['CS 147', 'CS 147'] }))
      .rejects.toThrow('Could not save the plan (HTTP 400). A plan cannot contain duplicate courses');
  });
  it('still reports the status when the error body is not JSON', async () => {
    mockFetch(new Response('Bad gateway', { status: 502 }));
    await expect(createPlan({ semester: 'Fall 2026', maxUnits: 15 })).rejects.toThrow('Could not save the plan (HTTP 502).');
  });
});
