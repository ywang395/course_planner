# Course Planner

A Spring Boot REST backend and React frontend for exploring San José State University Computer Science courses, tracking completed classes, finding the most-referenced prerequisites, checking prerequisite readiness, and saving semester plans in PostgreSQL.

## Requirements

- JDK 21 or a compatible newer JDK
- A running PostgreSQL server and the `psql` command-line client
- Internet access for the first Maven build to download dependencies

The project includes the Maven wrapper, so a separate Maven installation is not required. Commands below run from the project root, including in the VS Code terminal.

## Run locally

1. Create the database if it does not already exist, using a PostgreSQL role with permission to create databases:

   ```sh
   createdb courseplanner
   ```

2. Configure the connection for your local PostgreSQL account. These environment variables override `src/main/resources/application.properties`:

   ```sh
   export SPRING_DATASOURCE_URL='jdbc:postgresql://localhost:5432/courseplanner'
   export SPRING_DATASOURCE_USERNAME='your_postgres_role'
   export SPRING_DATASOURCE_PASSWORD='your_password'
   ```

   Replace the placeholder credentials; do not commit real passwords.

3. Start the application:

   ```sh
   ./mvnw spring-boot:run
   ```

   The API runs at `http://localhost:8080/api`. Hibernate creates or updates the tables on startup with the current `ddl-auto=update` configuration. Stop the application with **Ctrl+C**. This does not stop PostgreSQL or delete saved data.

## Run the frontend

The React app lives in `frontend/`. Use Node.js 22.12+ (or Node 20.19+), following the [Vite requirements](https://vite.dev/guide/).

Keep Spring Boot running in one terminal. In a second terminal, run:

```sh
cd frontend
npm install
npm run dev      # http://localhost:5173
```

Open `http://localhost:5173`. Import the course data below if the list is empty.

### Using the app

- **Mark completed classes:** type a code into **Add a completed class**, or tick **Completed** on any row in the ranking. Prerequisites of a completed class count as completed too, transitively: marking CS 146 also covers CS 46B, CS 46A, MATH 42, MATH 30, and so on. These appear under **Also counted as completed** with the class that covers them, and their ranking rows show **Covered by …** with a locked checkbox; remove the covering class to undo them. Because prerequisite lists include alternatives, every listed alternative is covered, not only the one you took. Off-catalog prerequisites such as `MATH 19` are accepted; keep the space (`CS 46A`, not `CS46A`). Remove a class with the × on its chip, or use **Clear all** (with Undo). The selection is saved in this browser's `localStorage`.
- **Most-referenced prerequisites:** the ranking panel lists the classes that appear in the most prerequisite lists, from `GET /api/courses/prerequisite-frequency`. The score `remaining/total` shows how many courses you have not completed still list that class, out of all catalog courses that list it. Classes are split into **Major classes**, **GE classes**, **Elective classes**, and **Other classes**, and each section lists only its subject names (alphabetically, e.g. CMPE, CS, MATH) with a class count. Click a subject to expand its classes in rank order; click again to collapse it. The section comes from each course's `category`, set by the catalog alignment import from the 2026–2027 Computer Science, BS catalog page: Major for Major Preparation and Major Requirements (for example MATH 30, PHIL 134, the science electives, CS 46A/46AX, CS 146) plus CS 100W, Elective for the catalog's Major Electives lists (for example CS 48, CS 49J, CS 116A, MATH 164), GE for GE courses outside the major (ENGL 1A), and Other for classes that are not part of the degree requirements but are accepted as prerequisites (for example CMPE 102, CS 42, MATH 19). The ranking only lists classes that appear in some prerequisite list, so most electives, which are nobody's prerequisite, do not appear. Off-catalog variants follow the catalog course they extend (ENGL 1AF → ENGL 1A, MATH 31X → MATH 31). Use **Hide completed** to focus on what is left. Lists include alternatives, so a high rank means "most referenced", not "required".
- **Suggested order:** below the ranking, your remaining required major classes are topologically sorted (Kahn's algorithm, one column per step) so each class comes after its prerequisites: **Step 1 · Available now**, then the classes each later step waits for ("After CS 46B, MATH 42"). Tick **Completed** on a class and the order recalculates. The catalog's choices count as one entry each (CS 46A or CS 46AX; one additional math class; 8 units of approved science electives, with a units count). Only prerequisites that are themselves required classes are used; electives, GE, Other classes, and off-catalog variants in a prerequisite list are treated as alternatives, so CS 146 is not held back by CS 48 or CS 49J. Steps are prerequisite order, not semesters, and non-course conditions (placement, class standing, major restrictions) are not checked. Electives are not placed because most have no prerequisites recorded. The logic is in `frontend/src/suggestedOrder.js`, and the choice groups in `frontend/src/requirements.js`.
- **Course catalog:** below the suggested order, every course in the catalog appears in two panels, **Lower-division classes** (numbered 1–99) and **Upper-division classes** (100 and above, including graduate courses approved as electives such as MATH 203). Each panel is split into **GE classes**, **Major classes**, **Elective classes**, and **Other classes** using the same `category` as the ranking, and each section lists its subjects alphabetically; click a subject to see its courses with units. Each section starts with a note saying how many units it needs to graduate (for example 32 lower-division major units, 17 elective units across both divisions), and a **Units to graduate** summary above the panels repeats the catalog's 120-unit breakdown. These requirements are written in `frontend/src/requirements.js` from the 2026–2027 catalog; update that file when the catalog changes. Tick **Completed** on any course to add it to your completed classes; courses covered through prerequisites show **Covered by …** with a locked checkbox, as in the ranking.

`frontend/vite.config.js` forwards development requests from `/api` to `http://localhost:8080`, so the frontend uses relative URLs without requiring backend CORS changes. If the backend port changes, update that proxy target.

To understand the frontend, start with `frontend/src/api.js` (HTTP requests), `frontend/src/App.jsx` (page state and loading), `frontend/src/CompletedPanel.jsx`, `frontend/src/PrerequisiteRanking.jsx`, and `frontend/src/CourseCatalog.jsx` (the panels), and the pure helpers in `frontend/src/completed.js`, `frontend/src/prerequisiteFrequency.js`, and `frontend/src/catalog.js`.

Run `npm run build` from `frontend/` to generate `frontend/dist/`. For production, serve these static files with a host that also routes `/api` to Spring Boot; the development proxy is not included in the build.

## Import course data

After the application has started successfully and created the tables, open another terminal in the project root. Run the imports in order, replacing `your_postgres_role` with the same database role used by the application:

```sh
psql -h localhost -U your_postgres_role -d courseplanner -v ON_ERROR_STOP=1 -f src/main/resources/db/sjsu-cs-2026-2027.sql
psql -h localhost -U your_postgres_role -d courseplanner -v ON_ERROR_STOP=1 -f src/main/resources/db/sjsu-course-prerequisite-notes.sql
psql -h localhost -U your_postgres_role -d courseplanner -v ON_ERROR_STOP=1 -f src/main/resources/db/sjsu-course-prerequisite-codes.sql
psql -h localhost -U your_postgres_role -d courseplanner -v ON_ERROR_STOP=1 -f sjsu_cs_2026_2027.sql
psql -h localhost -U your_postgres_role -d courseplanner -v ON_ERROR_STOP=1 -f src/main/resources/db/sjsu-catalog-2026-27-sync.sql
psql -h localhost -U your_postgres_role -d courseplanner -v ON_ERROR_STOP=1 -f src/main/resources/db/sjsu-cs-2026-27-catalog-alignment.sql
```

If you changed the database host, port, or name, use the matching connection options in these commands. `psql` may prompt for your password.

The first three imports load 26 roadmap courses with researched prerequisite notes. The next two load the normalized 2026–2027 catalog dataset (program requirements, GE areas, prerequisite rules, and source evidence in separate tables) and sync it into the app's `course` table, bringing it to 85 courses, including CS electives and previously off-catalog prerequisites such as MATH 19 and CMPE 102. The last one aligns every course's category and units with the 2026–2027 Computer Science, BS catalog page and adds CS 180H and CS 190I (87 courses). Courses without a published unit count are stored with 0 units. This is still not a complete university catalog. Imports are manual, not automatic at startup. See the [database import guide](src/main/resources/db/README.md) for details and the [prerequisite report](docs/sjsu-course-prerequisites.md) for sources and caveats.

## API endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/courses` | List courses |
| GET | `/api/courses?prerequisite=CS%2046B` | Find courses referencing CS 46B |
| GET | `/api/courses/{code}` | Get a course by code |
| GET | `/api/courses/{code}/prerequisites` | Get its stored prerequisite codes |
| GET | `/api/courses/prerequisite-frequency?completed=CS%2046A&completed=MATH%2019` | Rank prerequisite codes by how many catalog courses reference them (`count`), how many of those are not yet completed (`remainingCount`), and which ones (`requiredBy`) |
| POST | `/api/eligibility/check` | Evaluate preparation for selected courses |
| POST | `/api/plans` | Create a saved semester plan |
| GET | `/api/plans` | List saved plans |
| GET | `/api/plans/{id}` | Retrieve a saved plan |
| PUT | `/api/plans/{id}` | Replace a plan's semester, unit limit, and courses |
| DELETE | `/api/plans/{id}` | Delete a saved plan (`204`; `404` if unknown) |

Course routes use a **course code**, while plan routes use a **numeric ID**. Encode spaces in URLs as `%20`: `CS 46B` becomes `CS%2046B`. Unknown courses, plans, or routes return `404`; invalid requests return `400`; unsupported methods return `405`; non-JSON bodies return `415`. Errors use `application/problem+json`.

### Try it

Look up a course:

```sh
curl 'http://localhost:8080/api/courses/CS%20146'
```

Find the most-referenced prerequisites, excluding classes you have completed (repeat `completed` once per code; commas do not separate codes):

```sh
curl 'http://localhost:8080/api/courses/prerequisite-frequency?completed=MATH%2019&completed=CS%2046A'
```

Check prerequisite readiness:

```sh
curl 'http://localhost:8080/api/eligibility/check' \
  -H 'Content-Type: application/json' \
  -d '{"courseCodes":["CS 149"],"major":"Computer Science","completedCourses":[{"code":"CS 47","grade":"B"},{"code":"CS 146","grade":"C-"}]}'
```

Save a plan:

```sh
curl -i 'http://localhost:8080/api/plans' \
  -H 'Content-Type: application/json' \
  -d '{"semester":"Fall 2026","maxUnits":15,"courseCodes":["CS 147","CS 151"]}'
```

Use the returned plan `id` for later GET, PUT, and DELETE requests. Plans persist across application restarts. See the [full API guide](docs/api.md) for request fields, response examples, compatibility routes, and validation rules.

## Tests

### Frontend

Frontend unit tests use Vitest and do not need the backend:

```sh
cd frontend
npm test
```

### Backend

Backend tests require a reachable PostgreSQL database. Prefer a separate test database and set the three `SPRING_DATASOURCE_*` variables in your test terminal before running:

```sh
./mvnw test
```

Run just the REST API integration tests:

```sh
./mvnw -Dtest=RestApiTests test
```

Tests create their own fixtures; roadmap imports are not required. API tests roll back course and plan changes, but schema creation and identity-sequence advancement are not rolled back.

## Project structure

```text
src/main/java/com/startuplin/course_planner/
  controller/   HTTP endpoints and error handling
  dto/          Request and response objects
  model/        Database entities
  repository/   Spring Data JPA database access
  service/      Course lookup, eligibility, and planning logic
src/main/resources/db/   Manual SQL imports and import documentation
src/test/java/           Automated tests
docs/                    API guide and prerequisite research
frontend/src/            React app, helpers, and Vitest tests
```

## Limitations

- Eligibility returns `eligible`, `ineligible`, or `needs_review`. Explicit rules currently cover 10 courses; other courses or insufficient information require review.
- Prerequisite arrays contain references, including alternatives and conditional requirements. They are not an all-required checklist; consult the notes and source metadata.
- Some imported prerequisite information is provisional. Eligibility uses self-reported preparation and is not university enrollment approval.
- Saved plans are drafts: unit limits are checked, but eligibility and timetable conflicts are not enforced when saving.
- There is no authentication or plan ownership. All saved plans are shared within this instance; keep it local until access controls are added.
- Prerequisite frequency counts references, including alternatives. A high count means a course appears in many prerequisite lists, not that all of those courses strictly require it.
- Completed classes are stored per browser only; there are no accounts.
- The frontend supports completed-class tracking, the prerequisite ranking, and a lower-/upper-division course catalog; course descriptions and prerequisite notes are available through the API only. Saved plans and eligibility are available through the API only (`createPlan` exists in `frontend/src/api.js` but has no UI yet).
