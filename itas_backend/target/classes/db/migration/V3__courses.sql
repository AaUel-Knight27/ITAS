CREATE TABLE categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE courses (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(200) NOT NULL UNIQUE,
    description TEXT,
    difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('BEGINNER', 'INTERMEDIATE', 'ADVANCED')),
    duration_minutes INTEGER,
    thumbnail_url TEXT,
    published BOOLEAN NOT NULL DEFAULT FALSE,
    category_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_courses_category FOREIGN KEY (category_id) REFERENCES categories (id)
);

CREATE TABLE course_sections (
    id BIGSERIAL PRIMARY KEY,
    course_id BIGINT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL,
    CONSTRAINT fk_sections_course FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE
);

CREATE TABLE lectures (
    id BIGSERIAL PRIMARY KEY,
    section_id BIGINT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    type VARCHAR(20) NOT NULL CHECK (type IN ('VIDEO', 'PDF', 'TEXT', 'QUIZ')),
    video_url VARCHAR(500),
    pdf_url VARCHAR(500),
    duration_seconds INTEGER,
    order_index INTEGER NOT NULL,
    is_preview BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_lectures_section FOREIGN KEY (section_id) REFERENCES course_sections (id) ON DELETE CASCADE
);

CREATE INDEX idx_courses_slug ON courses (slug);
CREATE INDEX idx_courses_category_id ON courses (category_id);
CREATE INDEX idx_courses_published ON courses (published);
CREATE INDEX idx_course_sections_course_id ON course_sections (course_id);
CREATE INDEX idx_lectures_section_id ON lectures (section_id);
