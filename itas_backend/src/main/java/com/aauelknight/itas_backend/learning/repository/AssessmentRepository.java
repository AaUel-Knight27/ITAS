package com.aauelknight.itas_backend.learning.repository;
import com.aauelknight.itas_backend.learning.entity.Assessment;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AssessmentRepository extends JpaRepository<Assessment, Long> {

    List<Assessment> findByLectureId(Long lectureId);

    List<Assessment> findByCourseId(Long courseId);

    List<Assessment> findByCourseIdOrderByCreatedAtDesc(Long courseId);

    Optional<Assessment> findFirstByCourseIdAndIsFinalExamTrueOrderByCreatedAtDesc(Long courseId);
}

