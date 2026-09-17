package com.startuplin.course_planner.service;

import com.startuplin.course_planner.dto.EligibilityRequest;
import com.startuplin.course_planner.dto.EligibilityResponse;
import com.startuplin.course_planner.model.Course;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class EligibilityService {
    private static final List<String> GRADES = List.of("F", "D-", "D", "D+", "C-", "C", "C+",
            "B-", "B", "B+", "A-", "A", "A+");
    private static final String CS = "COMPUTER SCIENCE";
    private static final String MATH = "APPLIED AND COMPUTATIONAL MATHEMATICS";
    private static final String SOFTWARE = "SOFTWARE ENGINEERING";
    private static final String FORENSICS = "FORENSIC SCIENCE: DIGITAL EVIDENCE";
    private static final String DATA = "DATA SCIENCE";

    private final CourseService courseService;
    private final Map<String, Rule> rules;
    private final Set<String> consentAllowed = Set.of("CS 149", "CS 151", "CS 152", "CS 154",
            "CS 157A", "CS 160", "CS 166");

    public EligibilityService(CourseService courseService) {
        this.courseService = courseService;
        this.rules = Map.ofEntries(
                Map.entry("CS 47", all(any(course("CS 42"), course("MATH 42")), course("CS 46B"),
                        major(CS, DATA, FORENSICS))),
                Map.entry("CS 146", all(course("MATH 30"), course("MATH 42"), course("CS 46B"),
                        any(javaPreparation(), course("CS 49J")))),
                Map.entry("CS 147", any(course("CS 47"), course("CMPE 102"))),
                Map.entry("CS 149", all(course("CS 146"), any(course("CS 47"), course("CMPE 102")),
                        major(CS, MATH, FORENSICS, SOFTWARE))),
                Map.entry("CS 151", all(course("MATH 42"), course("CS 46B"),
                        any(javaPreparation(), course("CS 48"), course("CS 49J")), major(CS, MATH, SOFTWARE, DATA))),
                Map.entry("CS 152", all(any(course("CS 151"), course("CMPE 135")), major(CS, SOFTWARE))),
                Map.entry("CS 154", all(course("CS 46B"), any(course("MATH 42"), course("MATH 42X")),
                        major(CS, MATH))),
                Map.entry("CS 157A", all(course("CS 146"), profile -> SOFTWARE.equals(profile.major())
                        ? unknown("CS 157A sources disagree about Software Engineering major eligibility")
                        : major(CS, MATH).evaluate(profile))),
                Map.entry("CS 160", all(course("CS 146"), course("CS 151"), course("CS 100W", "C"),
                        major(CS, FORENSICS, SOFTWARE))),
                Map.entry("CS 166", all(course("CS 146"),
                        any(course("CS 47"), course("CMPE 102"), course("CMPE 120")), major(CS, MATH, SOFTWARE))));
    }

    public List<EligibilityResponse> check(EligibilityRequest request) {
        Map<String, String> grades = new HashMap<>();
        for (EligibilityRequest.CompletedCourse completed : request.completedCourses()) {
            String code = CourseService.normalizeCode(completed.code());
            if (grades.containsKey(code)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Duplicate completed course: " + code);
            }
            grades.put(code, completed.grade());
        }
        Profile profile = new Profile(grades, normalizeMajor(request.major()), request.cs46bTaughtInJava());
        Set<String> consent = request.instructorConsentCourseCodes().stream()
                .map(CourseService::normalizeCode).collect(Collectors.toSet());
        return request.courseCodes().stream().map(CourseService::normalizeCode).distinct()
                .map(courseService::getCourseByCode).map(course -> evaluate(course, profile, consent)).toList();
    }

    private EligibilityResponse evaluate(Course course, Profile profile, Set<String> consent) {
        Evaluation result;
        String code = course.getCode();
        if (!"SJSU_SYLLABUS".equals(course.getPrerequisiteSourceType())
                || !rules.containsKey(code)) {
            result = unknown("Prerequisite rules require manual review; consult the notes and source");
        } else if (consentAllowed.contains(code) && consent.contains(code)) {
            result = "CS 160".equals(code) ? major(CS, FORENSICS, SOFTWARE).evaluate(profile) : met();
        } else {
            result = rules.get(code).evaluate(profile);
        }
        return new EligibilityResponse(code, result.status(), result.missing(), result.unknown(),
                course.getPrerequisiteNotes(), course.getPrerequisiteSource(), course.getPrerequisiteSourceType());
    }

    private static Rule course(String code) {
        return course(code, "C-");
    }

    private static Rule course(String code, String minimum) {
        return profile -> {
            String requirement = code + " with grade " + minimum + " or better";
            if (!profile.grades().containsKey(code)) {
                return missing(requirement);
            }
            String grade = profile.grades().get(code);
            if (grade == null || !GRADES.contains(grade)) {
                return unknown("Verify the grade or credit equivalency for " + code);
            }
            return GRADES.indexOf(grade) >= GRADES.indexOf(minimum) ? met() : missing(requirement);
        };
    }

    private static Rule major(String... allowed) {
        return profile -> {
            if (profile.major() == null) {
                return unknown("Declared major is required for this eligibility check");
            }
            return Arrays.asList(allowed).contains(profile.major()) ? met()
                    : missing("Declared major must be one of: " + String.join(", ", allowed));
        };
    }

    private static Rule javaPreparation() {
        return profile -> profile.javaPrepared() == null ? unknown("Confirm whether CS 46B was taught in Java")
                : profile.javaPrepared() ? met() : missing("CS 46B taught in Java");
    }

    private static Rule all(Rule... children) {
        return profile -> {
            List<Evaluation> results = Arrays.stream(children).map(child -> child.evaluate(profile)).toList();
            List<String> missing = results.stream().flatMap(result -> result.missing().stream()).toList();
            List<String> unknown = results.stream().flatMap(result -> result.unknown().stream()).toList();
            return new Evaluation(!missing.isEmpty() ? "ineligible" : !unknown.isEmpty() ? "needs_review" : "eligible",
                    missing, unknown);
        };
    }

    private static Rule any(Rule... children) {
        return profile -> {
            List<Evaluation> results = Arrays.stream(children).map(child -> child.evaluate(profile)).toList();
            if (results.stream().anyMatch(result -> "eligible".equals(result.status()))) {
                return met();
            }
            List<String> unknown = results.stream().flatMap(result -> result.unknown().stream()).toList();
            if (!unknown.isEmpty()) {
                return new Evaluation("needs_review", List.of(), unknown);
            }
            return missing("One of: " + results.stream().flatMap(result -> result.missing().stream())
                    .collect(Collectors.joining(" OR ")));
        };
    }

    private static String normalizeMajor(String major) {
        if (major == null || major.isBlank()) {
            return null;
        }
        String normalized = major.strip().replaceAll("\\s+", " ").toUpperCase(Locale.ROOT);
        return switch (normalized) {
            case "CS" -> CS;
            case "APPLIED AND COMPUTATIONAL MATH", "APPLIED/COMPUTATIONAL MATH" -> MATH;
            default -> normalized;
        };
    }

    private static Evaluation met() {
        return new Evaluation("eligible", List.of(), List.of());
    }

    private static Evaluation missing(String requirement) {
        return new Evaluation("ineligible", List.of(requirement), List.of());
    }

    private static Evaluation unknown(String requirement) {
        return new Evaluation("needs_review", List.of(), List.of(requirement));
    }

    private interface Rule {
        Evaluation evaluate(Profile profile);
    }

    private record Profile(Map<String, String> grades, String major, Boolean javaPrepared) {
    }

    private record Evaluation(String status, List<String> missing, List<String> unknown) {
    }
}
