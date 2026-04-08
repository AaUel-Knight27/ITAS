package com.aauelknight.itas_backend.learning.repository;

import com.aauelknight.itas_backend.learning.entity.CourseEnrollment;
import com.aauelknight.itas_backend.learning.entity.EnrollmentStatus;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface EnrollmentRepository extends JpaRepository<CourseEnrollment, Long> {

    Optional<CourseEnrollment> findByUserIdAndCourseId(Long userId, Long courseId);

    boolean existsByUserIdAndCourseIdAndStatusIn(Long userId, Long courseId, List<EnrollmentStatus> statuses);

    List<CourseEnrollment> findByUserIdOrderByEnrolledAtDesc(Long userId);

    long countByStatus(EnrollmentStatus status);

    @Query("SELECT COUNT(DISTINCT e.user.id) "
            + "FROM CourseEnrollment e "
            + "WHERE e.status = 'ACTIVE'")
    long countActiveLearners();

    @Query("SELECT CAST(e.enrolledAt AS date), "
            + "COUNT(e) "
            + "FROM CourseEnrollment e "
            + "WHERE e.enrolledAt >= :from "
            + "GROUP BY CAST(e.enrolledAt AS date) "
            + "ORDER BY CAST(e.enrolledAt AS date) ASC")
    List<Object[]> countEnrollmentsPerDay(@Param("from") LocalDateTime from);

    @Query("SELECT e.course.title, "
            + "COUNT(CASE WHEN e.status = 'COMPLETED' THEN 1 END) * 100.0 / COUNT(e) "
            + "FROM CourseEnrollment e "
            + "GROUP BY e.course.title "
            + "ORDER BY 2 DESC")
    List<Object[]> getCourseCompletionRates(Pageable pageable);
}
