package com.startuplin.course_planner.dto;

import java.util.List;

public record EligibilityResponse(String courseCode, String status, List<String> missingRequirements,
                                  List<String> unverifiedRequirements, String prerequisiteNotes,
                                  String source, String sourceType) {
}
