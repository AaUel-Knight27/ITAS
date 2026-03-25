CREATE TABLE course_audience (
  course_id BIGINT NOT NULL REFERENCES courses(id),
  audience VARCHAR(50) NOT NULL
);
