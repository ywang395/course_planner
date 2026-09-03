package com.startuplin.course_planner.model;

import java.util.ArrayList;
import java.util.List;

public class Schedule {
    private String semester;
    private List<Course> courses;
    private int maxUnits;

    public Schedule(String semester, int maxUnits) {
        this.semester = semester;
        this.maxUnits = maxUnits;
        this.courses = new ArrayList<>();
    }

    public String getSemester() {
        return semester;
    }

    public void setSemester(String semester) {
        this.semester = semester;
    }

    public List<Course> getCourses() {
        return List.copyOf(courses);
    }

    public void addCourse(Course course) {
        if (!canAddCourse(course)) {
            throw new IllegalStateException("Adding " + course.getCode() + " exceeds the " + maxUnits + " unit limit");
        }
        courses.add(course);
    }

    public int getTotalUnits() {
        return courses.stream().mapToInt(Course::getUnit).sum();
    }

    public int getMaxUnits() {
        return maxUnits;
    }

    public void setMaxUnits(int maxUnits) {
        this.maxUnits = maxUnits;
    }

    public boolean canAddCourse(Course course) {
        return getTotalUnits() + course.getUnit() <= maxUnits;
    }
}

