package com.aauelknight.learning.repository;

import com.aauelknight.learning.entity.LectureCompletion;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LectureCompletionRepository extends JpaRepository<LectureCompletion, Long> {

    Optional<LectureCompletion> findByUserIdAndLectureId(Long userId, Long lectureId);

    boolean existsByUserIdAndLectureId(Long userId, Long lectureId);

    List<LectureCompletion> findByUserIdAndLectureIdIn(Long userId, List<Long> lectureIds);

    long countByUserIdAndLectureIdIn(Long userId, List<Long> lectureIds);
}
