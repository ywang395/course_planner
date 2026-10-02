# Graph Report - course_planner  (2026-09-28)

## Corpus Check
- 24 files · ~18,586 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 400 nodes · 879 edges · 22 communities (15 shown, 7 thin omitted)
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 67 edges (avg confidence: 0.84)
- Token cost: 92,421 input · 0 output

## Community Hubs (Navigation)
- REST API Integration Tests
- JPA Entities & Repository
- API Docs & Eligibility DTOs
- Saved Plan Controller & Service
- Frontend API Client & Ranking
- Completed-Class Tracking UI
- Course & Eligibility Services
- Course Controller & Prereq Frequency
- Frontend Build & Dependencies
- SJSU CS Prerequisite Catalog
- API Error Handling
- Eligibility Rule Engine
- Maven Wrapper Script
- Spring Boot Entry Point
- Frontend HTML Entry
- Provisional GE Prereqs (BIOL/ENGL)
- Prereq DB Representation Notes
- containsAll Eligibility Limitation
- GEOL 1 (Provisional)
- GEOL 7 (Provisional)
- PHYS 50 (Provisional)
- Maven Project Coordinates

## God Nodes (most connected - your core abstractions)
1. `Course` - 46 edges
2. `RestApiTests` - 36 edges
3. `EligibilityService` - 23 edges
4. `CourseService` - 18 edges
5. `PlanService` - 18 edges
6. `normalizeCode()` - 17 edges
7. `App()` - 15 edges
8. `CoursePlan` - 12 edges
9. `CourseController` - 11 edges
10. `PlanController` - 11 edges

## Surprising Connections (you probably didn't know these)
- `PlanRequest` --shares_data_with--> `Saved plan requests (create/get/replace/delete)`  [INFERRED]
  src/main/java/com/startuplin/course_planner/dto/PlanRequest.java → docs/api.md
- `PlanResponse` --shares_data_with--> `Saved plan requests (create/get/replace/delete)`  [INFERRED]
  src/main/java/com/startuplin/course_planner/dto/PlanResponse.java → docs/api.md
- `CoursePlan` --shares_data_with--> `course_plan and course_plan_courses tables`  [INFERRED]
  src/main/java/com/startuplin/course_planner/model/CoursePlan.java → docs/api.md
- `CoursePlannerService (legacy, removed)` --conceptually_related_to--> `EligibilityService`  [EXTRACTED]
  docs/api.md → src/main/java/com/startuplin/course_planner/service/EligibilityService.java
- `CompletedPanel()` --implements--> `Completed-class tracking (transitive prerequisite coverage)`  [INFERRED]
  frontend/src/CompletedPanel.jsx → README.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Ordered manual course data import (roadmap seed, notes, codes, catalog dataset, sync)** — src_main_resources_db_sjsu_cs_2026_2027, src_main_resources_db_sjsu_course_prerequisite_notes, src_main_resources_db_sjsu_course_prerequisite_codes, sjsu_cs_2026_2027, src_main_resources_db_sjsu_catalog_2026_27_sync [EXTRACTED 1.00]
- **Prerequisite frequency ranking feature (UI panel, API client, controller, service, DTO)** — readme_prerequisite_ranking_panel, docs_api_prerequisite_frequency, src_main_java_com_startuplin_course_planner_controller_coursecontroller_coursecontroller_getprerequisitefrequency, src_main_java_com_startuplin_course_planner_service_courseservice_courseservice_getprerequisitefrequency, src_main_java_com_startuplin_course_planner_dto_prerequisitefrequency_prerequisitefrequency, frontend_src_api_getprerequisitefrequency, frontend_src_prerequisiteranking_prerequisiteranking [INFERRED 0.85]
- **Eligibility check flow (request, curated rules, statuses)** — docs_api_eligibility_requests, docs_api_eligibility_statuses, docs_api_supported_rules_limits, src_main_java_com_startuplin_course_planner_controller_plannercontroller_plannercontroller_check, src_main_java_com_startuplin_course_planner_service_eligibilityservice_eligibilityservice, src_main_java_com_startuplin_course_planner_dto_eligibilityrequest_eligibilityrequest, src_main_java_com_startuplin_course_planner_dto_eligibilityresponse_eligibilityresponse [INFERRED 0.85]

## Communities (22 total, 7 thin omitted)

### Community 0 - "REST API Integration Tests"
Cohesion: 0.08
Nodes (22): assertthat, autowired, content, delete, get, hasitem, header, jakarta.persistence.EntityManager (+14 more)

### Community 1 - "JPA Entities & Repository"
Cohesion: 0.06
Nodes (19): arraylist, column, generatedvalue, generationtype, id, jakarta.persistence.Entity, joincolumn, jointable (+11 more)

### Community 2 - "API Docs & Eligibility DTOs"
Cohesion: 0.11
Nodes (37): course_plan and course_plan_courses tables, Course planner REST API guide, Course requests section (course fields incl. category), CoursePlannerService (legacy, removed), Eligibility check requests (POST /api/eligibility/check), Eligibility statuses (eligible / ineligible / needs_review), Saved plan requests (create/get/replace/delete), Supported eligibility rules (10 curated courses) (+29 more)

### Community 3 - "Saved Plan Controller & Service"
Cohesion: 0.14
Nodes (16): com.startuplin.course_planner.dto.PlanRequest, com.startuplin.course_planner.dto.PlanResponse, com.startuplin.course_planner.model.CoursePlan, com.startuplin.course_planner.repository.PlanRepository, org.springframework.transaction.annotation.Transactional, org.springframework.web.bind.annotation.DeleteMapping, org.springframework.web.bind.annotation.GetMapping, org.springframework.web.bind.annotation.PostMapping (+8 more)

### Community 4 - "Frontend API Client & Ranking"
Cohesion: 0.13
Nodes (22): ApiError, createPlan(), getCourses(), getPrerequisiteFrequency(), getPrerequisiteRanking(), problemDetail(), row(), buildFrequencyQuery() (+14 more)

### Community 5 - "Completed-Class Tracking UI"
Cohesion: 0.18
Nodes (18): App(), addCompleted(), collectKnownCodes(), getStorage(), impliedCompleted(), loadCompleted(), normalizeCode(), removeCompleted() (+10 more)

### Community 6 - "Course & Eligibility Services"
Cohesion: 0.10
Nodes (22): arrays, collection, collectors, comparator, hashmap, hashset, httpstatus, list (+14 more)

### Community 7 - "Course Controller & Prereq Frequency"
Cohesion: 0.13
Nodes (13): com.startuplin.course_planner.repository.CourseRepository, Compatibility routes (/courses/by-prerequisite, /courses/prerequisites/{code}), Course code normalization (trim, collapse whitespace, uppercase), Endpoints table (docs/api.md), Prerequisite frequency endpoint (count, remainingCount, requiredBy), application/problem+json error responses (400/404/405/415), org.springframework.util.MultiValueMap, pathvariable (+5 more)

### Community 8 - "Frontend Build & Dependencies"
Cohesion: 0.09
Nodes (22): dependencies, react, react-dom, devDependencies, vite, @vitejs/plugin-react, vitest, engines (+14 more)

### Community 9 - "SJSU CS Prerequisite Catalog"
Cohesion: 0.13
Nodes (21): CS 100W, CS 146, CS 147, CS 149, CS 151, CS 152, CS 154, CS 157A (+13 more)

### Community 10 - "API Error Handling"
Cohesion: 0.23
Nodes (14): errorresponse, org.springframework.http.converter.HttpMessageNotReadableException, org.springframework.http.ProblemDetail, org.springframework.http.ResponseEntity, org.springframework.web.bind.annotation.ExceptionHandler, org.springframework.web.bind.annotation.RestControllerAdvice, org.springframework.web.bind.MethodArgumentNotValidException, org.springframework.web.bind.MissingServletRequestParameterException (+6 more)

### Community 11 - "Eligibility Rule Engine"
Cohesion: 0.38
Nodes (4): EligibilityService, Evaluation, Profile, Rule

### Community 12 - "Maven Wrapper Script"
Cohesion: 0.38
Nodes (8): mvnw script, clean(), die(), exec_maven(), hash_string(), set_java_home(), trim(), verbose()

### Community 13 - "Spring Boot Entry Point"
Cohesion: 0.50
Nodes (3): org.springframework.boot.autoconfigure.SpringBootApplication, springapplication, CoursePlannerApplication

### Community 14 - "Frontend HTML Entry"
Cohesion: 0.67
Nodes (3): Course Planner frontend entry page (index.html), /src/main.jsx module script, #root mount div

## Knowledge Gaps
- **37 isolated node(s):** `CompletedCourse`, `/src/main.jsx module script`, `#root mount div`, `BIOL 30 (provisional)`, `ENGL 1A` (+32 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 101 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Course` connect `JPA Entities & Repository` to `REST API Integration Tests`, `API Docs & Eligibility DTOs`, `Saved Plan Controller & Service`, `Course & Eligibility Services`, `Course Controller & Prereq Frequency`?**
  _High betweenness centrality (0.308) - this node is a cross-community bridge._
- **Why does `course.category column (Major / GE / Elective)` connect `API Docs & Eligibility DTOs` to `JPA Entities & Repository`, `Frontend API Client & Ranking`?**
  _High betweenness centrality (0.143) - this node is a cross-community bridge._
- **Why does `classifyCourse()` connect `Frontend API Client & Ranking` to `API Docs & Eligibility DTOs`, `Completed-Class Tracking UI`?**
  _High betweenness centrality (0.108) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `Course` (e.g. with `Course requests section (course fields incl. category)` and `course.category column (Major / GE / Elective)`) actually correct?**
  _`Course` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `CompletedCourse`, `/src/main.jsx module script`, `#root mount div` to the rest of the system?**
  _37 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `REST API Integration Tests` be split into smaller, more focused modules?**
  _Cohesion score 0.08272859216255443 - nodes in this community are weakly interconnected._
- **Should `JPA Entities & Repository` be split into smaller, more focused modules?**
  _Cohesion score 0.06207482993197279 - nodes in this community are weakly interconnected._