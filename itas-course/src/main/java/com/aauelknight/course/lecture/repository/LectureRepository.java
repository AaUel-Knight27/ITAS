package com.aauelknight.course.lecture.repository;
import com.aauelknight.course.lecture.entity.Lecture;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LectureRepository extends JpaRepository<Lecture, Long> {

    List<Lecture> findBySectionIdOrderByOrderIndexAsc(Long sectionId);

    List<Lecture> findBySectionCourseIdOrderBySectionOrderIndexAscOrderIndexAsc(Long courseId);

    long countBySectionCourseId(Long courseId);

    java.util.Optional<Lecture> findByIdAndSectionId(Long id, Long sectionId);

    @Query("SELECT l FROM Lecture l " +
            "JOIN FETCH l.section s " +
            "JOIN FETCH s.course c " +
            "WHERE l.id = :lectureId")
    Optional<Lecture> findByIdWithSectionAndCourse(@Param("lectureId") Long lectureId);

    @EntityGraph(attributePaths = {"section", "section.course"})
    Optional<Lecture> findWithSectionAndCourseById(Long id);

    @Query("SELECT l FROM Lecture l " +
            "JOIN FETCH l.section s " +
            "JOIN FETCH s.course c " +
            "LEFT JOIN FETCH c.category " +
            "WHERE c.published = true " +
            "AND c.status = 'PUBLISHED' " +
            "AND LOWER(l.title) LIKE LOWER(CONCAT('%', :query, '%')) " +
            "ORDER BY l.title ASC")
    List<Lecture> searchLectures(@Param("query") String query);
}



