package com.aauelknight.admin.repository;

import com.aauelknight.admin.entity.IntegrationSyncLog;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface IntegrationSyncLogRepository extends JpaRepository<IntegrationSyncLog, Long> {

    @Query("SELECT l FROM IntegrationSyncLog l ORDER BY l.startedAt DESC")
    List<IntegrationSyncLog> findAllOrdered();

    List<IntegrationSyncLog> findBySystemNameOrderByStartedAtDesc(String systemName);
}
