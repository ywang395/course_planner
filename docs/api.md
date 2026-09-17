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
| GET | `/api/courses/{code}` | One course, including prerequisite notes and source metadata |
| GET | `/api/courses/{code}/prerequisites` | Stored prerequisite code array |
| GET | `/api/courses/prerequisites/{code}` | Compatibility route for the code array |
| POST | `/api/eligibility/check` | Evaluate preparation for selected courses |
| POST | `/api/plans` | Create a saved semester plan; returns 201 and a Location header |
| GET | `/api/plans` | List saved plans by ID |
| GET | `/api/plans/{id}` | Retrieve one saved plan |
| PUT | `/api/plans/{id}` | Replace the semester, unit limit, and complete course selection |

Course codes are trimmed, repeated whitespace is collapsed, and letters are uppercased. Keep the space between the subject and number: `cs 146` is accepted, but `CS146` is a different code. In URLs, encode a space as `%20`. Sorting is by the stored string, not numeric course number.

Existing courses with no prerequisite codes and searches with no matches return `200` and `[]`. A missing course or plan returns `404`. Missing required parameters, blank codes, invalid JSON, and invalid request fields return `400`, with an `application/problem+json` response. Validation errors include an `errors` list.

## Course requests

```sh
curl 'http://localhost:8080/api/courses'
curl 'http://localhost:8080/api/courses/CS%20146'
curl 'http://localhost:8080/api/courses/CS%20160/prerequisites'
curl --get 'http://localhost:8080/api/courses' --data-urlencode 'prerequisite=CS 46B'
```

The prerequisite filter matches references, including conditional prerequisites and alternatives. It does not establish eligibility. The code-array endpoint includes referenced codes even when those courses have not been imported as full course records.

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

The legacy `CoursePlannerService` still contains the original `containsAll` helper. The REST eligibility endpoint uses `EligibilityService` instead; do not use the legacy helper to interpret alternative prerequisites.

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
```

`semester` must be nonblank and at most 100 characters. `maxUnits` must be a positive integer. `courseCodes` must be present and contain at most 100 codes; an empty list creates an empty draft. Unknown courses return 404. Duplicate codes and a total above the unit limit return 400. Rejected updates preserve the existing plan. PUT replaces the entire selection, rather than appending to it.

Plans are drafts: saving does not assert eligibility or check timetable conflicts. This application currently has no accounts or plan ownership; all plans are shared within this local instance. No course deletion or administrative catalog mutation endpoint is introduced.
