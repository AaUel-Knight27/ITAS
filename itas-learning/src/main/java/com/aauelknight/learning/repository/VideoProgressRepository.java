package com.aauelknight.learning.repository;

import com.aauelknight.learning.entity.VideoProgress;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VideoProgressRepository extends JpaRepository<VideoProgress, Long> {

    Optional<VideoProgress> findByUserIdAndLectureId(Long userId, Long lectureId);

    Optional<VideoProgress> findTopByUserIdAndLectureIdInOrderByLastWatchedAtDesc(Long userId, List<Long> lectureIds);
}
