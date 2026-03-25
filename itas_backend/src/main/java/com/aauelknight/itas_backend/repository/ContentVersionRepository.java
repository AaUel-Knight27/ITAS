package com.aauelknight.itas_backend.repository;

import com.aauelknight.itas_backend.entity.ContentVersion;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ContentVersionRepository extends JpaRepository<ContentVersion, Long> {

    @Query("SELECT v FROM ContentVersion v " +
            "LEFT JOIN FETCH v.uploadedBy " +
            "LEFT JOIN FETCH v.lecture " +
            "WHERE v.lecture.id = :lectureId " +
            "ORDER BY v.versionNumber DESC")
    List<ContentVersion> findByLectureId(@Param("lectureId") Long lectureId);

    @Query("SELECT MAX(v.versionNumber) FROM ContentVersion v WHERE v.lecture.id = :lectureId")
    Optional<Integer> findMaxVersionByLectureId(@Param("lectureId") Long lectureId);

    long countByLectureId(Long lectureId);
}
