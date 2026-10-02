import { normalizeCode } from './completed.js';
import { groupRanking } from './prerequisiteFrequency.js';
import { SECTION_REQUIREMENTS } from './requirements.js';

// Course numbers 1-99 are lower division; 100 and above are upper division.
// Graduate courses approved as electives (e.g. MATH 203) are listed as upper division.
export function divisionOf(code) {
  const number = Number(normalizeCode(code).match(/\d+/)?.[0]);
  return number >= 100 ? 'upper' : 'lower';
}

const DIVISIONS = [
  { id: 'lower', title: 'Lower-division classes', hint: 'Courses numbered 1–99.' },
  { id: 'upper', title: 'Upper-division classes', hint: 'Courses numbered 100 and above, including graduate courses approved as electives.' },
];

const CATEGORY_ORDER = ['GE', 'Major', 'Elective', 'Other'];

// Splits the whole catalog into lower- and upper-division panels. Each panel holds
// GE, Major, Elective, and Other sections with their graduation requirement, and
// each section its subjects alphabetically with courses in natural code order
// ("CS 46A" before "CS 146").
export function groupCatalog(courses = []) {
  const sorted = [...courses].sort((a, b) => normalizeCode(a.code).localeCompare(normalizeCode(b.code), 'en', { numeric: true }));
  return DIVISIONS.map((division) => {
    const members = sorted.filter((course) => divisionOf(course.code) === division.id);
    const groups = groupRanking(members, courses);
    return {
      ...division,
      count: members.length,
      categories: CATEGORY_ORDER.map((id) => ({
        ...groups.find((group) => group.id === id),
        requirement: SECTION_REQUIREMENTS[division.id][id],
      })),
    };
  });
}
