package com.aauelknight.admin.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "integration_sync_logs", schema = "admin_schema")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IntegrationSyncLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "system_name", nullable = false, length = 100)
    private String systemName;

    @Column(name = "sync_type", nullable = false, length = 100)
    private String syncType;

    @Column(nullable = false, length = 30)
    private String status;

    @Column(name = "records_processed", nullable = false)
    @Builder.Default
    private Integer recordsProcessed = 0;

    @Column(name = "records_failed", nullable = false)
    @Builder.Default
    private Integer recordsFailed = 0;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "triggered_by_username", length = 100)
    private String triggeredByUsername;

    @Column(name = "started_at", nullable = false, updatable = false)
    private LocalDateTime startedAt;

    @Column(name = "finished_at")
    private LocalDateTime finishedAt;

    @PrePersist
    public void onCreate() {
        if (startedAt == null) {
            startedAt = LocalDateTime.now();
        }
        if (recordsProcessed == null) {
            recordsProcessed = 0;
        }
        if (recordsFailed == null) {
            recordsFailed = 0;
        }
    }
}
