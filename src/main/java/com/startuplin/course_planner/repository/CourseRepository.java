package com.startuplin.course_planner.repository;

import com.startuplin.course_planner.model.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;


public interface CourseRepository
        extends JpaRepository<Course, Long> {

    Optional<Course> findByCode(String code);

    @Query(value = "SELECT * FROM course WHERE :code = ANY(prerequisites) ORDER BY code", nativeQuery = true)
    List<Course> findCoursesByPrerequisite(@Param("code") String code);
}
