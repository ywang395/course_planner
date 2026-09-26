package com.startuplin.course_planner;

import com.jayway.jsonpath.JsonPath;
import com.startuplin.course_planner.model.Course;
import com.startuplin.course_planner.repository.CourseRepository;
import jakarta.persistence.EntityManager;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import static org.hamcrest.Matchers.hasItem;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class RestApiTests {
    @Autowired
    private MockMvc mvc;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private EntityManager entityManager;

    @Test
    void listsCoursesAndLooksUpNormalizedCode() throws Exception {
        course("TEST 901", 3, List.of());
        mvc.perform(get("/api/courses")).andExpect(status().isOk())
                .andExpect(jsonPath("$[*].code", hasItem("TEST 901")));
        mvc.perform(get("/api/courses/{code}", " test   901 "))
                .andExpect(status().isOk()).andExpect(jsonPath("$.code").value("TEST 901"));
    }

    @Test
    void exposesCourseCategory() throws Exception {
        course("TEST 950", 3, List.of()).setCategory("Elective");
        course("TEST 951", 3, List.of());
        entityManager.flush();
        mvc.perform(get("/api/courses/{code}", "TEST 950"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.category").value("Elective"));
        mvc.perform(get("/api/courses/{code}", "TEST 951"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.category").doesNotExist());
    }

    @Test
    void filtersPostgresArraysThroughBothRoutes() throws Exception {
        course("TEST 902", 3, List.of("TEST 904"));
        course("TEST 903", 3, List.of("TEST 904"));
        entityManager.flush();
        for (String route : List.of("/api/courses", "/api/courses/by-prerequisite")) {
            mvc.perform(get(route).param("prerequisite", " test  904 "))
                    .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(2))
                    .andExpect(jsonPath("$[0].code").value("TEST 902"))
                    .andExpect(jsonPath("$[1].code").value("TEST 903"));
        }
    }

    @Test
    void returnsPrerequisiteCodesEvenWithoutMatchingCourseRecords() throws Exception {
        course("TEST 905", 3, List.of("UNIMPORTED 999"));
        for (String route : List.of("/api/courses/{code}/prerequisites", "/api/courses/prerequisites/{code}")) {
            mvc.perform(get(route, "TEST 905")).andExpect(status().isOk())
                    .andExpect(jsonPath("$[0]").value("UNIMPORTED 999"));
        }
    }

    @Test
    void emptyResultsAreSuccessfulButUnknownCourseIsNotFound() throws Exception {
        course("TEST 906", 3, List.of());
        mvc.perform(get("/api/courses/TEST 906/prerequisites"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(0));
        mvc.perform(get("/api/courses").param("prerequisite", "UNIMPORTED 998"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(0));
        mvc.perform(get("/api/courses/UNIMPORTED 998"))
                .andExpect(status().isNotFound()).andExpect(jsonPath("$.status").value(404));
    }

    @Test
    void rejectsMissingAndBlankPrerequisiteFilters() throws Exception {
        mvc.perform(get("/api/courses/by-prerequisite")).andExpect(status().isBadRequest());
        mvc.perform(get("/api/courses/by-prerequisite").param("prerequisite", " "))
                .andExpect(status().isBadRequest());
        mvc.perform(get("/api/courses").param("prerequisite", ""))
                .andExpect(status().isBadRequest());
    }

    @Test
    void eligibilityAcceptsEitherAlternativeNotBoth() throws Exception {
        course("CS 147", 3, List.of("CS 47", "CMPE 102"));
        for (String code : List.of("CS 47", "CMPE 102")) {
            check("""
                    {"courseCodes":["CS 147"],"completedCourses":[{"code":"%s","grade":"C-"}]}
                    """.formatted(code))
                    .andExpect(status().isOk()).andExpect(jsonPath("$[0].status").value("eligible"));
        }
    }

    @Test
    void unknownGradeOnAnAlternativeRequiresReview() throws Exception {
        course("CS 147", 3, List.of("CS 47", "CMPE 102"));
        check("""
                {"courseCodes":["CS 147"],"completedCourses":[{"code":"CS 47"}]}
                """)
                .andExpect(status().isOk()).andExpect(jsonPath("$[0].status").value("needs_review"));
    }

    @Test
    void failingAllAlternativesIsIneligible() throws Exception {
        course("CS 147", 3, List.of("CS 47", "CMPE 102"));
        check("""
                {"courseCodes":["CS 147"],"completedCourses":[{"code":"CS 47","grade":"D"}]}
                """)
                .andExpect(status().isOk()).andExpect(jsonPath("$[0].status").value("ineligible"))
                .andExpect(jsonPath("$[0].missingRequirements.length()").value(1));
    }

    @Test
    void softwareEngineeringRequiresCInWriting() throws Exception {
        course("CS 160", 3, List.of("CS 146", "CS 151", "CS 100W"));
        String template = """
                {"courseCodes":["CS 160"],"major":"Computer Science","completedCourses":[
                {"code":"CS 146","grade":"B"},{"code":"CS 151","grade":"C-"},
                {"code":"CS 100W","grade":"%s"}]}
                """;
        check(template.formatted("C-")).andExpect(status().isOk())
                .andExpect(jsonPath("$[0].status").value("ineligible"));
        check(template.formatted("C")).andExpect(status().isOk())
                .andExpect(jsonPath("$[0].status").value("eligible"));
    }

    @Test
    void conditionalJavaRequirementAcceptsBridgeCourse() throws Exception {
        course("CS 151", 3, List.of("CS 46B", "MATH 42", "CS 48", "CS 49J"));
        check("""
                {"courseCodes":["CS 151"],"major":"CS","cs46bTaughtInJava":false,"completedCourses":[
                {"code":"CS 46B","grade":"B"},{"code":"MATH 42","grade":"B"},
                {"code":"CS 48","grade":"C-"}]}
                """).andExpect(status().isOk()).andExpect(jsonPath("$[0].status").value("eligible"));
    }

    @Test
    void missingMajorAndProvisionalRulesRequireReview() throws Exception {
        course("CS 152", 3, List.of("CS 151", "CMPE 135"));
        check("""
                {"courseCodes":["CS 152"],"completedCourses":[{"code":"CS 151","grade":"B"}]}
                """).andExpect(status().isOk()).andExpect(jsonPath("$[0].status").value("needs_review"));
        Course provisional = course("CS 147", 3, List.of());
        ReflectionTestUtils.setField(provisional, "prerequisiteSourceType", "SECONDARY_PENDING_CATALOG");
        check("""
                {"courseCodes":["CS 147"],"completedCourses":[{"code":"CS 47","grade":"A"}]}
                """).andExpect(status().isOk()).andExpect(jsonPath("$[0].status").value("needs_review"));
    }

    @Test
    void unmappedRulesNeverTreatEmptyArraysAsEligible() throws Exception {
        course("TEST 907", 3, List.of());
        check("""
                {"courseCodes":["TEST 907"],"completedCourses":[]}
                """).andExpect(status().isOk()).andExpect(jsonPath("$[0].status").value("needs_review"));
    }

    @Test
    void rejectsInvalidEligibilityRequests() throws Exception {
        check("{}").andExpect(status().isBadRequest());
        check("""
                {"courseCodes":["CS 147"],"completedCourses":[{"code":"CS 47","grade":"XYZ"}]}
                """).andExpect(status().isBadRequest());
        check("""
                {"courseCodes":["CS 147"],"completedCourses":[{"code":"CS 47"},{"code":"cs 47"}]}
                """).andExpect(status().isBadRequest());
        check("""
                {"courseCodes":["UNIMPORTED 998"],"completedCourses":[]}
                """).andExpect(status().isNotFound());
    }

    @Test
    void persistsRetrievesAndReplacesPlanCourses() throws Exception {
        course("TEST 908", 3, List.of());
        course("TEST 909", 4, List.of());
        MvcResult created = mvc.perform(post("/api/plans").contentType(MediaType.APPLICATION_JSON).content("""
                {"semester":"Fall 2026","maxUnits":7,"courseCodes":["TEST 909","TEST 908"]}
                """))
                .andExpect(status().isCreated()).andExpect(header().exists("Location"))
                .andExpect(jsonPath("$.totalUnits").value(7)).andReturn();
        Number planId = JsonPath.read(created.getResponse().getContentAsString(), "$.id");
        entityManager.flush();
        entityManager.clear();
        mvc.perform(get("/api/plans/{id}", planId)).andExpect(status().isOk())
                .andExpect(jsonPath("$.courses[0].code").value("TEST 909"))
                .andExpect(jsonPath("$.courses[1].code").value("TEST 908"));
        mvc.perform(put("/api/plans/{id}", planId).contentType(MediaType.APPLICATION_JSON).content("""
                {"semester":"Spring 2027","maxUnits":3,"courseCodes":["TEST 908"]}
                """)).andExpect(status().isOk()).andExpect(jsonPath("$.totalUnits").value(3));
        entityManager.flush();
        entityManager.clear();
        mvc.perform(get("/api/plans/{id}", planId)).andExpect(status().isOk())
                .andExpect(jsonPath("$.semester").value("Spring 2027"))
                .andExpect(jsonPath("$.courses.length()").value(1));
        mvc.perform(get("/api/plans")).andExpect(status().isOk())
                .andExpect(jsonPath("$[*].semester", hasItem("Spring 2027")));
    }

    @Test
    void rejectsDuplicateAndOverLimitPlans() throws Exception {
        course("TEST 910", 4, List.of());
        mvc.perform(post("/api/plans").contentType(MediaType.APPLICATION_JSON).content("""
                {"semester":"Fall 2026","maxUnits":12,"courseCodes":["TEST 910","test 910"]}
                """)).andExpect(status().isBadRequest());
        mvc.perform(post("/api/plans").contentType(MediaType.APPLICATION_JSON).content("""
                {"semester":"Fall 2026","maxUnits":3,"courseCodes":["TEST 910"]}
                """)).andExpect(status().isBadRequest());
    }

    @Test
    void rejectedReplacementPreservesSavedPlan() throws Exception {
        course("TEST 911", 4, List.of());
        MvcResult created = mvc.perform(post("/api/plans").contentType(MediaType.APPLICATION_JSON).content("""
                {"semester":"Fall 2026","maxUnits":4,"courseCodes":["TEST 911"]}
                """))
                .andExpect(status().isCreated()).andReturn();
        Number planId = JsonPath.read(created.getResponse().getContentAsString(), "$.id");
        mvc.perform(put("/api/plans/{id}", planId).contentType(MediaType.APPLICATION_JSON).content("""
                {"semester":"Spring 2027","maxUnits":3,"courseCodes":["TEST 911"]}
                """)).andExpect(status().isBadRequest());
        entityManager.flush();
        entityManager.clear();
        mvc.perform(get("/api/plans/{id}", planId)).andExpect(status().isOk())
                .andExpect(jsonPath("$.semester").value("Fall 2026"))
                .andExpect(jsonPath("$.maxUnits").value(4))
                .andExpect(jsonPath("$.courses[0].code").value("TEST 911"));
    }

    @Test
    void consentOnlyAppliesToDocumentedRoutes() throws Exception {
        course("CS 152", 3, List.of("CS 151", "CMPE 135"));
        course("CS 147", 3, List.of("CS 47", "CMPE 102"));
        course("CS 160", 3, List.of("CS 146", "CS 151", "CS 100W"));
        check("""
                {"courseCodes":["CS 152","CS 147","CS 160"],"completedCourses":[],
                "major":"History","instructorConsentCourseCodes":["CS 152","CS 147","CS 160"]}
                """).andExpect(status().isOk())
                .andExpect(jsonPath("$[0].status").value("eligible"))
                .andExpect(jsonPath("$[1].status").value("ineligible"))
                .andExpect(jsonPath("$[2].status").value("ineligible"));
    }

    @Test
    void validatesPlanRequestsAndMissingResources() throws Exception {
        mvc.perform(post("/api/plans").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/plans").contentType(MediaType.APPLICATION_JSON).content("""
                {"semester":"Fall 2026","maxUnits":0,"courseCodes":[]}
                """)).andExpect(status().isBadRequest());
        mvc.perform(post("/api/plans").contentType(MediaType.APPLICATION_JSON).content("""
                {"semester":"Fall 2026","maxUnits":12,"courseCodes":["UNIMPORTED 998"]}
                """)).andExpect(status().isNotFound());
        mvc.perform(get("/api/plans/{id}", Long.MAX_VALUE)).andExpect(status().isNotFound());
        mvc.perform(get("/api/plans/not-an-id")).andExpect(status().isBadRequest());
        mvc.perform(post("/api/plans").contentType(MediaType.APPLICATION_JSON).content("{"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void prerequisiteFrequencyCountsReferencesIncludingOffCatalogCodes() throws Exception {
        frequencyFixture();
        String json = mvc.perform(get("/api/courses/prerequisite-frequency"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.code == 'TEST 930')].name").value("Test course"))
                .andExpect(jsonPath("$[?(@.code == 'TEST 930')].unit").value(4))
                .andExpect(jsonPath("$[?(@.code == 'TEST 930')].inCatalog").value(true))
                .andExpect(jsonPath("$[?(@.code == 'TEST 930')].completed").value(false))
                .andExpect(jsonPath("$[?(@.code == 'TEST 930')].count").value(3))
                .andExpect(jsonPath("$[?(@.code == 'TEST 930')].remainingCount").value(3))
                .andExpect(jsonPath("$[?(@.code == 'TEST 930')].requiredBy[*]")
                        .value(org.hamcrest.Matchers.contains("TEST 920", "TEST 921", "TEST 922")))
                .andExpect(jsonPath("$[?(@.code == 'UNIMPORTED 931')].name").value(org.hamcrest.Matchers.contains(
                        org.hamcrest.Matchers.nullValue())))
                .andExpect(jsonPath("$[?(@.code == 'UNIMPORTED 931')].unit").value(org.hamcrest.Matchers.contains(
                        org.hamcrest.Matchers.nullValue())))
                .andExpect(jsonPath("$[?(@.code == 'UNIMPORTED 931')].inCatalog").value(false))
                .andExpect(jsonPath("$[?(@.code == 'UNIMPORTED 931')].count").value(2))
                .andReturn().getResponse().getContentAsString();
        List<Map<String, Object>> entries = JsonPath.read(json, "$");
        List<String> codes = entries.stream().map(entry -> (String) entry.get("code")).toList();
        assertThat(codes).doesNotHaveDuplicates().doesNotContain("TEST 920", "TEST 921", "TEST 922");
        assertFrequencyOrder(entries);
    }

    @Test
    void completedCoursesReduceRemainingCountAndReorderFrequency() throws Exception {
        frequencyFixture();
        String json = mvc.perform(get("/api/courses/prerequisite-frequency")
                        .param("completed", " test   920 ", "TEST 921", "UNIMPORTED 931", "OFFCATALOG 1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.code == 'TEST 930')].count").value(3))
                .andExpect(jsonPath("$[?(@.code == 'TEST 930')].remainingCount").value(1))
                .andExpect(jsonPath("$[?(@.code == 'TEST 930')].completed").value(false))
                .andExpect(jsonPath("$[?(@.code == 'UNIMPORTED 931')].remainingCount").value(0))
                .andExpect(jsonPath("$[?(@.code == 'UNIMPORTED 931')].completed").value(true))
                .andExpect(jsonPath("$[?(@.code == 'UNIMPORTED 932')].remainingCount").value(1))
                .andExpect(jsonPath("$[?(@.code == 'OFFCATALOG 1')]").isEmpty())
                .andReturn().getResponse().getContentAsString();
        List<Map<String, Object>> entries = JsonPath.read(json, "$");
        assertFrequencyOrder(entries);
        List<String> codes = entries.stream().map(entry -> (String) entry.get("code")).toList();
        // remainingCount ties (1) break on count desc (3 before 1), then on code asc (932 before 933).
        assertThat(codes.indexOf("TEST 930")).isLessThan(codes.indexOf("UNIMPORTED 932"));
        assertThat(codes.indexOf("UNIMPORTED 932")).isLessThan(codes.indexOf("UNIMPORTED 933"));
        assertThat(codes.indexOf("UNIMPORTED 933")).isLessThan(codes.indexOf("UNIMPORTED 931"));
    }

    @Test
    void prerequisiteFrequencyRouteDoesNotCollideAndRejectsBlankCodes() throws Exception {
        mvc.perform(get("/api/courses/prerequisite-frequency")).andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
        mvc.perform(get("/api/courses/{code}", "PREREQUISITE-FREQUENCY")).andExpect(status().isNotFound());
        for (String[] values : List.of(new String[]{""}, new String[]{" "}, new String[]{"CS 46A", ""})) {
            mvc.perform(get("/api/courses/prerequisite-frequency").param("completed", values))
                    .andExpect(status().isBadRequest()).andExpect(jsonPath("$.status").value(400));
        }
    }

    @Test
    void deletesPlanThenReportsItMissing() throws Exception {
        course("TEST 912", 3, List.of());
        MvcResult created = mvc.perform(post("/api/plans").contentType(MediaType.APPLICATION_JSON).content("""
                {"semester":"Fall 2026","maxUnits":3,"courseCodes":["TEST 912"]}
                """)).andExpect(status().isCreated()).andReturn();
        Number planId = JsonPath.read(created.getResponse().getContentAsString(), "$.id");
        entityManager.flush();
        entityManager.clear();
        mvc.perform(delete("/api/plans/{id}", planId)).andExpect(status().isNoContent());
        entityManager.flush();
        entityManager.clear();
        mvc.perform(get("/api/plans/{id}", planId)).andExpect(status().isNotFound());
        mvc.perform(delete("/api/plans/{id}", planId)).andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
        mvc.perform(get("/api/courses/{code}", "TEST 912")).andExpect(status().isOk());
        mvc.perform(delete("/api/plans/not-an-id")).andExpect(status().isBadRequest());
    }

    @Test
    void unknownRoutesMethodsAndMediaTypesReturnProblemDetails() throws Exception {
        mvc.perform(get("/api/does-not-exist")).andExpect(status().isNotFound())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.status").value(404));
        mvc.perform(delete("/api/courses")).andExpect(status().isMethodNotAllowed())
                .andExpect(header().exists("Allow"))
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON));
        mvc.perform(post("/api/plans").contentType(MediaType.TEXT_PLAIN).content("x"))
                .andExpect(status().isUnsupportedMediaType())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON));
    }

    private void frequencyFixture() {
        course("TEST 930", 4, List.of());
        course("TEST 920", 3, List.of("TEST 930", "UNIMPORTED 931"));
        course("TEST 921", 3, List.of("TEST 930", "UNIMPORTED 931"));
        course("TEST 922", 3, List.of("TEST 930", "UNIMPORTED 933", "UNIMPORTED 932"));
    }

    private static void assertFrequencyOrder(List<Map<String, Object>> entries) {
        Comparator<Map<String, Object>> order = Comparator
                .comparing((Map<String, Object> entry) -> ((Number) entry.get("remainingCount")).intValue()).reversed()
                .thenComparing(Comparator.comparing(
                        (Map<String, Object> entry) -> ((Number) entry.get("count")).intValue()).reversed())
                .thenComparing(entry -> (String) entry.get("code"));
        assertThat(entries).isSortedAccordingTo(order);
    }

    private org.springframework.test.web.servlet.ResultActions check(String body) throws Exception {
        return mvc.perform(post("/api/eligibility/check").contentType(MediaType.APPLICATION_JSON).content(body));
    }

    private Course course(String code, int units, List<String> prerequisites) {
        Course course = courseRepository.findByCode(code)
                .orElseGet(() -> new Course(code, "Test course", units, "Test fixture", prerequisites));
        course.setUnit(units);
        course.setPrerequisites(prerequisites);
        ReflectionTestUtils.setField(course, "prerequisiteSourceType", "SJSU_SYLLABUS");
        return courseRepository.saveAndFlush(course);
    }
}
