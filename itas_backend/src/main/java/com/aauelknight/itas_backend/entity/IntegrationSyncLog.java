package com.aauelknight.itas_backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "integration_sync_logs")
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

    @Column(length = 50)
    @Builder.Default
    private String status = "PENDING";

    @Column(name = "records_processed")
    @Builder.Default
    private Integer recordsProcessed = 0;

    @Column(name = "records_failed")
    @Builder.Default
    private Integer recordsFailed = 0;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "triggered_by")
    private User triggeredBy;

    @Column(name = "started_at", updatable = false)
    private LocalDateTime startedAt;

    @Column(name = "finished_at")
    private LocalDateTime finishedAt;

    @Column(name = "duration_ms")
    private Long durationMs;

    @PrePersist
    protected void onCreate() {
        if (startedAt == null) {
            startedAt = LocalDateTime.now();
        }
    }
}
