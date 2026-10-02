import { describe, expect, it } from 'vitest';
import { divisionOf, groupCatalog } from './catalog.js';
import { DEGREE_UNITS, TOTAL_UNITS } from './requirements.js';

const courses = [
  { code: 'CS 146', category: 'Major' },
  { code: 'CS 46A', category: 'Major' },
  { code: 'CS 100W', category: 'Major' },
  { code: 'CS 49C', category: 'Elective' },
  { code: 'CS 157B', category: 'Elective' },
  { code: 'MATH 203', category: 'Elective' },
  { code: 'MATH 30', category: 'Major' },
  { code: 'ENGL 1A', category: 'GE' },
  { code: 'CMPE 102', category: 'Other' },
  { code: 'MATH 19', category: 'Other' },
];

function codes(category) {
  return category.subjects.map(({ subject, rows }) => `${subject}: ${rows.map((row) => row.code).join(', ')}`);
}

describe('divisionOf', () => {
  it('splits at course number 100', () => {
    expect(divisionOf('CS 49C')).toBe('lower');
    expect(divisionOf('MATH 1')).toBe('lower');
    expect(divisionOf('CS 100W')).toBe('upper');
    expect(divisionOf('cs 146')).toBe('upper');
  });
  it('lists graduate courses as upper division', () => {
    expect(divisionOf('MATH 203')).toBe('upper');
  });
});

describe('groupCatalog', () => {
  const [lower, upper] = groupCatalog(courses);

  it('returns lower- and upper-division panels with course counts', () => {
    expect([lower.id, upper.id]).toEqual(['lower', 'upper']);
    expect(lower.count).toBe(5);
    expect(upper.count).toBe(5);
  });

  it('orders sections GE, Major, Elective, Other', () => {
    expect(lower.categories.map((category) => category.id)).toEqual(['GE', 'Major', 'Elective', 'Other']);
    expect(upper.categories.map((category) => category.id)).toEqual(['GE', 'Major', 'Elective', 'Other']);
  });

  it('groups each section by subject alphabetically, courses in natural code order', () => {
    const [lowerGe, lowerMajor, lowerElective, lowerOther] = lower.categories;
    expect(codes(lowerGe)).toEqual(['ENGL: ENGL 1A']);
    expect(codes(lowerMajor)).toEqual(['CS: CS 46A', 'MATH: MATH 30']);
    expect(codes(lowerElective)).toEqual(['CS: CS 49C']);
    expect(codes(lowerOther)).toEqual(['MATH: MATH 19']);

    const [upperGe, upperMajor, upperElective, upperOther] = upper.categories;
    expect(codes(upperGe)).toEqual([]);
    expect(codes(upperMajor)).toEqual(['CS: CS 100W, CS 146']);
    expect(codes(upperElective)).toEqual(['CS: CS 157B', 'MATH: MATH 203']);
    expect(codes(upperOther)).toEqual(['CMPE: CMPE 102']);
  });

  it('attaches the units each section needs to graduate', () => {
    for (const category of [...lower.categories, ...upper.categories]) {
      expect(category.requirement.needed).toBeTruthy();
      expect(category.requirement.detail).toBeTruthy();
    }
    expect(lower.categories[0].requirement.needed).toBe('Need 24 units.');
    expect(lower.categories[1].requirement.needed).toBe('Need 32 units.');
    expect(upper.categories[0].requirement.needed).toBe('Need 6 units.');
    expect(upper.categories[1].requirement.needed).toBe('Need 33 units.');
    expect(upper.categories[2].requirement.needed).toContain('17 units');
    expect(lower.categories[3].requirement.needed).toBe('Not required.');
  });

  it('keeps empty sections so every panel shows all four', () => {
    const [emptyLower] = groupCatalog([{ code: 'CS 146', category: 'Major' }]);
    expect(emptyLower.count).toBe(0);
    expect(emptyLower.categories).toHaveLength(4);
    expect(emptyLower.categories.every((category) => category.subjects.length === 0)).toBe(true);
  });
});

describe('degree units', () => {
  it('add up to the catalog total', () => {
    expect(DEGREE_UNITS.reduce((sum, { units }) => sum + units, 0)).toBe(TOTAL_UNITS);
    expect(TOTAL_UNITS).toBe(120);
  });
});
