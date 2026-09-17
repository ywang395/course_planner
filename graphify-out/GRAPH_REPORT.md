# Graph Report - course_planner  (2026-09-16)

## Corpus Check
- Corpus is ~10,854 words - fits in a single context window. You may not need a graph.

## Summary
- 324 nodes · 631 edges · 29 communities (16 shown, 13 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 34 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Course API & Repository
- Integration Test Suite
- Plan Controller & CRUD
- Domain Entities & DTOs
- SJSU CS Course Codes
- Frontend Build Config
- Student Model & Prerequisites
- Eligibility Rule Engine
- REST Controller Layer
- Eligibility Docs & Legacy Logic
- API Exception Handling
- Frontend App & API Client
- Maven Wrapper Script
- App Entry Point
- Frontend HTML Entry
- API Documentation
- Provisional Courses (Bio/Engl)
- Course Requests Section
- Saved Plan Requests Section
- GEOL 1 (Provisional)
- GEOL 7 (Provisional)
- PHYS 50 (Provisional)
- Maven Project Coordinates
- Project Overview
- Known Limitations
- Project Structure Section
- Requirements Section
- Run Locally Instructions
- Tests Section

## God Nodes (most connected - your core abstractions)
1. `Course` - 50 edges
2. `RestApiTests` - 27 edges
3. `EligibilityService` - 21 edges
4. `CourseService` - 17 edges
5. `PlanService` - 16 edges
6. `Student` - 15 edges
7. `CoursePlan` - 14 edges
8. `PlanResponse` - 13 edges
9. `Schedule` - 11 edges
10. `CourseRepository` - 10 edges

## Surprising Connections (you probably didn't know these)
- `API endpoints table` --semantically_similar_to--> `Endpoints table (docs/api.md)`  [INFERRED] [semantically similar]
  README.md → docs/api.md
- `Run the frontend section` --conceptually_related_to--> `Course Planner frontend entry page (index.html)`  [INFERRED]
  README.md → frontend/index.html
- `Import course data section` --references--> `sjsu-cs-2026-2027.sql (roadmap course import)`  [EXTRACTED]
  README.md → src/main/resources/db/README.md
- `Import course data section` --references--> `Prerequisites for the 26 imported SJSU courses (report)`  [EXTRACTED]
  README.md → docs/sjsu-course-prerequisites.md
- `Import course data section` --references--> `SJSU Computer Science roadmap import guide`  [EXTRACTED]
  README.md → src/main/resources/db/README.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **SJSU course data import pipeline (roadmap seed + prerequisite research migrations)** — src_main_resources_db_readme_import_guide, src_main_resources_db_sjsu_cs_2026_2027, src_main_resources_db_sjsu_course_prerequisite_notes_sql, src_main_resources_db_sjsu_course_prerequisite_codes_sql, docs_sjsu_course_prerequisites_report [INFERRED 0.85]
- **Courses with explicit EligibilityService rules** — docs_api_eligibilityservice, docs_sjsu_course_prerequisites_cs_47, docs_sjsu_course_prerequisites_cs_146, docs_sjsu_course_prerequisites_cs_147, docs_sjsu_course_prerequisites_cs_149, docs_sjsu_course_prerequisites_cs_151, docs_sjsu_course_prerequisites_cs_152, docs_sjsu_course_prerequisites_cs_154, docs_sjsu_course_prerequisites_cs_157a, docs_sjsu_course_prerequisites_cs_160, docs_sjsu_course_prerequisites_cs_166 [EXTRACTED 1.00]

## Communities (29 total, 13 thin omitted)

### Community 0 - "Course API & Repository"
Cohesion: 0.06
Nodes (15): arrays, collectors, hashmap, httpstatus, locale, map, optional, org.springframework.data.jpa.repository.Query (+7 more)

### Community 1 - "Integration Test Suite"
Cohesion: 0.10
Nodes (19): autowired, get, hasitem, header, jakarta.persistence.EntityManager, jsonpath, mediatype, mvcresult (+11 more)

### Community 2 - "Plan Controller & CRUD"
Cohesion: 0.15
Nodes (12): org.springframework.data.jpa.repository.JpaRepository, org.springframework.transaction.annotation.Transactional, org.springframework.web.bind.annotation.GetMapping, org.springframework.web.bind.annotation.PostMapping, org.springframework.web.bind.annotation.PutMapping, PlanController, PlanRequest, PlanResponse (+4 more)

### Community 3 - "Domain Entities & DTOs"
Cohesion: 0.12
Nodes (18): arraylist, column, generatedvalue, generationtype, id, jakarta.persistence.Entity, joincolumn, jointable (+10 more)

### Community 4 - "SJSU CS Course Codes"
Cohesion: 0.13
Nodes (21): CS 100W, CS 146, CS 147, CS 149, CS 151, CS 152, CS 154, CS 157A (+13 more)

### Community 5 - "Frontend Build Config"
Cohesion: 0.10
Nodes (19): dependencies, react, react-dom, devDependencies, vite, @vitejs/plugin-react, engines, node (+11 more)

### Community 6 - "Student Model & Prerequisites"
Cohesion: 0.15
Nodes (4): hashset, set, Student, CoursePlannerService

### Community 7 - "Eligibility Rule Engine"
Cohesion: 0.38
Nodes (4): EligibilityService, Evaluation, Profile, Rule

### Community 8 - "REST Controller Layer"
Cohesion: 0.20
Nodes (10): org.springframework.web.bind.annotation.RequestMapping, org.springframework.web.bind.annotation.RestController, pathvariable, requestbody, requestparam, CourseController, PlannerController, CompletedCourse (+2 more)

### Community 9 - "Eligibility Docs & Legacy Logic"
Cohesion: 0.21
Nodes (14): containsAll helper (legacy, treats alternatives as all-required), CoursePlannerService (legacy), Eligibility requests section, EligibilityService (curated eligibility rules), Supported eligibility rules and limits (curated rules vs parsed expressions), Database representation section (prerequisite_notes/source columns), Eligibility limitation (containsAll treats alternatives as all-required), Prerequisites for the 26 imported SJSU courses (report) (+6 more)

### Community 10 - "API Exception Handling"
Cohesion: 0.31
Nodes (10): org.springframework.http.converter.HttpMessageNotReadableException, org.springframework.http.ProblemDetail, org.springframework.http.ResponseEntity, org.springframework.web.bind.annotation.ExceptionHandler, org.springframework.web.bind.annotation.RestControllerAdvice, org.springframework.web.bind.MethodArgumentNotValidException, org.springframework.web.bind.MissingServletRequestParameterException, org.springframework.web.method.annotation.MethodArgumentTypeMismatchException (+2 more)

### Community 11 - "Frontend App & API Client"
Cohesion: 0.27
Nodes (7): getCourses(), App(), CourseCard(), sourceUrl(), frontend_src_styles, react, ref_react_dom_client

### Community 12 - "Maven Wrapper Script"
Cohesion: 0.38
Nodes (8): mvnw script, clean(), die(), exec_maven(), hash_string(), set_java_home(), trim(), verbose()

### Community 13 - "App Entry Point"
Cohesion: 0.50
Nodes (3): org.springframework.boot.autoconfigure.SpringBootApplication, springapplication, CoursePlannerApplication

### Community 14 - "Frontend HTML Entry"
Cohesion: 0.50
Nodes (4): Course Planner frontend entry page (index.html), /src/main.jsx module script, #root mount div, Run the frontend section

### Community 15 - "API Documentation"
Cohesion: 0.67
Nodes (3): Course planner REST API guide, Endpoints table (docs/api.md), API endpoints table

## Knowledge Gaps
- **42 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+37 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 98 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Course` connect `Course API & Repository` to `Integration Test Suite`, `Plan Controller & CRUD`, `Domain Entities & DTOs`, `Student Model & Prerequisites`, `REST Controller Layer`?**
  _High betweenness centrality (0.220) - this node is a cross-community bridge._
- **Why does `EligibilityService` connect `Eligibility Rule Engine` to `REST Controller Layer`, `Course API & Repository`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **Why does `Student` connect `Student Model & Prerequisites` to `Domain Entities & DTOs`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _42 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Course API & Repository` be split into smaller, more focused modules?**
  _Cohesion score 0.05844155844155844 - nodes in this community are weakly interconnected._
- **Should `Integration Test Suite` be split into smaller, more focused modules?**
  _Cohesion score 0.10452961672473868 - nodes in this community are weakly interconnected._
- **Should `Plan Controller & CRUD` be split into smaller, more focused modules?**
  _Cohesion score 0.14616755793226383 - nodes in this community are weakly interconnected._