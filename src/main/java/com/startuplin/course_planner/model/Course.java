package com.startuplin.course_planner.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import java.util.ArrayList;
import java.util.List;

@Entity
public class Course {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)

    private Long id;
    private String code;
    private String name;
    private int unit;
    private String description;
    private List<String> prerequisites;

    @Column(columnDefinition = "text")
    private String prerequisiteNotes;

    @Column(columnDefinition = "text")
    private String prerequisiteSource;

    private String prerequisiteSourceType;

    protected Course() {
        this.prerequisites = new ArrayList<>();
    }

    public Course(String code, String name, int unit, String description) {
        this.code = code;
        this.name = name;
        this.unit = unit;
        this.description = description;
        this.prerequisites = new ArrayList<>();
    }

    public Course(String code, String name, int unit, String description, List<String> prerequisites) {
        this.code = code;
        this.name = name;
        this.unit = unit;
        this.description = description;
        this.prerequisites = prerequisites != null ? new ArrayList<>(prerequisites) : new ArrayList<>();
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public int getUnit() {
        return unit;
    }

    public void setUnit(int unit) {
        this.unit = unit;
    }

    public List<String> getPrerequisites() {
        return List.copyOf(prerequisites);
    }

    public String getPrerequisiteNotes() {
        return prerequisiteNotes;
    }

    public String getPrerequisiteSource() {
        return prerequisiteSource;
    }

    public String getPrerequisiteSourceType() {
        return prerequisiteSourceType;
    }

    public void setPrerequisites(List<String> prerequisites) {
        this.prerequisites = prerequisites != null ? new ArrayList<>(prerequisites) : new ArrayList<>();
    }

    public boolean hasPrerequisites() {
        return prerequisites != null && !prerequisites.isEmpty();
    }

}
