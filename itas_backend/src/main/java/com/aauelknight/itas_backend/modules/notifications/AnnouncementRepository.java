package com.aauelknight.itas_backend.modules.notifications;

import com.aauelknight.itas_backend.modules.notifications.Announcement;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {

    @Query("SELECT a FROM Announcement a "
            + "LEFT JOIN FETCH a.createdBy "
            + "ORDER BY a.createdAt DESC")
    List<Announcement> findAllWithCreator();

    @Query("SELECT a FROM Announcement a "
            + "WHERE a.isActive = true "
            + "ORDER BY a.createdAt DESC")
    List<Announcement> findAllActive();
}
