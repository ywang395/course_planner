-- Aligns course categories and units with the Computer Science, BS program page
-- of the SJSU 2026-2027 Academic Catalog. Run after
-- sjsu-catalog-2026-27-sync.sql; rerunning the sync resets categories, so run
-- this script again afterwards. Safe to rerun.
--
-- * Major: Major Preparation (required math, PHIL 134, the additional math
--   choice, approved science electives), the lower- and upper-division Major
--   Requirements (CS 46AX is an alternative to CS 46A), and CS 100W, which the
--   catalog recommends for the university writing requirement (GWAR / WID) and
--   CS 160 requires.
-- * Elective: every course on the catalog's Major Electives lists.
-- * GE: unchanged for GE courses the program page does not list (it names GE
--   areas, not courses), such as ENGL 1A.
-- * Other: every remaining course, such as prerequisite alternatives
--   (CMPE 102, CS 42, MATH 19) that are not part of the degree requirements.
-- Units follow the catalog; variable-unit courses store the minimum
-- (CS 180: 1-3 units). Existing names are kept; catalog courses missing from
-- course are inserted with the catalog title and no prerequisites.

BEGIN;

LOCK TABLE course IN SHARE ROW EXCLUSIVE MODE;

CREATE TEMP TABLE catalog_2026_27 (
    code varchar(255) PRIMARY KEY,
    name varchar(255) NOT NULL,
    unit integer NOT NULL,
    category varchar(255) NOT NULL
) ON COMMIT DROP;

INSERT INTO catalog_2026_27 (code, name, unit, category) VALUES
    -- GWAR / WID (recommended course)
    ('CS 100W', 'Technical Writing Workshop', 3, 'Major'),
    -- Major Preparation (27 units)
    ('MATH 30', 'Calculus I', 3, 'Major'),
    ('MATH 31', 'Calculus II', 4, 'Major'),
    ('MATH 42', 'Discrete Mathematics', 3, 'Major'),
    ('MATH 39', 'Linear Algebra I', 3, 'Major'),
    ('PHIL 134', 'Computers, Ethics and Society', 3, 'Major'),
    -- Additional Mathematics Course: complete one
    ('MATH 32', 'Calculus III', 3, 'Major'),
    ('MATH 142', 'Introduction to Combinatorics', 3, 'Major'),
    ('MATH 161A', 'Applied Probability and Statistics I', 3, 'Major'),
    -- Approved Science Electives (8 units)
    ('BIOL 30', 'Principles of Biology I', 4, 'Major'),
    ('BIOL 31', 'Principles of Biology II', 4, 'Major'),
    ('CHEM 1A', 'General Chemistry', 5, 'Major'),
    ('GEOL 1', 'General Geology', 4, 'Major'),
    ('GEOL 4L', 'Earth Systems Lab', 1, 'Major'),
    ('GEOL 7', 'Earth, Time and Life', 4, 'Major'),
    ('METR 10', 'Weather and Climate', 3, 'Major'),
    ('PHYS 50', 'General Physics I: Mechanics', 4, 'Major'),
    ('PHYS 51', 'General Physics II: Electricity and Magnetism', 4, 'Major'),
    -- Major Requirements: lower division (11 units)
    ('CS 46A', 'Introduction to Programming', 4, 'Major'),
    ('CS 46AX', 'Introduction to Programming', 4, 'Major'),
    ('CS 46B', 'Introduction to Data Structures', 4, 'Major'),
    ('CS 47', 'Introduction to Computer Systems', 3, 'Major'),
    -- Major Requirements: upper division (27 units)
    ('CS 146', 'Data Structures and Algorithms', 3, 'Major'),
    ('CS 147', 'Computer Architecture', 3, 'Major'),
    ('CS 149', 'Operating Systems', 3, 'Major'),
    ('CS 151', 'Object-Oriented Design', 3, 'Major'),
    ('CS 152', 'Programming Paradigms', 3, 'Major'),
    ('CS 154', 'Formal Languages and Computability', 3, 'Major'),
    ('CS 157A', 'Introduction to Database Management Systems', 3, 'Major'),
    ('CS 160', 'Software Engineering', 3, 'Major'),
    ('CS 166', 'Information Security', 3, 'Major'),
    -- Major Electives (17 units): Required Major Elective list (at least one)
    ('CS 116A', 'Introduction to Computer Graphics', 3, 'Elective'),
    ('CS 116B', 'Computer Graphics Algorithms', 3, 'Elective'),
    ('CS 122', 'Advanced Programming with Python', 3, 'Elective'),
    ('CS 123A', 'Bioinformatics I', 3, 'Elective'),
    ('CS 123B', 'Bioinformatics II', 3, 'Elective'),
    ('CS 131', 'Processing Big Data - Tools and Techniques', 3, 'Elective'),
    ('CS 133', 'Introduction to Data Visualization', 3, 'Elective'),
    ('CS 134', 'Computer Game Design and Programming', 3, 'Elective'),
    ('CS 136', 'Introduction to Computer Vision', 3, 'Elective'),
    ('CS 144', 'Advanced C++ Programming', 3, 'Elective'),
    ('CS 148', 'Applied Algorithms II', 1, 'Elective'),
    ('CS 153', 'Concepts of Compiler Design', 3, 'Elective'),
    ('CS 155', 'Introduction to the Design and Analysis of Algorithms', 3, 'Elective'),
    ('CS 156', 'Introduction to Artificial Intelligence', 3, 'Elective'),
    ('CS 157B', 'Database Management Systems II', 3, 'Elective'),
    ('CS 157C', 'NoSQL Database Systems', 3, 'Elective'),
    ('CS 158A', 'Computer Networks', 3, 'Elective'),
    ('CS 158B', 'Computer Network Management', 3, 'Elective'),
    ('CS 159', 'Introduction to Parallel Processing', 3, 'Elective'),
    ('CS 161', 'Software Project', 3, 'Elective'),
    ('CS 168', 'Blockchain and Cryptocurrencies', 3, 'Elective'),
    ('CS 171', 'Introduction to Machine Learning', 3, 'Elective'),
    ('CS 174', 'Server-side Web Programming', 3, 'Elective'),
    ('CS 175', 'Mobile Device Development', 3, 'Elective'),
    ('CS 176', 'Introduction to Social Network Analysis', 3, 'Elective'),
    -- Additional Upper Division Electives
    ('CS 108', 'Introduction to Game Studies', 3, 'Elective'),
    ('CS 132', 'Computational Marine Biology', 3, 'Elective'),
    ('CS 143C', 'Numerical Analysis and Scientific Computing', 3, 'Elective'),
    ('CS 143M', 'Numerical Analysis and Scientific Computing', 3, 'Elective'),
    ('CS 180', 'Individual Studies', 1, 'Elective'),
    ('CS 180H', 'Individual Studies for Honors', 3, 'Elective'),
    ('CS 185A', 'Advanced Practical Computing Topics', 1, 'Elective'),
    ('CS 185C', 'Advanced Practical Computing Topics', 3, 'Elective'),
    ('CS 190', 'Internship Project', 1, 'Elective'),
    ('CS 190I', 'Internship Project', 3, 'Elective'),
    -- Lower Division Electives (prior department consent, except CS 48)
    ('CS 48', 'Applied Algorithms', 1, 'Elective'),
    ('CS 85A', 'Practical Computing Topics', 1, 'Elective'),
    ('CS 49C', 'Programming in C', 3, 'Elective'),
    ('CS 49J', 'Programming in Java', 3, 'Elective'),
    -- Mathematics Electives (MATH 142 and MATH 161A are listed above)
    ('MATH 162', 'Statistics for Bioinformatics', 3, 'Elective'),
    ('MATH 164', 'Mathematical Statistics', 3, 'Elective'),
    ('MATH 177', 'Linear and Non-Linear Optimization', 3, 'Elective'),
    ('MATH 178', 'Mathematical Modeling', 3, 'Elective'),
    ('MATH 179', 'Introduction to Graph Theory', 3, 'Elective'),
    ('MATH 203', 'Applied Mathematics, Computation, and Statistics Projects', 3, 'Elective');

UPDATE course AS c
SET unit = src.unit,
    category = src.category
FROM catalog_2026_27 AS src
WHERE c.code = src.code;

INSERT INTO course (code, name, unit, description, prerequisites, category)
SELECT src.code, src.name, src.unit, NULL, ARRAY[]::varchar[], src.category
FROM catalog_2026_27 AS src
WHERE NOT EXISTS (SELECT 1 FROM course AS existing WHERE existing.code = src.code)
ORDER BY src.code;

UPDATE course
SET category = 'Other'
WHERE code NOT IN (SELECT code FROM catalog_2026_27)
  AND category IS DISTINCT FROM 'GE';

COMMIT;
