// Graduation unit requirements from the Computer Science, BS page of the SJSU
// 2026-2027 Academic Catalog. The catalog counts units by requirement, not by
// division, so each section note says which requirements its courses satisfy.
// The section notes add up to the 120-unit total: lower GE 24 + PE 2 +
// lower major 32 + additional math 3 + upper GE 6 + upper major 33 +
// electives 17 + university electives 3.

export const CATALOG_SOURCE = 'SJSU 2026–2027 catalog, Computer Science BS';

// The catalog's Summary of Degree Units.
export const DEGREE_UNITS = [
  { label: 'Core lower-division GE', units: 18 },
  { label: 'American Institutions (GE Areas 3B and 4)', units: 6 },
  { label: 'Upper-division GE', units: 6 },
  { label: 'Physical Education', units: 2 },
  { label: 'Writing requirement (GWAR, CS 100W recommended)', units: 3 },
  { label: 'Major preparation', units: 27 },
  { label: 'Major requirements (including 17 elective units)', units: 55 },
  { label: 'University electives', units: 3 },
];

export const TOTAL_UNITS = 120;

// Required major classes that any one of several courses satisfies, or, for
// science, a number of units from a list. Every other Major class is required
// on its own.
export const REQUIRED_CHOICES = [
  { id: 'intro-programming', label: 'CS 46A or CS 46AX', courses: ['CS 46A', 'CS 46AX'] },
  { id: 'additional-math', label: 'Additional math (choose one)', courses: ['MATH 32', 'MATH 142', 'MATH 161A'] },
  {
    id: 'science',
    label: 'Approved science electives',
    courses: ['BIOL 30', 'BIOL 31', 'CHEM 1A', 'GEOL 1', 'GEOL 4L', 'GEOL 7', 'METR 10', 'PHYS 50', 'PHYS 51'],
    units: 8,
    detail: 'At least 6 of the 8 units from these; the other 2 may come from GE Areas 5A–5C.',
  },
];

const OTHER = {
  needed: 'Not required.',
  detail: 'These classes are not part of the CS BS requirements or its approved elective lists. Some are listed because other courses accept them as prerequisites.',
};

export const SECTION_REQUIREMENTS = {
  lower: {
    GE: {
      needed: 'Need 24 units.',
      detail: 'Lower-division GE is 34 units, and your major math (Area 2) and science (Areas 5A–5C) classes cover 10. The other 24 are Areas 1A, 1B, 1C, 3, 4 and 6, including 6 units of American Institutions taken in Areas 3B and 4. Also complete 2 units of Physical Education.',
    },
    Major: {
      needed: 'Need 32 units.',
      detail: 'CS 46A or CS 46AX, CS 46B and CS 47 (11); MATH 30, MATH 31, MATH 39 and MATH 42 (13); 8 units of approved science electives, at least 6 from the science classes here (the rest may come from GE Areas 5A–5C). Also one additional math class (3): MATH 32, or MATH 142 or MATH 161A in upper division.',
    },
    Elective: {
      needed: 'Count toward the 17 elective units.',
      detail: 'Need prior department consent, except CS 48. Only one of CS 49C or CS 49J, and at most 6 units of CS 85 and CS 185 combined.',
    },
    Other: OTHER,
  },
  upper: {
    GE: {
      needed: 'Need 6 units.',
      detail: 'Upper-division GE is 9 units, and PHIL 134 in Major classes covers UD Area 3. The other 6 are UD Areas 2/5 and 4.',
    },
    Major: {
      needed: 'Need 33 units.',
      detail: 'CS 146, 147, 149, 151, 152, 154, 157A, 160 and 166 (27); PHIL 134 (3); and 3 units for the university writing requirement, where the catalog recommends CS 100W (CS 160 also requires it). Major coursework must include at least 37 units of upper-division MATH and CS, not counting CS 100W.',
    },
    Elective: {
      needed: 'Need 17 units, including any lower-division electives.',
      detail: 'At least one from the Required Major Elective list: any CS class here except CS 108, 132, 143C, 143M, 180, 180H, 185A, 185C, 190 and 190I. MATH 142 or MATH 161A also counts when not used as your additional math class. CS 180 (1–3 units) and MATH 203 need prior advisor approval; at most 3 units of CS 190 and 6 units of CS 85 and CS 185 combined.',
    },
    Other: OTHER,
  },
};
