package com.startuplin.course_planner.controller;

import com.startuplin.course_planner.dto.PlanRequest;
import com.startuplin.course_planner.dto.PlanResponse;
import com.startuplin.course_planner.service.PlanService;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/plans")
public class PlanController {
    private final PlanService planService;

    public PlanController(PlanService planService) {
        this.planService = planService;
    }

    @PostMapping
    public ResponseEntity<PlanResponse> create(@Valid @RequestBody PlanRequest request) {
        PlanResponse plan = planService.create(request);
        return ResponseEntity.created(URI.create("/api/plans/" + plan.id())).body(plan);
    }

    @GetMapping
    public List<PlanResponse> list() {
        return planService.list();
    }

    @GetMapping("/{id}")
    public PlanResponse get(@PathVariable Long id) {
        return planService.get(id);
    }

    @PutMapping("/{id}")
    public PlanResponse replace(@PathVariable Long id, @Valid @RequestBody PlanRequest request) {
        return planService.replace(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        planService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
