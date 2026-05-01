package com.aauelknight.learning.repository;

import com.aauelknight.learning.entity.AssessmentQuestion;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AssessmentQuestionRepository extends JpaRepository<AssessmentQuestion, Long> {

    List<AssessmentQuestion> findByAssessmentIdOrderByOrderIndexAscIdAsc(Long assessmentId);

    Optional<AssessmentQuestion> findByIdAndAssessmentId(Long id, Long assessmentId);
}
