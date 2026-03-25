ALTER TABLE courses
    ADD COLUMN IF NOT EXISTS search_vector
    TSVECTOR;

UPDATE courses
SET search_vector =
    to_tsvector('english',
        COALESCE(title, '') || ' ' ||
        COALESCE(description, ''));

CREATE INDEX IF NOT EXISTS idx_courses_search_vector
    ON courses USING GIN(search_vector);

CREATE OR REPLACE FUNCTION update_course_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        to_tsvector('english',
            COALESCE(NEW.title, '') || ' ' ||
            COALESCE(NEW.description, ''));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS courses_search_vector_update
    ON courses;

CREATE TRIGGER courses_search_vector_update
    BEFORE INSERT OR UPDATE
    ON courses
    FOR EACH ROW
    EXECUTE FUNCTION update_course_search_vector();
