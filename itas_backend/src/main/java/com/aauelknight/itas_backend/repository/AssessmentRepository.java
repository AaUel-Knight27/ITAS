package com.aauelknight.itas_backend.repository;

import com.aauelknight.itas_backend.entity.Assessment;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AssessmentRepository extends JpaRepository<Assessment, Long> {

    Optional<Assessment> findByLectureId(Long lectureId);

    List<Assessment> findByCourseId(Long courseId);

    List<Assessment> findByCourseIdOrderByCreatedAtDesc(Long courseId);
}
