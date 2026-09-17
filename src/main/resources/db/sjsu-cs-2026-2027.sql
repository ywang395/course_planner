BEGIN;

LOCK TABLE course IN SHARE ROW EXCLUSIVE MODE;

WITH roadmap_courses (code, name, unit, description, prerequisites) AS (
    VALUES
        ('CS 46A', 'Introduction to Programming', 4, 'SJSU CS BS 2026-2027 roadmap: Year 1 Fall.', ARRAY[]::varchar[]),
        ('MATH 30', 'Calculus I', 3, 'SJSU CS BS 2026-2027 roadmap: Year 1 Fall; GE Area 2.', ARRAY[]::varchar[]),
        ('MATH 42', 'Discrete Mathematics', 3, 'SJSU CS BS 2026-2027 roadmap: Year 1 Fall.', ARRAY[]::varchar[]),
        ('ENGL 1A', 'First Year Writing', 3, 'SJSU CS BS 2026-2027 roadmap: Year 1 Fall; recommended GE Area 1A option.', ARRAY[]::varchar[]),
        ('CS 46B', 'Introduction to Data Structures', 4, 'SJSU CS BS 2026-2027 roadmap: Year 1 Spring.', ARRAY[]::varchar[]),
        ('MATH 31', 'Calculus II', 3, 'SJSU CS BS 2026-2027 roadmap: Year 1 Spring; GE Area 2.', ARRAY[]::varchar[]),
        ('CS 47', 'Introduction to Computer Systems', 3, 'SJSU CS BS 2026-2027 roadmap: Year 2 Fall.', ARRAY[]::varchar[]),
        ('CS 146', 'Data Structures and Algorithms', 3, 'SJSU CS BS 2026-2027 roadmap: Year 2 Fall. MATH 42 is a strict prerequisite; other prerequisites are not supplied.', ARRAY['MATH 42']::varchar[]),
        ('PHYS 50', 'General Physics I: Mechanics', 4, 'SJSU CS BS 2026-2027 roadmap: Year 2 Fall; recommended science option with GEOL 1 or GEOL 7; GE Areas 5A + 5C.', ARRAY[]::varchar[]),
        ('GEOL 1', 'General Geology', 4, 'SJSU CS BS 2026-2027 roadmap: Year 2 Fall; recommended science option with PHYS 50 or GEOL 7; GE Areas 5A + 5C.', ARRAY[]::varchar[]),
        ('GEOL 7', 'Earth, Time and Life', 4, 'SJSU CS BS 2026-2027 roadmap: Year 2 Fall; recommended science option with PHYS 50 or GEOL 1; GE Areas 5A + 5C.', ARRAY[]::varchar[]),
        ('CS 147', 'Computer Architecture', 3, 'SJSU CS BS 2026-2027 roadmap: Year 2 Spring.', ARRAY[]::varchar[]),
        ('CS 151', 'Object-Oriented Design', 3, 'SJSU CS BS 2026-2027 roadmap: Year 2 Spring.', ARRAY[]::varchar[]),
        ('MATH 39', 'Linear Algebra I', 3, 'SJSU CS BS 2026-2027 roadmap: Year 2 Spring.', ARRAY[]::varchar[]),
        ('CS 149', 'Operating Systems', 3, 'SJSU CS BS 2026-2027 roadmap: Year 3 Fall.', ARRAY[]::varchar[]),
        ('BIOL 30', 'Principles of Biology I', 4, 'SJSU CS BS 2026-2027 roadmap: Year 3 Fall; recommended science option; GE Areas 5B + 5C.', ARRAY[]::varchar[]),
        ('CS 152', 'Programming Paradigms', 3, 'SJSU CS BS 2026-2027 roadmap: Year 3 Spring.', ARRAY[]::varchar[]),
        ('PHIL 134', 'Computers, Ethics and Society', 3, 'SJSU CS BS 2026-2027 roadmap: Year 3 Spring; GE UD Area 3.', ARRAY[]::varchar[]),
        ('CS 100W', 'Technical Writing Workshop', 3, 'SJSU CS BS 2026-2027 roadmap: Year 3 Spring; Writing in the Disciplines.', ARRAY[]::varchar[]),
        ('MATH 32', 'Calculus III', 3, 'SJSU CS BS 2026-2027 roadmap: Year 3 Spring; choose MATH 32, MATH 142, or MATH 161A.', ARRAY[]::varchar[]),
        ('MATH 142', 'Introduction to Combinatorics', 3, 'SJSU CS BS 2026-2027 roadmap: Year 3 Spring; choose MATH 32, MATH 142, or MATH 161A.', ARRAY[]::varchar[]),
        ('MATH 161A', 'Applied Probability and Statistics I', 3, 'SJSU CS BS 2026-2027 roadmap: Year 3 Spring; choose MATH 32, MATH 142, or MATH 161A.', ARRAY[]::varchar[]),
        ('CS 157A', 'Introduction to Database Management Systems', 3, 'SJSU CS BS 2026-2027 roadmap: Year 4 Fall.', ARRAY[]::varchar[]),
        ('CS 160', 'Software Engineering', 3, 'SJSU CS BS 2026-2027 roadmap: Year 4 Fall.', ARRAY[]::varchar[]),
        ('CS 166', 'Information Security', 3, 'SJSU CS BS 2026-2027 roadmap: Year 4 Fall.', ARRAY[]::varchar[]),
        ('CS 154', 'Formal Languages and Computability', 3, 'SJSU CS BS 2026-2027 roadmap: Year 4 Spring.', ARRAY[]::varchar[])
)
INSERT INTO course (code, name, unit, description, prerequisites)
SELECT roadmap.code, roadmap.name, roadmap.unit, roadmap.description, roadmap.prerequisites
FROM roadmap_courses AS roadmap
WHERE NOT EXISTS (
    SELECT 1 FROM course AS existing WHERE existing.code = roadmap.code
)
RETURNING code, name, unit;

COMMIT;
