SET search_path TO course_schema;

INSERT INTO course_schema.categories (id, name, description)
SELECT c.id, c.name, c.description
FROM public.categories c
ON CONFLICT (id) DO NOTHING;

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
    updated_at,
    search_vector
)
SELECT
    c.id,
    c.title,
    c.slug,
    c.description,
    c.difficulty,
    c.duration_minutes,
    c.thumbnail_url,
    c.published,
    c.status,
    c.archived_at,
    c.archived_by,
    c.category_id,
    c.created_at,
    c.updated_at,
    c.search_vector
FROM public.courses c
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_schema.course_sections (
    id,
    course_id,
    title,
    description,
    order_index
)
SELECT
    s.id,
    s.course_id,
    s.title,
    s.description,
    s.order_index
FROM public.course_sections s
ON CONFLICT (id) DO NOTHING;

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
    l.id,
    l.section_id,
    l.title,
    l.description,
    l.type,
    l.video_url,
    l.pdf_url,
    l.content,
    l.duration_seconds,
    l.order_index,
    l.is_preview
FROM public.lectures l
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_schema.course_audience (course_id, audience)
SELECT ca.course_id, ca.audience
FROM public.course_audience ca
WHERE NOT EXISTS (
    SELECT 1
    FROM course_schema.course_audience target
    WHERE target.course_id = ca.course_id
      AND target.audience = ca.audience
);

INSERT INTO course_schema.content_versions (
    id,
    lecture_id,
    version_number,
    file_path,
    file_type,
    file_size,
    change_notes,
    uploaded_by,
    created_at
)
SELECT
    cv.id,
    cv.lecture_id,
    cv.version_number,
    cv.file_path,
    cv.file_type,
    cv.file_size,
    cv.change_notes,
    cv.uploaded_by,
    cv.created_at
FROM public.content_versions cv
ON CONFLICT (id) DO NOTHING;

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

SELECT setval(
    'course_schema.content_versions_id_seq',
    COALESCE((SELECT MAX(id) FROM course_schema.content_versions), 1),
    true
);
