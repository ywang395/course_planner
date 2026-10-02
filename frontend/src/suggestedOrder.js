import { normalizeCode } from './completed.js';
import { REQUIRED_CHOICES } from './requirements.js';

function compareLabels(a, b) {
  return a.label.localeCompare(b.label, 'en', { numeric: true });
}

// The required major classes as slots: one slot per Major course, except the
// catalog's choice groups, which are one slot each (CS 46A or CS 46AX; one
// additional math class; 8 units of science).
export function requiredSlots(courses = []) {
  const byCode = new Map(courses.map((course) => [normalizeCode(course.code), course]));
  const grouped = new Set(REQUIRED_CHOICES.flatMap((choice) => choice.courses.map(normalizeCode)));
  const choices = REQUIRED_CHOICES
    .map((choice) => ({ ...choice, courses: choice.courses.map((code) => byCode.get(normalizeCode(code))).filter(Boolean) }))
    .filter((choice) => choice.courses.length > 0);
  const singles = courses
    .filter((course) => course.category === 'Major' && !grouped.has(normalizeCode(course.code)))
    .map((course) => ({ id: normalizeCode(course.code), label: normalizeCode(course.code), courses: [course] }));
  return [...choices, ...singles];
}

function unitsDone(slot, done) {
  return slot.courses.reduce((sum, course) => sum + (done.has(normalizeCode(course.code)) ? course.unit ?? 0 : 0), 0);
}

function isDone(slot, done) {
  return slot.units
    ? unitsDone(slot, done) >= slot.units
    : slot.courses.some((course) => done.has(normalizeCode(course.code)));
}

// Topological sort of the required slots you have not finished, using Kahn's
// algorithm one layer at a time. A slot joins a step once any one of its courses
// has every prerequisite slot finished or placed in an earlier step, so each
// class comes after the classes it needs. Prerequisites that are not required
// classes (electives, GE, Other, off-catalog variants) are ignored: in this data
// they are alternative or conditional routes, such as CMPE 102 in place of CS 47.
// Slots whose prerequisites form a loop cannot be placed and are returned as
// blocked.
export function suggestOrder(courses = [], completed = []) {
  const done = new Set(completed.map(normalizeCode));
  const slots = requiredSlots(courses);
  const slotOf = new Map(slots.flatMap((slot) => slot.courses.map((course) => [normalizeCode(course.code), slot])));
  const prerequisiteSlots = (course, slot) => [...new Set((course.prerequisites ?? [])
    .map((code) => slotOf.get(normalizeCode(code)))
    .filter((other) => other && other !== slot))];

  const finished = new Set(slots.filter((slot) => isDone(slot, done)));
  const placed = new Set(finished);
  let remaining = slots.filter((slot) => !placed.has(slot));
  const steps = [];

  // The unfinished prerequisites of the course that is closest to being ready.
  function waitingFor(slot) {
    const missing = slot.courses
      .map((course) => prerequisiteSlots(course, slot).filter((other) => !finished.has(other)))
      .sort((a, b) => a.length - b.length)[0];
    return missing.map((other) => other.label).sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
  }

  function describe(slot) {
    return {
      id: slot.id,
      label: slot.label,
      detail: slot.detail ?? null,
      unitsNeeded: slot.units ?? null,
      unitsDone: slot.units ? unitsDone(slot, done) : null,
      courses: slot.courses.map((course) => ({ code: normalizeCode(course.code), name: course.name, unit: course.unit })),
      waitingFor: waitingFor(slot),
      unrecorded: slot.courses.every((course) => (course.prerequisites ?? []).length === 0 && !course.prerequisiteNotes),
    };
  }

  while (remaining.length > 0) {
    const step = remaining.filter((slot) => slot.courses.some(
      (course) => prerequisiteSlots(course, slot).every((other) => placed.has(other)),
    ));
    if (step.length === 0) break;
    steps.push(step.map(describe).sort(compareLabels));
    step.forEach((slot) => placed.add(slot));
    remaining = remaining.filter((slot) => !placed.has(slot));
  }

  return {
    steps,
    blocked: remaining.map((slot) => slot.label),
    finished: finished.size,
    total: slots.length,
  };
}
