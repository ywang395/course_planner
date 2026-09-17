package com.startuplin.course_planner.repository;

import com.startuplin.course_planner.model.CoursePlan;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlanRepository extends JpaRepository<CoursePlan, Long> {
}
