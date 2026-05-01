package com.aauelknight.learning.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "video_progress", schema = "learning_schema",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "lecture_id"}))
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VideoProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "lecture_id", nullable = false)
    private Long lectureId;

    @Builder.Default
    @Column(name = "watched_seconds", nullable = false)
    private Integer watchedSeconds = 0;

    @Builder.Default
    @Column(name = "last_position", nullable = false)
    private Integer lastPosition = 0;

    @Builder.Default
    @Column(name = "completion_percentage", nullable = false)
    private Double completionPercentage = 0.0;

    @Builder.Default
    @Column(name = "last_watched_at", nullable = false)
    private LocalDateTime lastWatchedAt = LocalDateTime.now();

    @PrePersist
    @PreUpdate
    public void onUpdate() {
        if (watchedSeconds == null) {
            watchedSeconds = 0;
        }
        if (lastPosition == null) {
            lastPosition = 0;
        }
        if (completionPercentage == null) {
            completionPercentage = 0.0;
        }
        lastWatchedAt = LocalDateTime.now();
    }
}
