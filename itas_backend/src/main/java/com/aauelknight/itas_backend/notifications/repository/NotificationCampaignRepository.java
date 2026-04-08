package com.aauelknight.itas_backend.notifications.repository;
import com.aauelknight.itas_backend.notifications.entity.NotificationCampaign;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface NotificationCampaignRepository extends JpaRepository<NotificationCampaign, Long> {

    @Query("SELECT c FROM NotificationCampaign c "
            + "LEFT JOIN FETCH c.createdBy "
            + "ORDER BY c.createdAt DESC")
    List<NotificationCampaign> findAllWithCreator();

    @Query("SELECT c FROM NotificationCampaign c "
            + "WHERE c.audienceType = :audienceType "
            + "ORDER BY c.createdAt DESC")
    List<NotificationCampaign> findByAudienceType(@Param("audienceType") String audienceType);
}

