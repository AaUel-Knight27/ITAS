package com.aauelknight.admin.repository;

import com.aauelknight.admin.entity.UserActivityLog;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface UserActivityLogRepository extends JpaRepository<UserActivityLog, Long> {

    @Query("SELECT l FROM UserActivityLog l ORDER BY l.createdAt DESC")
    Page<UserActivityLog> findAllOrdered(Pageable pageable);

    List<UserActivityLog> findByUserIdOrderByCreatedAtDesc(Long userId);

    @Query("SELECT l FROM UserActivityLog l WHERE l.activityType = :type ORDER BY l.createdAt DESC")
    Page<UserActivityLog> findByActivityType(@Param("type") String activityType, Pageable pageable);

    @Query("SELECT l FROM UserActivityLog l WHERE l.createdAt >= :since ORDER BY l.createdAt DESC")
    List<UserActivityLog> findRecentActivity(@Param("since") LocalDateTime since);

    @Query("SELECT l.activityType, COUNT(l) FROM UserActivityLog l GROUP BY l.activityType ORDER BY COUNT(l) DESC")
    List<Object[]> countByActivityType();
}
