-- Syncs the application's course table from the normalized 2026-2027 catalog
-- dataset (sjsu_cs_2026_2027.sql). Run that dataset first, then this script.
-- Safe to rerun: it only updates matching rows and inserts missing codes.
--
-- * Existing courses take the catalog title, units (when known), and
--   description (when the catalog supplies one; otherwise the roadmap note,
--   including its GE Area tag, is kept).
-- * Catalog courses missing from course are inserted. Unknown units become 0.
-- * Every course gets a category (Major, GE, or Elective); see below.
-- * Courses with catalog prerequisite rules get their prerequisite codes from
--   prerequisite_rule_courses. Existing codes keep their order; new ones are
--   appended. Courses without rules keep their current prerequisites.

BEGIN;

LOCK TABLE course IN SHARE ROW EXCLUSIVE MODE;

CREATE TEMP TABLE catalog_course ON COMMIT DROP AS
SELECT subject_code || ' ' || course_number AS code,
       course_id,
       title,
       units_min::integer AS unit,
       description
FROM courses
WHERE catalog_id = 'sjsu-2026-27';

UPDATE course AS c
SET name = src.title,
    unit = COALESCE(src.unit, c.unit),
    description = COALESCE(src.description, c.description)
FROM catalog_course AS src
WHERE c.code = src.code;

INSERT INTO course (code, name, unit, description, prerequisites)
SELECT src.code, src.title, COALESCE(src.unit, 0), src.description, ARRAY[]::varchar[]
FROM catalog_course AS src
WHERE NOT EXISTS (SELECT 1 FROM course AS existing WHERE existing.code = src.code)
ORDER BY src.code;

WITH rule_codes AS (
    SELECT target.code AS course_code, required.code AS required_code
    FROM prerequisite_rules AS rule
    JOIN prerequisite_rule_courses AS link ON link.prerequisite_rule_id = rule.prerequisite_rule_id
    JOIN catalog_course AS target ON target.course_id = rule.course_id
    JOIN catalog_course AS required ON required.course_id = link.required_course_id
    WHERE rule.rule_type = 'prerequisite'
)
UPDATE course AS c
SET prerequisites = (
    SELECT array_agg(rc.required_code
                     ORDER BY array_position(c.prerequisites, rc.required_code::varchar) NULLS LAST, rc.required_code)
    FROM (SELECT DISTINCT required_code FROM rule_codes WHERE course_code = c.code) AS rc
)
WHERE c.code IN (SELECT course_code FROM rule_codes);

-- Category: GE when the roadmap description carries a GE Area tag; Elective
-- when the course appears only in major requirement groups named as
-- electives (and in no other major group); otherwise Major.
ALTER TABLE course ADD COLUMN IF NOT EXISTS category varchar(255);

WITH major_links AS (
    SELECT src.code, grp.name ILIKE '%elective%' AS is_elective_group
    FROM requirement_courses AS link
    JOIN requirement_groups AS grp ON grp.requirement_group_id = link.requirement_group_id
    JOIN catalog_course AS src ON src.course_id = link.course_id
    WHERE grp.requirement_scope = 'major'
),
electives AS (
    SELECT code FROM major_links GROUP BY code HAVING bool_and(is_elective_group)
)
UPDATE course AS c
SET category = CASE
    WHEN c.description ~ '\mGE\M' THEN 'GE'
    WHEN c.code IN (SELECT code FROM electives) THEN 'Elective'
    ELSE 'Major'
END;

COMMIT;
