package com.aauelknight.itas_backend.repository;

import com.aauelknight.itas_backend.entity.UserNotification;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface UserNotificationRepository extends JpaRepository<UserNotification, Long> {

    @Query("SELECT n FROM UserNotification n "
            + "LEFT JOIN FETCH n.campaign "
            + "WHERE n.user.id = :userId "
            + "ORDER BY n.deliveredAt DESC")
    List<UserNotification> findByUserId(@Param("userId") Long userId);

    long countByUserIdAndReadStatusFalse(Long userId);

    @Query("SELECT n FROM UserNotification n "
            + "WHERE n.user.id = :userId "
            + "AND n.readStatus = false")
    List<UserNotification> findUnreadByUserId(@Param("userId") Long userId);

    Optional<UserNotification> findByUserIdAndCampaignId(Long userId, Long campaignId);
}
