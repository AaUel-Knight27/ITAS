package com.aauelknight.itas_backend.repository;

import com.aauelknight.itas_backend.entity.IntegrationSyncLog;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface IntegrationSyncLogRepository extends JpaRepository<IntegrationSyncLog, Long> {

    @Query(value = "SELECT l FROM IntegrationSyncLog l "
            + "LEFT JOIN FETCH l.triggeredBy "
            + "ORDER BY l.startedAt DESC",
            countQuery = "SELECT COUNT(l) FROM IntegrationSyncLog l")
    Page<IntegrationSyncLog> findAllPaged(Pageable pageable);

    @Query("SELECT l FROM IntegrationSyncLog l "
            + "LEFT JOIN FETCH l.triggeredBy "
            + "WHERE l.systemName = :systemName "
            + "ORDER BY l.startedAt DESC")
    List<IntegrationSyncLog> findBySystemName(@Param("systemName") String systemName);

    @Query("SELECT l FROM IntegrationSyncLog l "
            + "LEFT JOIN FETCH l.triggeredBy "
            + "WHERE l.status = :status "
            + "ORDER BY l.startedAt DESC")
    List<IntegrationSyncLog> findByStatus(@Param("status") String status);

    @Query("SELECT l FROM IntegrationSyncLog l "
            + "LEFT JOIN FETCH l.triggeredBy "
            + "WHERE l.startedAt = ("
            + "SELECT MAX(l2.startedAt) "
            + "FROM IntegrationSyncLog l2 "
            + "WHERE l2.systemName = l.systemName"
            + ") "
            + "ORDER BY l.systemName ASC")
    List<IntegrationSyncLog> findLatestPerSystem();

    long countByStatus(String status);

    @Query(value = "SELECT l FROM IntegrationSyncLog l "
            + "LEFT JOIN FETCH l.triggeredBy "
            + "WHERE (:systemName IS NULL OR l.systemName = :systemName) "
            + "AND (:status IS NULL OR l.status = :status) "
            + "ORDER BY l.startedAt DESC",
            countQuery = "SELECT COUNT(l) FROM IntegrationSyncLog l "
                    + "WHERE (:systemName IS NULL OR l.systemName = :systemName) "
                    + "AND (:status IS NULL OR l.status = :status)")
    Page<IntegrationSyncLog> findFiltered(
            @Param("systemName") String systemName,
            @Param("status") String status,
            Pageable pageable);
}
