package com.aauelknight.notification.repository;

import com.aauelknight.notification.entity.Announcement;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {

    @Query("SELECT a FROM Announcement a ORDER BY a.createdAt DESC")
    List<Announcement> findAllOrdered();

    @Query("SELECT a FROM Announcement a WHERE a.isActive = true ORDER BY a.createdAt DESC")
    List<Announcement> findAllActive();
}
