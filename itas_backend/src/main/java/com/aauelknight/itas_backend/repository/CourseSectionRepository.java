package com.aauelknight.itas_backend.repository;

import com.aauelknight.itas_backend.entity.CourseSection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CourseSectionRepository extends JpaRepository<CourseSection, Long> {

    List<CourseSection> findByCourseIdOrderByOrderIndexAsc(Long courseId);

    java.util.Optional<CourseSection> findByIdAndCourseId(Long id, Long courseId);
}
