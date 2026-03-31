package com.aauelknight.itas_backend.modules.webinars;

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

import com.aauelknight.itas_backend.modules.auth.User;
@Entity
@Table(name = "webinar_registrations")
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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "registered_at", updatable = false)
    private LocalDateTime registeredAt;

    @Column
    @Builder.Default
    private Boolean attended = false;

    @PrePersist
    protected void onCreate() {
        registeredAt = LocalDateTime.now();
    }
}
