SET search_path TO course_schema;

INSERT INTO course_schema.categories (id, name, description)
SELECT 1, 'General Tax Education', 'Core tax education content'
WHERE NOT EXISTS (
    SELECT 1
    FROM course_schema.categories
    WHERE id = 1
);

INSERT INTO course_schema.courses (
    id,
    title,
    slug,
    description,
    difficulty,
    duration_minutes,
    thumbnail_url,
    published,
    status,
    archived_at,
    archived_by,
    category_id,
    created_at,
    updated_at
)
SELECT
    1,
    'Tax Fundamentals',
    'tax-fundamentals',
    'Foundational guidance for navigating the ITAS learning portal.',
    'BEGINNER',
    30,
    NULL,
    TRUE,
    'PUBLISHED',
    NULL,
    NULL,
    1,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1
    FROM course_schema.courses
    WHERE id = 1
);

INSERT INTO course_schema.course_sections (
    id,
    course_id,
    title,
    description,
    order_index
)
SELECT
    1,
    1,
    'Getting Started',
    'Introduction to the course and platform basics.',
    1
WHERE NOT EXISTS (
    SELECT 1
    FROM course_schema.course_sections
    WHERE id = 1
);

INSERT INTO course_schema.lectures (
    id,
    section_id,
    title,
    description,
    type,
    video_url,
    pdf_url,
    content,
    duration_seconds,
    order_index,
    is_preview
)
SELECT
    1,
    1,
    'Portal Overview',
    'A short overview lecture for the seeded starter course.',
    'VIDEO',
    NULL,
    NULL,
    NULL,
    300,
    1,
    TRUE
WHERE NOT EXISTS (
    SELECT 1
    FROM course_schema.lectures
    WHERE id = 1
);

INSERT INTO course_schema.course_audience (course_id, audience)
SELECT 1, 'ALL'
WHERE NOT EXISTS (
    SELECT 1
    FROM course_schema.course_audience
    WHERE course_id = 1
      AND audience = 'ALL'
);

SELECT setval(
    'course_schema.categories_id_seq',
    COALESCE((SELECT MAX(id) FROM course_schema.categories), 1),
    true
);

SELECT setval(
    'course_schema.courses_id_seq',
    COALESCE((SELECT MAX(id) FROM course_schema.courses), 1),
    true
);

SELECT setval(
    'course_schema.course_sections_id_seq',
    COALESCE((SELECT MAX(id) FROM course_schema.course_sections), 1),
    true
);

SELECT setval(
    'course_schema.lectures_id_seq',
    COALESCE((SELECT MAX(id) FROM course_schema.lectures), 1),
    true
);
