package com.startuplin.course_planner.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.util.List;

public record PlanRequest(
        @NotBlank @Size(max = 100) String semester,
        @NotNull @Positive Integer maxUnits,
        @NotNull @Size(max = 100) List<@NotBlank String> courseCodes) {
}
