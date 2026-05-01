CREATE SCHEMA IF NOT EXISTS learning_schema;
SET search_path TO learning_schema;

CREATE SEQUENCE IF NOT EXISTS
    certificate_code_seq
    START WITH 1 INCREMENT BY 1;

CREATE TABLE IF NOT EXISTS course_enrollments (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    course_id BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL
        DEFAULT 'ACTIVE',
    progress_percent DOUBLE PRECISION
        NOT NULL DEFAULT 0,
    enrolled_at TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    CONSTRAINT uq_enrollment_user_course
        UNIQUE (user_id, course_id)
);

CREATE INDEX IF NOT EXISTS
    idx_enrollment_user_id
    ON course_enrollments(user_id);
CREATE INDEX IF NOT EXISTS
    idx_enrollment_course_id
    ON course_enrollments(course_id);

CREATE TABLE IF NOT EXISTS video_progress (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    lecture_id BIGINT NOT NULL,
    watched_seconds INTEGER NOT NULL
        DEFAULT 0,
    last_position INTEGER NOT NULL
        DEFAULT 0,
    completion_percentage DOUBLE PRECISION
        NOT NULL DEFAULT 0,
    last_watched_at TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_video_progress_user_lecture
        UNIQUE (user_id, lecture_id)
);

CREATE INDEX IF NOT EXISTS
    idx_video_progress_user_lecture
    ON video_progress(user_id, lecture_id);

CREATE TABLE IF NOT EXISTS lecture_completions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    lecture_id BIGINT NOT NULL,
    completed_at TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_completion_user_lecture
        UNIQUE (user_id, lecture_id)
);

CREATE INDEX IF NOT EXISTS
    idx_completion_user_id
    ON lecture_completions(user_id);
CREATE INDEX IF NOT EXISTS
    idx_completion_lecture_id
    ON lecture_completions(lecture_id);

CREATE TABLE IF NOT EXISTS assessments (
    id BIGSERIAL PRIMARY KEY,
    course_id BIGINT NOT NULL,
    section_id BIGINT,
    title VARCHAR(200) NOT NULL,
    passing_score DOUBLE PRECISION
        NOT NULL DEFAULT 70.0,
    max_attempts INTEGER NOT NULL
        DEFAULT 3,
    is_final_exam BOOLEAN NOT NULL
        DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS
    idx_assessment_course_id
    ON assessments(course_id);
CREATE INDEX IF NOT EXISTS
    idx_assessment_section_id
    ON assessments(section_id);

CREATE TABLE IF NOT EXISTS assessment_questions (
    id BIGSERIAL PRIMARY KEY,
    assessment_id BIGINT NOT NULL
        REFERENCES assessments(id)
        ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type VARCHAR(20) NOT NULL
        CHECK (question_type IN
            ('MCQ', 'TRUE_FALSE')),
    options_json TEXT,
    correct_answer TEXT NOT NULL,
    explanation TEXT,
    points INTEGER NOT NULL DEFAULT 1,
    order_index INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS
    idx_question_assessment_id
    ON assessment_questions(assessment_id);

CREATE TABLE IF NOT EXISTS assessment_attempts (
    id BIGSERIAL PRIMARY KEY,
    assessment_id BIGINT NOT NULL
        REFERENCES assessments(id)
        ON DELETE CASCADE,
    user_id BIGINT NOT NULL,
    score DOUBLE PRECISION NOT NULL,
    answers_json TEXT NOT NULL DEFAULT '[]',
    attempt_number INTEGER NOT NULL,
    passed BOOLEAN NOT NULL DEFAULT FALSE,
    submitted_at TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS
    idx_attempt_assessment_user
    ON assessment_attempts(assessment_id, user_id);

CREATE TABLE IF NOT EXISTS certificates (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    course_id BIGINT NOT NULL,
    certificate_code VARCHAR(30) NOT NULL
        UNIQUE,
    verification_uuid VARCHAR(36) NOT NULL
        UNIQUE,
    qr_code TEXT NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    issued_at TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_cert_user_course
        UNIQUE (user_id, course_id)
);

CREATE INDEX IF NOT EXISTS
    idx_cert_user_id
    ON certificates(user_id);
CREATE INDEX IF NOT EXISTS
    idx_cert_code
    ON certificates(certificate_code);
CREATE INDEX IF NOT EXISTS
    idx_cert_uuid
    ON certificates(verification_uuid);
