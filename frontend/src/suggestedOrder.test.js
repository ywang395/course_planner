import { describe, expect, it } from 'vitest';
import { requiredSlots, suggestOrder } from './suggestedOrder.js';

const courses = [
  { code: 'CS 46A', name: 'Introduction to Programming', unit: 4, category: 'Major', prerequisites: ['MATH 1'] },
  { code: 'CS 46AX', name: 'Introduction to Programming', unit: 4, category: 'Major', prerequisites: [] },
  { code: 'CS 46B', name: 'Introduction to Data Structures', unit: 4, category: 'Major', prerequisites: ['CS 46A', 'CS 46AX', 'CS 46AW', 'MATH 19'] },
  { code: 'CS 100W', name: 'Technical Writing Workshop', unit: 3, category: 'Major', prerequisites: [], prerequisiteNotes: 'Upper-division standing.' },
  { code: 'CS 146', name: 'Data Structures and Algorithms', unit: 3, category: 'Major', prerequisites: ['MATH 30', 'MATH 42', 'CS 46B', 'CS 49J', 'CS 48'] },
  { code: 'CS 149', name: 'Operating Systems', unit: 3, category: 'Major', prerequisites: ['CS 146', 'CMPE 102'] },
  { code: 'MATH 30', name: 'Calculus I', unit: 3, category: 'Major', prerequisites: ['MATH 19'] },
  { code: 'MATH 31', name: 'Calculus II', unit: 4, category: 'Major', prerequisites: ['MATH 30', 'MATH 30X'] },
  { code: 'MATH 42', name: 'Discrete Mathematics', unit: 3, category: 'Major', prerequisites: ['MATH 19'] },
  { code: 'MATH 32', name: 'Calculus III', unit: 3, category: 'Major', prerequisites: ['MATH 31'] },
  { code: 'MATH 142', name: 'Introduction to Combinatorics', unit: 3, category: 'Major', prerequisites: ['MATH 31', 'MATH 42'] },
  { code: 'PHIL 134', name: 'Computers, Ethics and Society', unit: 3, category: 'Major', prerequisites: [] },
  { code: 'BIOL 30', name: 'Principles of Biology I', unit: 4, category: 'Major', prerequisites: ['ENGL 1A'] },
  { code: 'PHYS 50', name: 'General Physics I: Mechanics', unit: 4, category: 'Major', prerequisites: ['MATH 30'] },
  { code: 'PHYS 51', name: 'General Physics II: Electricity and Magnetism', unit: 4, category: 'Major', prerequisites: [] },
  { code: 'CS 48', name: 'Applied Algorithms', unit: 1, category: 'Elective', prerequisites: [] },
  { code: 'CS 49J', name: 'Programming in Java', unit: 3, category: 'Elective', prerequisites: [] },
  { code: 'CMPE 102', name: 'Assembly Language Programming', unit: 0, category: 'Other', prerequisites: [] },
  { code: 'ENGL 1A', name: 'First Year Writing', unit: 3, category: 'GE', prerequisites: [] },
];

const labels = (order) => order.steps.map((step) => step.map((slot) => slot.label));
const slot = (order, label) => order.steps.flat().find((entry) => entry.label === label);

describe('requiredSlots', () => {
  it('makes one slot per Major course and one per catalog choice group', () => {
    const slots = requiredSlots(courses);
    expect(slots.map((entry) => entry.label).sort()).toEqual([
      'Additional math (choose one)', 'Approved science electives', 'CS 100W', 'CS 146', 'CS 149', 'CS 46A or CS 46AX',
      'CS 46B', 'MATH 30', 'MATH 31', 'MATH 42', 'PHIL 134',
    ]);
    // Choice groups only list the courses that exist in the catalog.
    expect(slots.find((entry) => entry.id === 'additional-math').courses.map((course) => course.code)).toEqual(['MATH 32', 'MATH 142']);
  });
});

describe('suggestOrder', () => {
  it('places every class after its prerequisites, one step per layer', () => {
    expect(labels(suggestOrder(courses, []))).toEqual([
      ['Approved science electives', 'CS 46A or CS 46AX', 'CS 100W', 'MATH 30', 'MATH 42', 'PHIL 134'],
      ['CS 46B', 'MATH 31'],
      ['Additional math (choose one)', 'CS 146'],
      ['CS 149'],
    ]);
  });

  it('ignores prerequisites that are not required classes', () => {
    // CS 146 lists CS 48 and CS 49J (electives) and CS 149 lists CMPE 102 (Other).
    const order = suggestOrder(courses, ['CS 46A', 'CS 46B', 'MATH 30', 'MATH 42']);
    expect(order.steps[0].map((entry) => entry.label)).toContain('CS 146');
    expect(order.steps[1].map((entry) => entry.label)).toContain('CS 149');
  });

  it('treats either course of a choice group as finishing it', () => {
    for (const intro of ['CS 46A', 'cs 46ax']) {
      const order = suggestOrder(courses, [intro]);
      expect(slot(order, 'CS 46A or CS 46AX')).toBeUndefined();
      expect(order.steps[0].map((entry) => entry.label)).toContain('CS 46B');
      expect(order.finished).toBe(1);
    }
  });

  it('counts science units until the 8-unit slot is finished', () => {
    const partial = suggestOrder(courses, ['BIOL 30']);
    expect(slot(partial, 'Approved science electives')).toMatchObject({ unitsDone: 4, unitsNeeded: 8 });
    expect(slot(suggestOrder(courses, ['BIOL 30', 'PHYS 51']), 'Approved science electives')).toBeUndefined();
  });

  it('says which unfinished classes a later step waits for', () => {
    const order = suggestOrder(courses, ['MATH 30']);
    expect(slot(order, 'CS 146').waitingFor).toEqual(['CS 46B', 'MATH 42']);
    // A choice waits only for the prerequisites of its closest option (MATH 32 needs MATH 31).
    expect(slot(order, 'Additional math (choose one)').waitingFor).toEqual(['MATH 31']);
    expect(order.steps[0].every((entry) => entry.waitingFor.length === 0)).toBe(true);
  });

  it('flags classes without any recorded prerequisites or notes', () => {
    const order = suggestOrder(courses, []);
    expect(slot(order, 'PHIL 134').unrecorded).toBe(true);
    expect(slot(order, 'CS 100W').unrecorded).toBe(false);
    expect(slot(order, 'Approved science electives').unrecorded).toBe(false);
  });

  it('reports progress and an empty order when everything is done', () => {
    const all = ['CS 46A', 'CS 46B', 'CS 100W', 'CS 146', 'CS 149', 'MATH 30', 'MATH 31', 'MATH 42', 'MATH 32', 'PHIL 134', 'BIOL 30', 'PHYS 50'];
    const order = suggestOrder(courses, all);
    expect(order).toMatchObject({ steps: [], blocked: [], finished: 11, total: 11 });
  });

  it('returns classes in a prerequisite loop as blocked', () => {
    const loop = [
      { code: 'CS 1', unit: 3, category: 'Major', prerequisites: ['CS 2'] },
      { code: 'CS 2', unit: 3, category: 'Major', prerequisites: ['CS 1'] },
      { code: 'CS 3', unit: 3, category: 'Major', prerequisites: [] },
    ];
    const order = suggestOrder(loop, []);
    expect(labels(order)).toEqual([['CS 3']]);
    expect(order.blocked).toEqual(['CS 1', 'CS 2']);
  });
});
