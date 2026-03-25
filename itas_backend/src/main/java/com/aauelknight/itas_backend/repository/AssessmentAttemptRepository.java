package com.aauelknight.itas_backend.repository;

import com.aauelknight.itas_backend.entity.AssessmentAttempt;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface AssessmentAttemptRepository extends JpaRepository<AssessmentAttempt, Long> {

    long countByUserIdAndAssessmentId(Long userId, Long assessmentId);

    List<AssessmentAttempt> findByUserIdAndAssessmentIdOrderByAttemptNumberDesc(Long userId, Long assessmentId);

    @Query("SELECT AVG(a.score) "
            + "FROM AssessmentAttempt a "
            + "WHERE a.passed = true")
    Double getAveragePassingScore();

    @Query("SELECT a.assessment.course.title, "
            + "COUNT(CASE WHEN a.passed = true THEN 1 END) * 100.0 / COUNT(a) "
            + "FROM AssessmentAttempt a "
            + "GROUP BY a.assessment.course.title")
    List<Object[]> getQuizPassRatesByCourse();
}
