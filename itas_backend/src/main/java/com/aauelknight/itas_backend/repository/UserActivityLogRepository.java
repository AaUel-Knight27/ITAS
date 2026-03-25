package com.aauelknight.itas_backend.repository;

import com.aauelknight.itas_backend.entity.UserActivityLog;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface UserActivityLogRepository extends JpaRepository<UserActivityLog, Long> {

    List<UserActivityLog> findTop20ByOrderByCreatedAtDesc();

    List<UserActivityLog> findAllByOrderByCreatedAtDesc();

    @Query(value = "SELECT l FROM UserActivityLog l "
            + "LEFT JOIN FETCH l.user u "
            + "WHERE (:activityType IS NULL OR l.activityType = :activityType) "
            + "AND (:username IS NULL OR u.username = :username) "
            + "ORDER BY l.createdAt DESC",
            countQuery = "SELECT COUNT(l) FROM UserActivityLog l "
                    + "LEFT JOIN l.user u "
                    + "WHERE (:activityType IS NULL OR l.activityType = :activityType) "
                    + "AND (:username IS NULL OR u.username = :username)")
    Page<UserActivityLog> findAllFiltered(
            @Param("activityType") String activityType,
            @Param("username") String username,
            Pageable pageable);
}
