package com.aauelknight.course.courses.repository;
import com.aauelknight.course.courses.entity.CourseSection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CourseSectionRepository extends JpaRepository<CourseSection, Long> {

    List<CourseSection> findByCourseIdOrderByOrderIndexAsc(Long courseId);

    java.util.Optional<CourseSection> findByIdAndCourseId(Long id, Long courseId);
}



