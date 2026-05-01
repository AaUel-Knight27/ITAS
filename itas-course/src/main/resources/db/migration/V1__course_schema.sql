CREATE SCHEMA IF NOT EXISTS course_schema;
SET search_path TO course_schema;

CREATE TABLE IF NOT EXISTS categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE IF NOT EXISTS courses (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(200) NOT NULL UNIQUE,
    description TEXT,
    difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('BEGINNER', 'INTERMEDIATE', 'ADVANCED')),
    duration_minutes INTEGER,
    thumbnail_url TEXT,
    published BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    archived_at TIMESTAMP,
    archived_by BIGINT,
    category_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    search_vector TSVECTOR,
    CONSTRAINT fk_courses_category FOREIGN KEY (category_id) REFERENCES categories (id)
);

CREATE TABLE IF NOT EXISTS course_sections (
    id BIGSERIAL PRIMARY KEY,
    course_id BIGINT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL,
    CONSTRAINT fk_sections_course FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS lectures (
    id BIGSERIAL PRIMARY KEY,
    section_id BIGINT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    type VARCHAR(20) NOT NULL CHECK (type IN ('VIDEO', 'PDF', 'TEXT', 'QUIZ')),
    video_url VARCHAR(500),
    pdf_url VARCHAR(500),
    content TEXT,
    duration_seconds INTEGER,
    order_index INTEGER NOT NULL,
    is_preview BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_lectures_section FOREIGN KEY (section_id) REFERENCES course_sections (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS course_audience (
    course_id BIGINT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    audience VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS content_versions (
    id BIGSERIAL PRIMARY KEY,
    lecture_id BIGINT NOT NULL REFERENCES lectures(id) ON DELETE CASCADE,
    version_number INT NOT NULL DEFAULT 1,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size BIGINT,
    change_notes TEXT,
    uploaded_by BIGINT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_courses_slug ON courses (slug);
CREATE INDEX IF NOT EXISTS idx_courses_category_id ON courses (category_id);
CREATE INDEX IF NOT EXISTS idx_courses_published ON courses (published);
CREATE INDEX IF NOT EXISTS idx_course_sections_course_id ON course_sections (course_id);
CREATE INDEX IF NOT EXISTS idx_lectures_section_id ON lectures (section_id);
CREATE INDEX IF NOT EXISTS idx_content_versions_lecture_id ON content_versions (lecture_id);
CREATE INDEX IF NOT EXISTS idx_courses_search_vector ON courses USING GIN (search_vector);

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

DROP TRIGGER IF EXISTS courses_search_vector_update ON courses;

CREATE TRIGGER courses_search_vector_update
    BEFORE INSERT OR UPDATE
    ON courses
    FOR EACH ROW
    EXECUTE FUNCTION update_course_search_vector();
