-- 1A: Verify schema integrity
SELECT
    n.nspname AS schema_name,
    COUNT(t.tablename) AS table_count
FROM pg_namespace n
LEFT JOIN pg_tables t ON t.schemaname = n.nspname
WHERE n.nspname IN (
    'auth_schema', 'course_schema',
    'learning_schema', 'webinar_schema',
    'notify_schema', 'admin_schema'
)
GROUP BY n.nspname
ORDER BY n.nspname;

-- 1B: Remove the old public schema data
-- NOTE: Please ensure you ran pg_dump first:
-- pg_dump -U postgres -n public portal_db > C:\Users\AaUel Knight\Documents\ITAS\backup_public_schema.sql

DROP TABLE IF EXISTS public.user_notifications CASCADE;
DROP TABLE IF EXISTS public.assessment_attempts CASCADE;
DROP TABLE IF EXISTS public.certificates CASCADE;
DROP TABLE IF EXISTS public.lecture_completions CASCADE;
DROP TABLE IF EXISTS public.video_progress CASCADE;
DROP TABLE IF EXISTS public.course_enrollments CASCADE;
DROP TABLE IF EXISTS public.assessment_questions CASCADE;
DROP TABLE IF EXISTS public.assessments CASCADE;
DROP TABLE IF EXISTS public.webinar_registrations CASCADE;
DROP TABLE IF EXISTS public.webinars CASCADE;
DROP TABLE IF EXISTS public.content_versions CASCADE;
DROP TABLE IF EXISTS public.help_articles CASCADE;
DROP TABLE IF EXISTS public.integration_sync_logs CASCADE;
DROP TABLE IF EXISTS public.user_activity_logs CASCADE;
DROP TABLE IF EXISTS public.notification_campaigns CASCADE;
DROP TABLE IF EXISTS public.announcements CASCADE;
DROP TABLE IF EXISTS public.faqs CASCADE;
DROP TABLE IF EXISTS public.lectures CASCADE;
DROP TABLE IF EXISTS public.course_sections CASCADE;
DROP TABLE IF EXISTS public.course_audience CASCADE;
DROP TABLE IF EXISTS public.courses CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.roles CASCADE;
DROP SEQUENCE IF EXISTS public.certificate_code_seq;

DROP TABLE IF EXISTS public.flyway_schema_history CASCADE;

-- Verify public schema is clean:
SELECT tablename FROM pg_tables
WHERE schemaname = 'public';

-- 1C: Add missing indexes for performance

-- auth_schema
CREATE INDEX IF NOT EXISTS idx_users_role_id ON auth_schema.users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_status ON auth_schema.users(status);

-- course_schema
CREATE INDEX IF NOT EXISTS idx_courses_published ON course_schema.courses(published);
CREATE INDEX IF NOT EXISTS idx_courses_status ON course_schema.courses(status);
CREATE INDEX IF NOT EXISTS idx_courses_updated_at ON course_schema.courses(updated_at);

-- learning_schema
CREATE INDEX IF NOT EXISTS idx_enrollment_status ON learning_schema.course_enrollments(status);
CREATE INDEX IF NOT EXISTS idx_attempts_passed ON learning_schema.assessment_attempts(passed);
CREATE INDEX IF NOT EXISTS idx_cert_issued_at ON learning_schema.certificates(issued_at);

-- admin_schema
CREATE INDEX IF NOT EXISTS idx_activity_username ON admin_schema.user_activity_logs(username);

-- 1D: Run VACUUM and ANALYZE
VACUUM ANALYZE auth_schema.users;
VACUUM ANALYZE course_schema.courses;
VACUUM ANALYZE course_schema.lectures;
VACUUM ANALYZE learning_schema.course_enrollments;
VACUUM ANALYZE learning_schema.assessment_attempts;
VACUUM ANALYZE learning_schema.certificates;
