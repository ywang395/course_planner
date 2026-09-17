package com.startuplin.course_planner.service;

import com.startuplin.course_planner.dto.PlanRequest;
import com.startuplin.course_planner.dto.PlanResponse;
import com.startuplin.course_planner.model.Course;
import com.startuplin.course_planner.model.CoursePlan;
import com.startuplin.course_planner.repository.PlanRepository;
import java.util.HashSet;
import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional
public class PlanService {
    private final PlanRepository planRepository;
    private final CourseService courseService;

    public PlanService(PlanRepository planRepository, CourseService courseService) {
        this.planRepository = planRepository;
        this.courseService = courseService;
    }

    public PlanResponse create(PlanRequest request) {
        List<Course> courses = resolveCourses(request);
        return response(planRepository.save(new CoursePlan(request.semester().strip(), request.maxUnits(), courses)));
    }

    @Transactional(readOnly = true)
    public PlanResponse get(Long id) {
        return response(find(id));
    }

    @Transactional(readOnly = true)
    public List<PlanResponse> list() {
        return planRepository.findAll(Sort.by("id")).stream().map(this::response).toList();
    }

    public PlanResponse replace(Long id, PlanRequest request) {
        CoursePlan plan = find(id);
        List<Course> courses = resolveCourses(request);
        plan.replace(request.semester().strip(), request.maxUnits(), courses);
        return response(planRepository.save(plan));
    }

    private CoursePlan find(Long id) {
        return planRepository.findById(id).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Plan not found: " + id));
    }

    private List<Course> resolveCourses(PlanRequest request) {
        List<String> codes = request.courseCodes().stream().map(CourseService::normalizeCode).toList();
        if (new HashSet<>(codes).size() != codes.size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A plan cannot contain duplicate courses");
        }
        List<Course> courses = codes.stream().map(courseService::getCourseByCode).toList();
        if (courses.stream().mapToLong(Course::getUnit).sum() > request.maxUnits()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selected courses exceed maxUnits");
        }
        return courses;
    }

    private PlanResponse response(CoursePlan plan) {
        List<Course> courses = plan.getCourses();
        return new PlanResponse(plan.getId(), plan.getSemester(), plan.getMaxUnits(),
                courses.stream().mapToInt(Course::getUnit).sum(), courses);
    }
}
