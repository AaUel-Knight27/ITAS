package com.aauelknight.itas_backend.modules.learning;

import com.aauelknight.itas_backend.modules.learning.VideoProgress;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface VideoProgressRepository extends JpaRepository<VideoProgress, Long> {

    Optional<VideoProgress> findByUserIdAndLectureId(Long userId, Long lectureId);

    @Query("SELECT vp FROM VideoProgress vp " +
            "JOIN vp.lecture l " +
            "JOIN l.section s " +
            "WHERE vp.user.id = :userId " +
            "AND s.course.id = :courseId " +
            "ORDER BY vp.updatedAt DESC")
    List<VideoProgress> findByUserAndCourse(@Param("userId") Long userId, @Param("courseId") Long courseId);

    @Query(value = "SELECT vp.* FROM video_progress vp " +
            "JOIN lectures l ON vp.lecture_id = l.id " +
            "JOIN course_sections s ON l.section_id = s.id " +
            "WHERE vp.user_id = :userId " +
            "AND s.course_id = :courseId " +
            "AND vp.last_position > 0 " +
            "ORDER BY vp.updated_at DESC " +
            "LIMIT 1", nativeQuery = true)
    Optional<VideoProgress> findLastWatchedInCourse(@Param("userId") Long userId, @Param("courseId") Long courseId);
}
