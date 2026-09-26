package com.startuplin.course_planner.dto;

import java.util.List;

/**
 * How often a code appears in catalog prerequisite arrays. {@code name} and {@code unit} are null when the code is
 * referenced but not imported as a catalog course. {@code remainingCount} counts only referencing courses the student
 * has not completed.
 */
public record PrerequisiteFrequency(String code, String name, Integer unit, boolean inCatalog, boolean completed,
                                    int count, int remainingCount, List<String> requiredBy) {
}
