package com.startuplin.course_planner.repository;

import com.startuplin.course_planner.model.Course;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CourseRepository
        extends JpaRepository<Course, Long> {
}
