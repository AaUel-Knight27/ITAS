package com.aauelknight.notification.repository;

import com.aauelknight.notification.entity.NotificationCampaign;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface NotificationCampaignRepository extends JpaRepository<NotificationCampaign, Long> {

    @Query("SELECT c FROM NotificationCampaign c ORDER BY c.createdAt DESC")
    List<NotificationCampaign> findAllByCreatedAtDesc();
}
