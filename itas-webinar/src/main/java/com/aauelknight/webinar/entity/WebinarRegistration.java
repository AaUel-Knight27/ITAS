package com.aauelknight.webinar.entity;

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
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(
        name = "webinar_registrations",
        schema = "webinar_schema",
        uniqueConstraints = @UniqueConstraint(columnNames = {"webinar_id", "user_id"})
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WebinarRegistration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "webinar_id", nullable = false)
    private Webinar webinar;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "user_email", length = 200)
    private String userEmail;

    @Column(name = "user_name", length = 200)
    private String userName;

    @Column(name = "registered_at", nullable = false, updatable = false)
    private LocalDateTime registeredAt;

    @Column(nullable = false)
    @Builder.Default
    private Boolean attended = false;

    @PrePersist
    public void onCreate() {
        if (registeredAt == null) {
            registeredAt = LocalDateTime.now();
        }
        if (attended == null) {
            attended = false;
        }
    }
}
