package com.startuplin.course_planner.controller;

import com.startuplin.course_planner.model.Course;
import com.startuplin.course_planner.service.CourseService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

@RestController
@RequestMapping("/api/courses")
public class CourseController {

    private final CourseService courseService;

    public CourseController(CourseService courseService) {
        this.courseService = courseService;
    }

    @GetMapping
    public List<Course> getAllCourses(@RequestParam(required = false) String prerequisite) {
        return prerequisite == null ? courseService.getAllCourses()
                : courseService.getCoursesByPrerequisite(prerequisite);
    }

    @GetMapping("/{code}")
    public Course getCourses(@PathVariable String code) {
        return courseService.getCourseByCode(code);
    }

    @GetMapping({"/{code}/prerequisites", "/prerequisites/{code}"})
    public List<String> getPrerequisiteCourses(@PathVariable String code) {
        return courseService.getPrerequisiteCourses(code);
    }

    @GetMapping("/by-prerequisite")
    public List<Course> getCoursesByPrerequisite(
            @RequestParam String prerequisite) {
        return courseService.getCoursesByPrerequisite(prerequisite);
    }
}
