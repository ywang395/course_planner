package com.startuplin.course_planner.dto;

import com.startuplin.course_planner.model.Course;
import java.util.List;

public record PlanResponse(Long id, String semester, int maxUnits, int totalUnits, List<Course> courses) {
}
