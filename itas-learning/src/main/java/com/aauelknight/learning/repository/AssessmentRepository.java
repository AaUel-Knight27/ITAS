package com.aauelknight.learning.repository;

import com.aauelknight.learning.entity.Assessment;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AssessmentRepository extends JpaRepository<Assessment, Long> {

    List<Assessment> findByCourseId(Long courseId);

    Optional<Assessment> findByCourseIdAndSectionId(Long courseId, Long sectionId);

    Optional<Assessment> findByCourseIdAndIsFinalExamTrue(Long courseId);

    Optional<Assessment> findFirstByCourseIdAndIsFinalExamTrueOrderByCreatedAtDesc(Long courseId);

    List<Assessment> findBySectionId(Long sectionId);
}
