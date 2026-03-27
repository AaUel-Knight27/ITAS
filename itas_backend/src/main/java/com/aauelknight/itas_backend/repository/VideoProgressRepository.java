package com.aauelknight.itas_backend.repository;

import com.aauelknight.itas_backend.entity.VideoProgress;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VideoProgressRepository extends JpaRepository<VideoProgress, Long> {

    Optional<VideoProgress> findByUserIdAndLectureId(Long userId, Long lectureId);

    Optional<VideoProgress> findTopByUserIdAndLectureSectionCourseIdOrderByUpdatedAtDesc(Long userId, Long courseId);
}
