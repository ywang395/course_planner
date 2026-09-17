package com.startuplin.course_planner.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;

public record EligibilityRequest(
        @NotEmpty @Size(max = 100) List<@NotBlank String> courseCodes,
        @NotNull @Size(max = 1000) List<@NotNull @Valid CompletedCourse> completedCourses,
        @Size(max = 100) String major,
        Boolean cs46bTaughtInJava,
        @Size(max = 100) List<@NotBlank String> instructorConsentCourseCodes) {

    public EligibilityRequest {
        instructorConsentCourseCodes = instructorConsentCourseCodes == null
                ? List.of() : List.copyOf(instructorConsentCourseCodes);
    }

    public record CompletedCourse(
            @NotBlank String code,
            @Pattern(regexp = "A[+-]?|B[+-]?|C[+-]?|D[+-]?|F|CR|P",
                    message = "must be a letter grade, CR, or P") String grade) {
    }
}
