package com.aauelknight.webinar.entity;

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
@Table(name = "webinars", schema = "webinar_schema")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Webinar {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "scheduled_at", nullable = false)
    private LocalDateTime scheduledAt;

    @Column(name = "duration_minutes")
    private Integer durationMinutes;

    @Column(name = "meeting_link", length = 500)
    private String meetingLink;

    @Column(name = "presenter_name", length = 200)
    private String presenterName;

    @Column(name = "max_attendees")
    private Integer maxAttendees;

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "SCHEDULED";

    @Column(name = "created_by", length = 100)
    private String createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void onCreate() {
        if (status == null || status.isBlank()) {
            status = "SCHEDULED";
        }
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
