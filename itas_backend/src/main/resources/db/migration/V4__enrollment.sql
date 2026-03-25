CREATE TABLE course_enrollments (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    course_id BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('ACTIVE', 'COMPLETED', 'DROPPED')),
    progress_percent DOUBLE PRECISION NOT NULL DEFAULT 0,
    enrolled_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    CONSTRAINT fk_enrollment_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_enrollment_course FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE,
    CONSTRAINT uq_enrollment_user_course UNIQUE (user_id, course_id)
);

CREATE TABLE lecture_completions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    lecture_id BIGINT NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMP,
    CONSTRAINT fk_completion_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_completion_lecture FOREIGN KEY (lecture_id) REFERENCES lectures (id) ON DELETE CASCADE,
    CONSTRAINT uq_completion_user_lecture UNIQUE (user_id, lecture_id)
);

CREATE TABLE video_progress (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    lecture_id BIGINT NOT NULL,
    watched_seconds INTEGER NOT NULL DEFAULT 0,
    completion_percentage DOUBLE PRECISION NOT NULL DEFAULT 0,
    last_position INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_video_progress_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_video_progress_lecture FOREIGN KEY (lecture_id) REFERENCES lectures (id) ON DELETE CASCADE,
    CONSTRAINT uq_video_progress_user_lecture UNIQUE (user_id, lecture_id)
);

CREATE INDEX idx_enrollment_user ON course_enrollments (user_id);
CREATE INDEX idx_enrollment_course ON course_enrollments (course_id);
CREATE INDEX idx_completion_user ON lecture_completions (user_id);
CREATE INDEX idx_completion_lecture ON lecture_completions (lecture_id);
CREATE INDEX idx_video_progress_user ON video_progress (user_id);
CREATE INDEX idx_video_progress_lecture ON video_progress (lecture_id);
