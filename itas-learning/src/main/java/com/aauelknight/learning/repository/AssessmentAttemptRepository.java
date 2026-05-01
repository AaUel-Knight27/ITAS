package com.aauelknight.learning.repository;

import com.aauelknight.learning.entity.AssessmentAttempt;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AssessmentAttemptRepository extends JpaRepository<AssessmentAttempt, Long> {

    long countByAssessmentIdAndUserId(Long assessmentId, Long userId);

    List<AssessmentAttempt> findByAssessmentIdAndUserIdOrderByAttemptNumberDesc(Long assessmentId, Long userId);

    boolean existsByAssessmentIdAndUserIdAndPassedTrue(Long assessmentId, Long userId);
}
