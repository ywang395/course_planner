# Course planner REST API

## Run and test

Start local PostgreSQL, then run from the project folder:

```sh
./mvnw spring-boot:run
```

The base URL is `http://localhost:8080/api`. The existing `spring.jpa.hibernate.ddl-auto=update` setting creates `course_plan` and `course_plan_courses` automatically. Saved plans survive application restarts. Course seed imports remain manual; see [database imports](../src/main/resources/db/README.md).

Run the automated checks with:

```sh
./mvnw test
```

Tests use the PostgreSQL connection in `application.properties`. API integration tests roll back their course/plan changes; schema creation and identity-sequence advancement are not rolled back. For an isolated test database, override `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, and `SPRING_DATASOURCE_PASSWORD` before running Maven. No roadmap seed is needed for the tests.

## Endpoints

| Method | Route | Behavior |
| --- | --- | --- |
| GET | `/api/courses` | Courses sorted by code |
| GET | `/api/courses?prerequisite=CS%2046B` | Courses mentioning this exact code in their prerequisite arrays |
| GET | `/api/courses/by-prerequisite?prerequisite=CS%2046B` | Compatibility route; parameter is required |
| GET | `/api/courses/prerequisite-frequency?completed=CS%2046A` | How many catalog courses reference each prerequisite code; `completed` is optional and repeatable |
| GET | `/api/courses/{code}` | One course, including prerequisite notes and source metadata |
| GET | `/api/courses/{code}/prerequisites` | Stored prerequisite code array |
| GET | `/api/courses/prerequisites/{code}` | Compatibility route for the code array |
| POST | `/api/eligibility/check` | Evaluate preparation for selected courses |
| POST | `/api/plans` | Create a saved semester plan; returns 201 and a Location header |
| GET | `/api/plans` | List saved plans by ID |
| GET | `/api/plans/{id}` | Retrieve one saved plan |
| PUT | `/api/plans/{id}` | Replace the semester, unit limit, and complete course selection |
| DELETE | `/api/plans/{id}` | Delete a saved plan; returns 204 with no body |

Course codes are trimmed, repeated whitespace is collapsed, and letters are uppercased. Keep the space between the subject and number: `cs 146` is accepted, but `CS146` is a different code. In URLs, encode a space as `%20`. Sorting is by the stored string, not numeric course number.

Existing courses with no prerequisite codes and searches with no matches return `200` and `[]`. A missing course or plan returns `404`. Missing required parameters, blank codes, invalid JSON, and invalid request fields return `400`. Unknown routes return `404`, an unsupported HTTP method returns `405` with an `Allow` header, and a request body that is not JSON returns `415`. All errors use an `application/problem+json` response. Validation errors include an `errors` list.

## Course requests

```sh
curl 'http://localhost:8080/api/courses'
curl 'http://localhost:8080/api/courses/CS%20146'
curl 'http://localhost:8080/api/courses/CS%20160/prerequisites'
curl --get 'http://localhost:8080/api/courses' --data-urlencode 'prerequisite=CS 46B'
```

Each course includes `code`, `name`, `unit`, `description`, `prerequisites`, `prerequisiteNotes`, `prerequisiteSource`, `prerequisiteSourceType`, and `category`. `category` is `"Major"`, `"GE"`, or `"Elective"` when set by the catalog sync import (`sjsu-catalog-2026-27-sync.sql`), otherwise `null`.

The prerequisite filter matches references, including conditional prerequisites and alternatives. It does not establish eligibility. The code-array endpoint includes referenced codes even when those courses have not been imported as full course records.

## Prerequisite frequency

```sh
curl 'http://localhost:8080/api/courses/prerequisite-frequency'
curl 'http://localhost:8080/api/courses/prerequisite-frequency?completed=CS%2046A&completed=MATH%2019'
```

The response has one entry for every distinct code that appears in at least one catalog course's prerequisite array:

```json
[
  {
    "code": "CS 146",
    "name": "Data Structures and Algorithms",
    "unit": 3,
    "inCatalog": true,
    "completed": false,
    "count": 4,
    "remainingCount": 4,
    "requiredBy": ["CS 149", "CS 157A", "CS 160", "CS 166"]
  }
]
```

- `count` is the number of catalog courses whose prerequisite arrays contain the code. `requiredBy` lists those courses, sorted by code.
- `remainingCount` counts only the referencing courses that are not in `completed`.
- `completed` is `true` when the code itself was supplied in `completed`.
- `name` and `unit` are `null`, and `inCatalog` is `false`, for referenced codes without a course record (for example `MATH 19`).

Entries are sorted by `remainingCount` descending, then `count` descending, then `code` ascending. Codes that no catalog course references are omitted, even if they are in `completed`.

Repeat `completed` once per course. Each value is normalized like other codes and is treated as one code; commas do not separate values. Codes that are not in the catalog are accepted, because students may have completed courses that were not imported. A blank `completed` value returns `400`.

Prerequisite arrays are references, including alternatives, so a count measures how many courses mention a code. It does not mean every one of those courses requires it. Use the eligibility endpoint to evaluate readiness.

## Eligibility requests

```sh
curl -i 'http://localhost:8080/api/eligibility/check' \
  -H 'Content-Type: application/json' \
  -d '{"courseCodes":["CS 147","CS 149"],"major":"Computer Science","completedCourses":[{"code":"CS 47","grade":"B"},{"code":"CS 146","grade":"C-"}]}'
```

The response is a list, in requested course order, with duplicate target codes removed:

```json
[
  {
    "courseCode": "CS 149",
    "status": "eligible",
    "missingRequirements": [],
    "unverifiedRequirements": [],
    "prerequisiteNotes": "...",
    "source": "...",
    "sourceType": "SJSU_SYLLABUS"
  }
]
```

Each result describes prerequisite readiness, not course availability, degree applicability, or whether repeating the course is useful. A course that has already been completed is still evaluated if requested. Supplying an unknown target course returns 404 for the entire request. Completed prerequisite courses do not need their own database records.

### Request fields

| Field | Required | Meaning |
| --- | --- | --- |
| `courseCodes` | Yes | 1–100 target course codes |
| `completedCourses` | Yes | Up to 1000 objects with `code` and optional `grade`; duplicates after normalization are rejected |
| `major` | No | Declared major; omission requires review when the rule checks it. `CS` is accepted as Computer Science |
| `cs46bTaughtInJava` | No | Whether CS 46B was taught in Java, used by CS 146 and CS 151 |
| `instructorConsentCourseCodes` | No | Codes for which the student reports already obtaining instructor consent; omission means no reported consent |

Grades use uppercase letter notation (`A`, `B+`, `C-`, etc.), `CR`, or `P`. A missing grade or pass/credit notation cannot automatically establish a minimum letter grade, so it requires review. Approved transfer equivalents should be entered using the corresponding SJSU code; this API does not determine transfer equivalency.

### Supported rules and limits

The evaluator implements explicit rules for **CS 47, CS 146, CS 147, CS 149, CS 151, CS 152, CS 154, CS 157A, CS 160, and CS 166**, based on the [researched notes](sjsu-course-prerequisites.md). It requires `SJSU_SYLLABUS` source metadata before applying these rules. These are curated rules in `EligibilityService`, not expressions parsed from the flat prerequisite arrays. Update the rules and tests when the source requirements change.

- `eligible`: all implemented requirements are met, or a supported reported consent route applies.
- `ineligible`: a required condition definitely fails. Failure of one branch of an alternative is insufficient if another branch passes or needs review.
- `needs_review`: information is missing, credit needs interpretation, source information is provisional, or the course does not yet have a fully implemented rule.

The remaining 16 imported courses return `needs_review`; this includes placement/workshop/GE rules and all seven provisional records. CS 157A's conflicting Software Engineering major restriction also returns `needs_review` unless a supported consent route applies. Instructor consent is accepted only for courses whose researched rules allow it; CS 160 still requires an allowed major. Consent and grades are self-reported and not verified against university systems.

The legacy `CoursePlannerService` and its `containsAll` helper, together with the unused `Student` and `Schedule` models, have been removed. Eligibility is evaluated only by `EligibilityService`.

## Saved plan requests

Create:

```sh
curl -i 'http://localhost:8080/api/plans' \
  -H 'Content-Type: application/json' \
  -d '{"semester":"Fall 2026","maxUnits":15,"courseCodes":["CS 147","CS 151"]}'
```

The response contains `id`, `semester`, `maxUnits`, `totalUnits`, and full `courses` objects in selection order. Use the returned ID in subsequent requests; do not assume it is 1.

```sh
curl 'http://localhost:8080/api/plans/1'
curl -X PUT 'http://localhost:8080/api/plans/1' \
  -H 'Content-Type: application/json' \
  -d '{"semester":"Spring 2027","maxUnits":12,"courseCodes":["CS 147"]}'
curl -i -X DELETE 'http://localhost:8080/api/plans/1'
```

`semester` must be nonblank and at most 100 characters. `maxUnits` must be a positive integer. `courseCodes` must be present and contain at most 100 codes; an empty list creates an empty draft. Unknown courses return 404. Duplicate codes and a total above the unit limit return 400. Rejected updates preserve the existing plan. PUT replaces the entire selection, rather than appending to it. DELETE removes the plan and its course selection, but not the courses themselves. It returns `204`, or `404` if the plan does not exist, including when it was already deleted.

Plans are drafts: saving does not assert eligibility or check timetable conflicts. This application currently has no accounts or plan ownership; all plans are shared within this local instance. No course deletion or administrative catalog mutation endpoint is introduced.
