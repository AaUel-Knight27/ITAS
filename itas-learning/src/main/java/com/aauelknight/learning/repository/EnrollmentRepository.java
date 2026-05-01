package com.aauelknight.learning.repository;

import com.aauelknight.learning.entity.CourseEnrollment;
import com.aauelknight.learning.entity.EnrollmentStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EnrollmentRepository extends JpaRepository<CourseEnrollment, Long> {

    Optional<CourseEnrollment> findByUserIdAndCourseId(Long userId, Long courseId);

    List<CourseEnrollment> findByUserIdOrderByEnrolledAtDesc(Long userId);

    boolean existsByUserIdAndCourseId(Long userId, Long courseId);

    boolean existsByUserIdAndCourseIdAndStatusIn(Long userId, Long courseId, List<EnrollmentStatus> statuses);

    long countByCourseId(Long courseId);

    long countByStatus(EnrollmentStatus status);
}
