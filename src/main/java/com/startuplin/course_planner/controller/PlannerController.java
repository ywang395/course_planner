package com.startuplin.course_planner.controller;

import com.startuplin.course_planner.dto.EligibilityRequest;
import com.startuplin.course_planner.dto.EligibilityResponse;
import com.startuplin.course_planner.service.EligibilityService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/eligibility")
public class PlannerController {
    private final EligibilityService eligibilityService;

    public PlannerController(EligibilityService eligibilityService) {
        this.eligibilityService = eligibilityService;
    }

    @PostMapping("/check")
    public List<EligibilityResponse> check(@Valid @RequestBody EligibilityRequest request) {
        return eligibilityService.check(request);
    }
}
