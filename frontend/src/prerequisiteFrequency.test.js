import { describe, expect, it } from 'vitest';
import {
  buildFrequencyQuery,
  compareRankingRows,
  computePrerequisiteFrequency,
  classifyCourse,
  groupRanking,
  prepareRanking,
  subjectOf,
} from './prerequisiteFrequency.js';

const courses = [
  { code: 'CS 46B', name: 'Introduction to Data Structures', unit: 4, prerequisites: ['CS 46A'] },
  { code: 'CS 146', name: 'Data Structures and Algorithms', unit: 3, prerequisites: ['MATH 30', 'MATH 42', 'CS 46B', 'CS 49J'] },
  { code: 'CS 149', name: 'Operating Systems', unit: 3, prerequisites: ['CS 146', 'CS 47', 'CMPE 102'] },
  { code: 'CS 157A', name: 'Introduction to Database Management Systems', unit: 3, prerequisites: ['CS 146', 'CS 146'] },
  { code: 'CS 160', name: 'Software Engineering', unit: 3, prerequisites: ['CS 146', 'CS 151'] },
  { code: 'CS 151', name: 'Object-Oriented Design', unit: 3, prerequisites: ['CS 46B', 'CS 49J'] },
];

describe('buildFrequencyQuery', () => {
  it('returns an empty string when nothing is completed', () => {
    expect(buildFrequencyQuery()).toBe('');
    expect(buildFrequencyQuery([])).toBe('');
    expect(buildFrequencyQuery(['  '])).toBe('');
  });
  it('repeats the completed parameter and encodes spaces as %20', () => {
    expect(buildFrequencyQuery(['CS 46A', 'MATH 19'])).toBe('?completed=CS%2046A&completed=MATH%2019');
  });
  it('normalizes and dedupes codes', () => {
    expect(buildFrequencyQuery(['cs  46a', 'CS 46A'])).toBe('?completed=CS%2046A');
  });
  it('encodes reserved characters', () => {
    expect(buildFrequencyQuery(['A&B 1'])).toBe('?completed=A%26B%201');
  });
});

describe('compareRankingRows', () => {
  it('orders by remainingCount desc, then count desc, then code asc', () => {
    const rows = [
      { code: 'B', remainingCount: 1, count: 3 },
      { code: 'A', remainingCount: 1, count: 3 },
      { code: 'C', remainingCount: 2, count: 2 },
      { code: 'D', remainingCount: 1, count: 4 },
    ];
    expect(rows.sort(compareRankingRows).map((row) => row.code)).toEqual(['C', 'D', 'A', 'B']);
  });
});

describe('computePrerequisiteFrequency', () => {
  it('counts each referencing course once and sorts like the backend', () => {
    const rows = computePrerequisiteFrequency(courses);
    expect(rows[0]).toEqual({
      code: 'CS 146', name: 'Data Structures and Algorithms', unit: 3, inCatalog: true,
      completed: false, count: 3, remainingCount: 3, requiredBy: ['CS 149', 'CS 157A', 'CS 160'],
    });
    expect(rows.map((row) => row.code).slice(0, 3)).toEqual(['CS 146', 'CS 46B', 'CS 49J']);
  });
  it('marks off-catalog references with null name and unit', () => {
    const math = computePrerequisiteFrequency(courses).find((row) => row.code === 'MATH 30');
    expect(math).toMatchObject({ name: null, unit: null, inCatalog: false, count: 1, requiredBy: ['CS 146'] });
  });
  it('uses completed codes for the completed flag and remainingCount', () => {
    const rows = computePrerequisiteFrequency(courses, ['cs 157a', 'CS 146']);
    const cs146 = rows.find((row) => row.code === 'CS 146');
    expect(cs146).toMatchObject({ completed: true, count: 3, remainingCount: 2 });
    // CS 46B is referenced by CS 146 (completed) and CS 151 (not completed).
    expect(rows.find((row) => row.code === 'CS 46B')).toMatchObject({ count: 2, remainingCount: 1 });
    // Remaining count now drives the order.
    expect(rows[0].code).toBe('CS 146');
    expect(rows[1].code).toBe('CS 46B');
  });
  it('returns [] for an empty catalog or courses without prerequisites', () => {
    expect(computePrerequisiteFrequency()).toEqual([]);
    expect(computePrerequisiteFrequency([{ code: 'CS 46A', prerequisites: null }])).toEqual([]);
  });
});

describe('prepareRanking', () => {
  const rows = [
    { code: 'CS 146', completed: false, count: 4, remainingCount: 4 },
    { code: 'MATH 19', completed: true, count: 2, remainingCount: 2 },
  ];
  it('recomputes the completed flag from the current selection', () => {
    expect(prepareRanking(rows, ['cs 146']).map((row) => row.completed)).toEqual([true, false]);
  });
  it('hides completed rows when requested', () => {
    expect(prepareRanking(rows, ['CS 146'], { hideCompleted: true }).map((row) => row.code)).toEqual(['MATH 19']);
  });
  it('keeps every row by default and does not mutate input', () => {
    const result = prepareRanking(rows, ['CS 146']);
    expect(result).toHaveLength(2);
    expect(rows[0].completed).toBe(false);
  });
});

describe('subjectOf', () => {
  it('returns the normalized letter prefix of a code', () => {
    expect(subjectOf('CS 46A')).toBe('CS');
    expect(subjectOf(' math  30p ')).toBe('MATH');
    expect(subjectOf('CMPE 102')).toBe('CMPE');
    expect(subjectOf('')).toBe('');
  });
});

const geCatalog = [
  { code: 'MATH 30', description: 'Roadmap: Year 1 Fall; GE Area 2.' },
  { code: 'MATH 42', description: 'Roadmap: Year 1 Spring.' },
  { code: 'ENGL 1A', description: 'Roadmap: recommended GE Area 1A option.' },
  { code: 'CS 46A', description: 'Roadmap: Year 1 Fall.' },
  { code: 'CS 146', description: null },
];

describe('classifyCourse', () => {
  it('uses the GE tag in the catalog description', () => {
    expect(classifyCourse('MATH 30', geCatalog)).toBe('GE');
    expect(classifyCourse('ENGL 1A', geCatalog)).toBe('GE');
    expect(classifyCourse('MATH 42', geCatalog)).toBe('Major');
    expect(classifyCourse('CS 146', geCatalog)).toBe('Major');
  });
  it('lets off-catalog variants inherit from the catalog code they extend', () => {
    expect(classifyCourse('ENGL 1AF', geCatalog)).toBe('GE');
    expect(classifyCourse('MATH 30PL', geCatalog)).toBe('GE');
    expect(classifyCourse('CS 46AX', geCatalog)).toBe('Major');
  });
  it('treats unknown codes as major classes and does not match GE inside words', () => {
    expect(classifyCourse('CMPE 102', geCatalog)).toBe('Major');
    expect(classifyCourse('GEOL 9', [{ code: 'GEOL 9', description: 'General Geology' }])).toBe('Major');
  });
});

describe('classifyCourse with backend categories', () => {
  const catalog = [
    { code: 'CS 48', category: 'Elective', description: null },
    { code: 'MATH 30', category: 'GE', description: 'no tag here' },
    { code: 'CS 146', category: 'Major', description: 'mentions GE but is Major' },
    { code: 'ENGL 1A', category: null, description: 'GE Area 1A.' },
  ];
  it('prefers the category field over the description', () => {
    expect(classifyCourse('CS 48', catalog)).toBe('Elective');
    expect(classifyCourse('MATH 30', catalog)).toBe('GE');
    expect(classifyCourse('CS 146', catalog)).toBe('Major');
  });
  it('falls back to the description tag and inherits for variants', () => {
    expect(classifyCourse('ENGL 1A', catalog)).toBe('GE');
    expect(classifyCourse('MATH 30X', catalog)).toBe('GE');
    expect(classifyCourse('CS 48X', catalog)).toBe('Elective');
  });
});

describe('groupRanking', () => {
  const rows = [
    { code: 'MATH 42' }, { code: 'CS 146' }, { code: 'MATH 30' }, { code: 'CMPE 102' },
    { code: 'CS 46A' }, { code: 'ENGL 1AF' }, { code: 'ENGL 1A' },
  ];
  it('splits rows into Major then GE, with subjects alphabetical and rank order kept', () => {
    const groups = groupRanking(rows, geCatalog);
    expect(groups.map((group) => group.title)).toEqual(['Major classes', 'GE classes', 'Elective classes', 'Other classes']);
    expect(groups[0].subjects.map(({ subject, rows: r }) => [subject, r.map((row) => row.code)])).toEqual([
      ['CMPE', ['CMPE 102']],
      ['CS', ['CS 146', 'CS 46A']],
      ['MATH', ['MATH 42']],
    ]);
    expect(groups[1].subjects.map(({ subject, rows: r }) => [subject, r.map((row) => row.code)])).toEqual([
      ['ENGL', ['ENGL 1AF', 'ENGL 1A']],
      ['MATH', ['MATH 30']],
    ]);
  });
  it('keeps all four sections even when empty', () => {
    expect(groupRanking([], geCatalog)).toEqual([
      { id: 'Major', title: 'Major classes', label: 'major', subjects: [] },
      { id: 'GE', title: 'GE classes', label: 'GE', subjects: [] },
      { id: 'Elective', title: 'Elective classes', label: 'elective', subjects: [] },
      { id: 'Other', title: 'Other classes', label: 'other', subjects: [] },
    ]);
  });
  it('puts elective courses in their own section', () => {
    const groups = groupRanking([{ code: 'CS 48' }, { code: 'CS 146' }], [...geCatalog, { code: 'CS 48', category: 'Elective' }]);
    expect(groups[2].subjects).toEqual([{ subject: 'CS', rows: [{ code: 'CS 48' }] }]);
    expect(groups[0].subjects[0].rows).toEqual([{ code: 'CS 146' }]);
  });
  it('puts courses outside the degree requirements in Other, including their variants', () => {
    const catalog = [...geCatalog, { code: 'CMPE 102', category: 'Other' }, { code: 'MATH 19', category: 'Other' }];
    const groups = groupRanking([{ code: 'CMPE 102' }, { code: 'MATH 19' }, { code: 'CS 146' }], catalog);
    expect(groups[3].subjects.map(({ subject }) => subject)).toEqual(['CMPE', 'MATH']);
    expect(classifyCourse('CMPE 102X', catalog)).toBe('Other');
    expect(groups[0].subjects[0].rows).toEqual([{ code: 'CS 146' }]);
  });
});
