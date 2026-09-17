package com.startuplin.course_planner.service;
import com.startuplin.course_planner.model.Course;
import com.startuplin.course_planner.repository.CourseRepository;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;
import java.util.Locale;
import org.springframework.data.domain.Sort;

@Service
public class CourseService {

    private final CourseRepository courseRepository;

    public CourseService(CourseRepository courseRepository) {
        this.courseRepository = courseRepository;
    }

    public List<Course> getAllCourses() {
        return courseRepository.findAll(Sort.by("code"));
    }

    public Course getCourseById(Long id) {
        return courseRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found" + id));
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

    public static String normalizeCode(String code) {
        if (code == null || code.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Course code must not be blank");
        }
        return code.strip().replaceAll("\\s+", " ").toUpperCase(Locale.ROOT);
    }
}
