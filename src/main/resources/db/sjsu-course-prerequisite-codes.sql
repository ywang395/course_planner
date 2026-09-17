BEGIN;

CREATE TEMP TABLE extracted_prerequisite_codes (
    code varchar(255) PRIMARY KEY,
    prerequisites varchar(255)[] NOT NULL
) ON COMMIT DROP;

INSERT INTO extracted_prerequisite_codes (code, prerequisites)
VALUES
    ('CS 46A', ARRAY['MATH 1']::varchar[]),
    ('MATH 30', ARRAY['MATH 19', 'MATH 18A', 'MATH 18B']::varchar[]),
    ('MATH 42', ARRAY['MATH 19', 'MATH 18A', 'MATH 18B']::varchar[]),
    ('ENGL 1A', ARRAY[]::varchar[]),
    ('CS 46B', ARRAY['CS 46A', 'CS 46AX', 'CS 46AW', 'MATH 19', 'MATH 18A', 'MATH 18B']::varchar[]),
    ('MATH 31', ARRAY['MATH 30']::varchar[]),
    ('CS 47', ARRAY['CS 42', 'MATH 42', 'CS 46B']::varchar[]),
    ('CS 146', ARRAY['MATH 30', 'MATH 42', 'CS 46B', 'CS 49J']::varchar[]),
    ('PHYS 50', ARRAY['ENGL 1AF', 'MATH 30', 'MATH 30P', 'MATH 30PL', 'MATH 30X']::varchar[]),
    ('GEOL 1', ARRAY[]::varchar[]),
    ('GEOL 7', ARRAY[]::varchar[]),
    ('CS 147', ARRAY['CS 47', 'CMPE 102']::varchar[]),
    ('CS 151', ARRAY['MATH 42', 'CS 46B', 'CS 48', 'CS 49J']::varchar[]),
    ('MATH 39', ARRAY['MATH 31', 'MATH 31X']::varchar[]),
    ('CS 149', ARRAY['CS 146', 'CS 47', 'CMPE 102']::varchar[]),
    ('BIOL 30', ARRAY['ENGL 1AF', 'ENGL 1A']::varchar[]),
    ('CS 152', ARRAY['CS 151', 'CMPE 135']::varchar[]),
    ('PHIL 134', ARRAY[]::varchar[]),
    ('CS 100W', ARRAY[]::varchar[]),
    ('MATH 32', ARRAY['MATH 31']::varchar[]),
    ('MATH 142', ARRAY['MATH 31', 'MATH 31X', 'MATH 42', 'MATH 42X']::varchar[]),
    ('MATH 161A', ARRAY['MATH 31', 'MATH 31X']::varchar[]),
    ('CS 157A', ARRAY['CS 146']::varchar[]),
    ('CS 160', ARRAY['CS 146', 'CS 151', 'CS 100W']::varchar[]),
    ('CS 166', ARRAY['CS 146', 'CS 47', 'CMPE 102', 'CMPE 120']::varchar[]),
    ('CS 154', ARRAY['CS 46B', 'MATH 42', 'MATH 42X']::varchar[]);

DO $$
BEGIN
    IF EXISTS (
        SELECT extracted.code
        FROM extracted_prerequisite_codes AS extracted
        LEFT JOIN course AS existing ON existing.code = extracted.code
        GROUP BY extracted.code
        HAVING count(existing.id) <> 1
    ) THEN
        RAISE EXCEPTION 'Expected exactly one existing course for each of the 26 roadmap codes';
    END IF;
END
$$;

UPDATE course AS existing
SET prerequisites = extracted.prerequisites
FROM extracted_prerequisite_codes AS extracted
WHERE existing.code = extracted.code
    AND existing.prerequisites IS DISTINCT FROM extracted.prerequisites
RETURNING existing.code, existing.prerequisites;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM extracted_prerequisite_codes AS extracted
        JOIN course AS existing ON existing.code = extracted.code
        WHERE existing.prerequisites IS DISTINCT FROM extracted.prerequisites
    ) THEN
        RAISE EXCEPTION 'Prerequisite code verification failed';
    END IF;
END
$$;

COMMIT;
