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

The course-code arrays are references, not an all-required checklist. `POST /api/eligibility/check` evaluates explicit rules for a subset of courses; consult the report and notes for the full rules.

## 2026-2027 catalog dataset

`sjsu_cs_2026_2027.sql` (project root) is a normalized catalog dataset for the CS BS program. It creates and fills separate tables that the application does not read directly: `universities`, `catalog_editions`, `programs`, `courses`, `requirement_groups` (major and university GE requirements), `requirement_courses`, `prerequisite_rules`, `prerequisite_rule_courses`, and `source_evidence`. It is idempotent (`CREATE TABLE IF NOT EXISTS`, `ON CONFLICT DO NOTHING`).

`sjsu-catalog-2026-27-sync.sql` then copies that dataset into the application's `course` table. Run both after the three imports above:

```sh
psql -d courseplanner -v ON_ERROR_STOP=1 -f sjsu_cs_2026_2027.sql
psql -d courseplanner -v ON_ERROR_STOP=1 -f src/main/resources/db/sjsu-catalog-2026-27-sync.sql
```

The sync runs in one transaction and can be rerun safely. It:

- inserts the 59 catalog courses missing from `course` (CS electives, CS 48, CS 49C/49J, CMPE 102/120/135, MATH 1/18A/18B/19/42X, additional science options, and others), bringing the table to 85 courses. Courses without a published unit count (for example MATH 19, CMPE 102, CS 180) are stored with `unit = 0`;
- updates titles and units of existing courses (MATH 31 becomes 4 units) and replaces roadmap notes with official descriptions where the catalog provides one (13 CS courses). Other courses keep their roadmap description, including the GE Area tag the frontend uses to separate major and GE classes;
- adds a `category` column (if Hibernate has not already) and sets it for every course: `GE` when the roadmap description carries a GE Area tag (8 courses), `Elective` when the course appears only in major requirement groups named as electives (43 courses, including CS 48, CS 49C/49J and the upper-division CS/MATH electives), otherwise `Major` (34 courses). MATH 142 and MATH 161A stay `Major` because they also satisfy the required additional-math choice;
- rebuilds `prerequisites` for the 13 CS courses that have catalog prerequisite rules. CS 146 gains CS 48 as an alternative; the other arrays are unchanged. Courses without catalog rules keep their existing arrays, and `prerequisite_notes` and sources are not modified.

## 2026-2027 program page alignment

The sync's category rule is a heuristic, and the dataset's elective distribution was unresolved because the catalog page was blocked. `sjsu-cs-2026-27-catalog-alignment.sql` corrects both from the supplied `Program_ Computer Science, BS - San José State University.pdf` (2026-2027 Academic Catalog). Run it last, and again whenever the sync is rerun:

```sh
psql -d courseplanner -v ON_ERROR_STOP=1 -f src/main/resources/db/sjsu-cs-2026-27-catalog-alignment.sql
```

It runs in one transaction and can be rerun safely. It:

- sets `category` from the program page: `Major` for Major Preparation (MATH 30/31/39/42, PHIL 134, the MATH 32/142/161A choice, the nine approved science electives), Major Requirements (CS 46A or CS 46AX, CS 46B, CS 47, and the nine upper-division CS courses), and CS 100W (recommended for the writing requirement and required by CS 160); `Elective` for every course on the Major Electives lists (required list, additional upper-division, lower-division, and mathematics electives); `GE` stays for ENGL 1A; every other course becomes `Other` (CMPE 102/120/135, CS 42, CS 46AW, MATH 1/18A/18B/19/42X), meaning it is accepted as a prerequisite but is not part of the degree requirements;
- sets units from the page, including CS 48, CS 85A, CS 148, and CS 185A (1 unit), CS 190 (1), MATH 203 (3), and CS 180 (1, the minimum of 1-3);
- inserts CS 180H and CS 190I, which the page lists but the dataset lacks, bringing the table to 87 courses.

It does not change names, prerequisites, or the normalized dataset tables. `requirement_groups` still records 14 elective units with an unresolved distribution and a separate CS 49C/49J requirement; the program page instead requires 17 elective units, at least one from the Required Major Elective list, with CS 49C/49J as an optional lower-division elective. The unit requirements the frontend shows are in `frontend/src/requirements.js`.
