package com.aauelknight.itas_backend.repository;

import com.aauelknight.itas_backend.entity.AssessmentQuestion;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AssessmentQuestionRepository extends JpaRepository<AssessmentQuestion, Long> {

    List<AssessmentQuestion> findByAssessmentIdOrderByIdAsc(Long assessmentId);

    java.util.Optional<AssessmentQuestion> findByIdAndAssessmentId(Long id, Long assessmentId);
}
