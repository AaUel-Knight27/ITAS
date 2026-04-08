package com.aauelknight.itas_backend.learning.repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.aauelknight.itas_backend.learning.entity.LectureCompletion;
public interface LectureCompletionRepository extends JpaRepository<LectureCompletion, Long> {

    Optional<LectureCompletion> findByUserIdAndLectureId(Long userId, Long lectureId);

    boolean existsByUserIdAndLectureId(Long userId, Long lectureId);

    Optional<LectureCompletion> findTopByUserIdAndLectureSectionCourseIdAndCompletedTrueOrderByCompletedAtDesc(
            Long userId,
            Long courseId);

    @Query("""
            select lc.lecture.id
            from LectureCompletion lc
            where lc.user.id = :userId
            and lc.lecture.section.course.id = :courseId
            and lc.completed = true
            order by lc.completedAt desc
            """)
    List<Long> findCompletedLectureIdsByUserAndCourse(@Param("userId") Long userId, @Param("courseId") Long courseId);

    @Query("""
            select count(lc.id)
            from LectureCompletion lc
            where lc.user.id = :userId
            and lc.lecture.section.course.id = :courseId
            and lc.completed = true
            """)
    long countCompletedLecturesByUserAndCourse(@Param("userId") Long userId, @Param("courseId") Long courseId);
}
