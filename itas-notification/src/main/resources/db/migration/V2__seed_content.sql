SET search_path TO notify_schema;

INSERT INTO notify_schema.faqs (id, question, answer, category, order_index, created_at)
SELECT
    1,
    'How do I enroll in a course?',
    'Open a published course and use the enroll action from the learner dashboard.',
    'General',
    1,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM notify_schema.faqs WHERE id = 1
);

INSERT INTO notify_schema.announcements (id, title, content, is_active, created_by, created_at, updated_at)
SELECT
    1,
    'Welcome to the ITAS Portal',
    'Microservices migration verification content is available for local development.',
    TRUE,
    'system',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM notify_schema.announcements WHERE id = 1
);

INSERT INTO notify_schema.help_articles (
    id, title, content, page_id, field_id, category, tags, is_published, view_count, created_at, updated_at
)
SELECT
    1,
    'Course Enrollment Help',
    'Use the enroll button on a published course to add it to your learning dashboard.',
    'courses',
    'enroll',
    'Learning',
    'courses,enrollment',
    TRUE,
    0,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM notify_schema.help_articles WHERE id = 1
);

SELECT setval('notify_schema.notification_campaigns_id_seq', COALESCE((SELECT MAX(id) FROM notify_schema.notification_campaigns), 1), true);
SELECT setval('notify_schema.announcements_id_seq', COALESCE((SELECT MAX(id) FROM notify_schema.announcements), 1), true);
SELECT setval('notify_schema.faqs_id_seq', COALESCE((SELECT MAX(id) FROM notify_schema.faqs), 1), true);
SELECT setval('notify_schema.help_articles_id_seq', COALESCE((SELECT MAX(id) FROM notify_schema.help_articles), 1), true);
