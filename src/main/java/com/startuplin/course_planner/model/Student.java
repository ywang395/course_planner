package com.startuplin.course_planner.model;

import java.util.HashSet;
import java.util.Set;

public class Student {
    private String id;
    private String name;
    private String major;
    private Set<String> completedCourses;

    public Student(String id, String name, String major) {
        this.id = id;
        this.name = name;
        this.major = major;
        this.completedCourses = new HashSet<>();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Set<String> getCompletedCourses() {
        return Set.copyOf(completedCourses);
    }

    public void addCompletedCourse(String courseCode) {
        completedCourses.add(courseCode);
    }

    public boolean hasCompleted(String courseCode) {
        return completedCourses.contains(courseCode);
    }

    public String getMajor() {
        return major;
    }

    public void setMajor(String major) {
        this.major = major;
    }
}

