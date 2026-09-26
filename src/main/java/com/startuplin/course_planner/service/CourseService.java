package com.startuplin.course_planner.service;

import com.startuplin.course_planner.dto.PrerequisiteFrequency;
import com.startuplin.course_planner.model.Course;
import com.startuplin.course_planner.repository.CourseRepository;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.SortedSet;
import java.util.TreeSet;
import java.util.stream.Collectors;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class CourseService {

    private static final Comparator<PrerequisiteFrequency> FREQUENCY_ORDER =
            Comparator.comparingInt(PrerequisiteFrequency::remainingCount).reversed()
                    .thenComparing(Comparator.comparingInt(PrerequisiteFrequency::count).reversed())
                    .thenComparing(PrerequisiteFrequency::code);

    private final CourseRepository courseRepository;

    public CourseService(CourseRepository courseRepository) {
        this.courseRepository = courseRepository;
    }

    public List<Course> getAllCourses() {
        return courseRepository.findAll(Sort.by("code"));
    }

    public Course getCourseByCode(String code) {
        String normalized = normalizeCode(code);
        return courseRepository.findByCode(normalized).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found: " + normalized));
    }

    public List<String> getPrerequisiteCourses(String code) {
        Course course = getCourseByCode(code);
        return course.getPrerequisites();
    }

    public List<Course> getCoursesByPrerequisite(String prerequisite) {
        return courseRepository.findCoursesByPrerequisite(normalizeCode(prerequisite));
    }

    /**
     * Counts how many catalog courses reference each prerequisite code. Arrays are references (including
     * alternatives), so a high count means "unlocks many courses", not "required by many courses".
     *
     * @param completedCodes codes the student has completed; unknown codes are allowed, blank codes are rejected
     */
    public List<PrerequisiteFrequency> getPrerequisiteFrequency(Collection<String> completedCodes) {
        Set<String> completed = completedCodes.stream().map(CourseService::normalizeCode)
                .collect(Collectors.toSet());
        Map<String, Course> catalog = new HashMap<>();
        Map<String, SortedSet<String>> requiredBy = new HashMap<>();
        for (Course course : courseRepository.findAll()) {
            String courseCode = normalizeCode(course.getCode());
            catalog.put(courseCode, course);
            for (String prerequisite : course.getPrerequisites()) {
                if (!prerequisite.isBlank()) {
                    requiredBy.computeIfAbsent(normalizeCode(prerequisite), key -> new TreeSet<>()).add(courseCode);
                }
            }
        }
        return requiredBy.entrySet().stream().map(entry -> {
            String code = entry.getKey();
            List<String> referencing = List.copyOf(entry.getValue());
            int remaining = (int) referencing.stream().filter(course -> !completed.contains(course)).count();
            Course course = catalog.get(code);
            return new PrerequisiteFrequency(code, course == null ? null : course.getName(),
                    course == null ? null : course.getUnit(), course != null, completed.contains(code),
                    referencing.size(), remaining, referencing);
        }).sorted(FREQUENCY_ORDER).toList();
    }

    public static String normalizeCode(String code) {
        if (code == null || code.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Course code must not be blank");
        }
        return code.strip().replaceAll("\\s+", " ").toUpperCase(Locale.ROOT);
    }
}
