package com.startuplin.course_planner.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.OrderColumn;
import java.util.ArrayList;
import java.util.List;

@Entity
public class CoursePlan {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String semester;

    @Column(nullable = false)
    private int maxUnits;

    @ManyToMany
    @JoinTable(name = "course_plan_courses",
            joinColumns = @JoinColumn(name = "plan_id"),
            inverseJoinColumns = @JoinColumn(name = "course_id"))
    @OrderColumn(name = "course_position")
    private List<Course> courses = new ArrayList<>();

    protected CoursePlan() {
    }

    public CoursePlan(String semester, int maxUnits, List<Course> courses) {
        replace(semester, maxUnits, courses);
    }

    public void replace(String semester, int maxUnits, List<Course> courses) {
        this.semester = semester;
        this.maxUnits = maxUnits;
        this.courses.clear();
        this.courses.addAll(courses);
    }

    public Long getId() {
        return id;
    }

    public String getSemester() {
        return semester;
    }

    public int getMaxUnits() {
        return maxUnits;
    }

    public List<Course> getCourses() {
        return List.copyOf(courses);
    }
}
