package com.aauelknight.itas_backend.modules.learning;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import com.aauelknight.itas_backend.modules.auth.User;
import com.aauelknight.itas_backend.modules.courses.Lecture;
@Entity
@Table(name = "video_progress")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VideoProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lecture_id", nullable = false)
    private Lecture lecture;

    @Column(name = "watched_seconds")
    @Builder.Default
    private Integer watchedSeconds = 0;

    @Column(name = "completion_percentage")
    @Builder.Default
    private Integer completionPercentage = 0;

    @Column(name = "last_position")
    @Builder.Default
    private Integer lastPosition = 0;

    @Column(name = "last_watched_at_display", length = 10)
    private String lastWatchedAtDisplay;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PreUpdate
    @PrePersist
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
        if (watchedSeconds == null) {
            watchedSeconds = 0;
        }
        if (completionPercentage == null) {
            completionPercentage = 0;
        }
        if (lastPosition == null) {
            lastPosition = 0;
        }
        if (lastPosition != null && lastPosition > 0) {
            int mins = lastPosition / 60;
            int secs = lastPosition % 60;
            lastWatchedAtDisplay = String.format("%d:%02d", mins, secs);
        }
    }
}
