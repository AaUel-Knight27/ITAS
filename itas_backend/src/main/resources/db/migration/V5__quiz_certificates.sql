CREATE SEQUENCE IF NOT EXISTS certificate_code_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE assessments (
    id BIGSERIAL PRIMARY KEY,
    course_id BIGINT NOT NULL,
    section_id BIGINT,
    title VARCHAR(200) NOT NULL,
    passing_score DOUBLE PRECISION NOT NULL,
    max_attempts INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_assessment_course FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE,
    CONSTRAINT fk_assessment_section FOREIGN KEY (section_id) REFERENCES course_sections (id) ON DELETE SET NULL
);

CREATE TABLE assessment_questions (
    id BIGSERIAL PRIMARY KEY,
    assessment_id BIGINT NOT NULL,
    question_text TEXT NOT NULL,
    question_type VARCHAR(20) NOT NULL CHECK (question_type IN ('MCQ', 'TRUE_FALSE')),
    options_json TEXT,
    correct_answer TEXT NOT NULL,
    points INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT fk_assessment_question_assessment FOREIGN KEY (assessment_id) REFERENCES assessments (id) ON DELETE CASCADE
);

CREATE TABLE assessment_attempts (
    id BIGSERIAL PRIMARY KEY,
    assessment_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    score DOUBLE PRECISION NOT NULL,
    answers_json TEXT NOT NULL,
    attempt_number INTEGER NOT NULL,
    passed BOOLEAN NOT NULL DEFAULT FALSE,
    submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_assessment_attempt_assessment FOREIGN KEY (assessment_id) REFERENCES assessments (id) ON DELETE CASCADE,
    CONSTRAINT fk_assessment_attempt_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE certificates (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    course_id BIGINT NOT NULL,
    certificate_code VARCHAR(30) NOT NULL UNIQUE,
    qr_code TEXT NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    issued_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_certificate_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_certificate_course FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE,
    CONSTRAINT uq_certificate_user_course UNIQUE (user_id, course_id)
);

CREATE INDEX idx_assessment_course ON assessments (course_id);
CREATE INDEX idx_assessment_attempt_user_assessment ON assessment_attempts (user_id, assessment_id);
CREATE INDEX idx_certificate_user ON certificates (user_id);
CREATE INDEX idx_certificate_code ON certificates (certificate_code);