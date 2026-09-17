# SJSU Computer Science roadmap import

Source: the supplied `Program_ Roadmap_ Computer Science, BS - San José State University.pdf`, 2026-2027 Academic Catalog.

Run against the application's PostgreSQL database:

```sh
psql -d courseplanner -v ON_ERROR_STOP=1 -f src/main/resources/db/sjsu-cs-2026-2027.sql
```

The import adds 26 courses with explicit names and units in the roadmap, including recommended science, writing, and math options. It preserves existing courses with the same code and can be run again without adding duplicates. It runs in one transaction and locks the course table during the import.

Descriptions record roadmap placement and alternatives, not official course descriptions. Alternative courses are catalog options, not all required courses in a single student's plan. GE, physical education, and unnamed elective slots are not course records.

The roadmap lists these additional CS elective codes without titles or individual unit counts, so they are not imported: CS 116A, CS 116B, CS 122, CS 123A, CS 123B, CS 131, CS 133, CS 134, CS 136, CS 144, CS 153, CS 155, CS 156, CS 157B, CS 157C, CS 158A, CS 158B, CS 159, CS 161, CS 168, CS 171, CS 174, CS 175, CS 176.

The initial roadmap seed only supplies MATH 42 for CS 146. Run the additional imports below to populate the researched notes and extracted course-code arrays.

Additional prerequisite research for all 26 courses is available in [the prerequisite report](../../../../docs/sjsu-course-prerequisites.md). Import the readable rules and source metadata after the roadmap seed:

```sh
psql -d courseplanner -v ON_ERROR_STOP=1 -f src/main/resources/db/sjsu-course-prerequisite-notes.sql
psql -d courseplanner -v ON_ERROR_STOP=1 -f src/main/resources/db/sjsu-course-prerequisite-codes.sql
```

The catalog blocked automated access, so this research uses SJSU syllabi/department pages for 19 courses and explicitly provisional secondary sources for seven. The notes retain alternatives and non-course conditions. The `prerequisites` arrays now list extracted codes, including alternatives and conditional prerequisites, excluding concurrent workshops and recommendations. Twenty-one courses have codes; five have no named course prerequisites. Empty arrays do not imply unrestricted enrollment.

The current eligibility engine uses `containsAll`, which incorrectly requires every alternative/conditional code and ignores the additional conditions in the notes. The course-code import does not implement full eligibility logic; consult the report and notes for the actual rules.
