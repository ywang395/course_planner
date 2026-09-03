package com.startuplin.course_planner.service;

import com.startuplin.course_planner.model.Course;
import com.startuplin.course_planner.model.Student;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Service
public class CoursePlannerService {

    public boolean isEligible(
            Course course,
            Student student) {

        Set<String> completedCourses = student.getCompletedCourses();
        List<String> prerequisites = course.getPrerequisites();

        return completedCourses.containsAll(prerequisites);
    }


    public List<Course> getEligibleCourses(
            List<Course> courses,
            Student student) {

        List<Course> eligibleCourses =
                new ArrayList<>();

        for (Course course : courses) {

            if (student.getCompletedCourses()
                    .contains(course.getCode())) {
                continue;
            }

            if (isEligible(course, student)) {
                eligibleCourses.add(course);
            }
        }

        return eligibleCourses;
    }


    public List<String> getMissingPrerequisites(
            Course course,
            Student student) {

        List<String> missing =
                new ArrayList<>();

        for (String prerequisite :
                course.getPrerequisites()) {

            if (!student.getCompletedCourses()
                    .contains(prerequisite)) {

                missing.add(prerequisite);
            }
        }

        return missing;
    }
}
