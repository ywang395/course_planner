# Course Planner

A Spring Boot REST backend for exploring San José State University Computer Science courses, checking prerequisite readiness, and saving semester plans in PostgreSQL.

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

The React course browser lives in `frontend/`. Use Node.js 22.12+ (or Node 20.19+), following the [Vite requirements](https://vite.dev/guide/).

Keep Spring Boot running in one terminal. In a second terminal, run:

```sh
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The browser loads courses from the API, filters them by code or name, and displays expandable prerequisite notes and sources. Import the course data below if the list is empty.

`frontend/vite.config.js` forwards development requests from `/api` to `http://localhost:8080`, so the frontend uses relative URLs without requiring backend CORS changes. If the backend port changes, update that proxy target.

To understand the frontend, start with `frontend/src/api.js` (HTTP request), then `frontend/src/App.jsx` (React state, loading, search, and rendering), and `frontend/src/styles.css` (responsive layout).

Run `npm run build` from `frontend/` to generate `frontend/dist/`. For production, serve these static files with a host that also routes `/api` to Spring Boot; the development proxy is not included in the build. Plan editing and eligibility forms are future frontend steps—their backend endpoints already exist.

## Import course data

After the application has started successfully and created the tables, open another terminal in the project root. Run the imports in order, replacing `your_postgres_role` with the same database role used by the application:

```sh
psql -h localhost -U your_postgres_role -d courseplanner -v ON_ERROR_STOP=1 -f src/main/resources/db/sjsu-cs-2026-2027.sql
psql -h localhost -U your_postgres_role -d courseplanner -v ON_ERROR_STOP=1 -f src/main/resources/db/sjsu-course-prerequisite-notes.sql
psql -h localhost -U your_postgres_role -d courseplanner -v ON_ERROR_STOP=1 -f src/main/resources/db/sjsu-course-prerequisite-codes.sql
```

If you changed the database host, port, or name, use the matching connection options in these commands. `psql` may prompt for your password.

The seed contains 26 explicitly named courses from the supplied 2026–2027 CS roadmap, including science/math alternatives—not a complete university catalog. Imports are manual, not automatic at startup. See the [database import guide](src/main/resources/db/README.md) for details and the [prerequisite report](docs/sjsu-course-prerequisites.md) for sources and caveats.

## API endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/courses` | List courses |
| GET | `/api/courses?prerequisite=CS%2046B` | Find courses referencing CS 46B |
| GET | `/api/courses/{code}` | Get a course by code |
| GET | `/api/courses/{code}/prerequisites` | Get its stored prerequisite codes |
| POST | `/api/eligibility/check` | Evaluate preparation for selected courses |
| POST | `/api/plans` | Create a saved semester plan |
| GET | `/api/plans` | List saved plans |
| GET | `/api/plans/{id}` | Retrieve a saved plan |
| PUT | `/api/plans/{id}` | Replace a plan's semester, unit limit, and courses |

Course routes use a **course code**, while plan routes use a **numeric ID**. Encode spaces in URLs as `%20`: `CS 46B` becomes `CS%2046B`. Unknown courses or plans return `404`; invalid requests return `400`.

### Try it

Look up a course:

```sh
curl 'http://localhost:8080/api/courses/CS%20146'
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

Use the returned plan `id` for later GET and PUT requests. Plans persist across application restarts. See the [full API guide](docs/api.md) for request fields, response examples, compatibility routes, and validation rules.

## Tests

Tests require a reachable PostgreSQL database. Prefer a separate test database and set the three `SPRING_DATASOURCE_*` variables in your test terminal before running:

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
```

## Limitations

- Eligibility returns `eligible`, `ineligible`, or `needs_review`. Explicit rules currently cover 10 courses; other courses or insufficient information require review.
- Prerequisite arrays contain references, including alternatives and conditional requirements. They are not an all-required checklist; consult the notes and source metadata.
- Some imported prerequisite information is provisional. Eligibility uses self-reported preparation and is not university enrollment approval.
- Saved plans are drafts: unit limits are checked, but eligibility and timetable conflicts are not enforced when saving.
- There is no authentication or plan ownership. All saved plans are shared within this instance; keep it local until access controls are added.
- The frontend currently supports course browsing and prerequisite details; saved plans and eligibility are available through the API only.
