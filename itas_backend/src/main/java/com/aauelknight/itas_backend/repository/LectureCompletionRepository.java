package com.aauelknight.itas_backend.repository;

import com.aauelknight.itas_backend.entity.LectureCompletion;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface LectureCompletionRepository extends JpaRepository<LectureCompletion, Long> {

    Optional<LectureCompletion> findByUserIdAndLectureId(Long userId, Long lectureId);

    @Query("""
            select count(lc.id)
            from LectureCompletion lc
            where lc.user.id = :userId
            and lc.lecture.section.course.id = :courseId
            and lc.completed = true
            """)
    long countCompletedLecturesByUserAndCourse(@Param("userId") Long userId, @Param("courseId") Long courseId);
}
