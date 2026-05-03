package com.aauelknight.course.learning.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import com.aauelknight.course.courses.entity.Course;

@Entity
@Table(name = "course_enrollments", schema = "learning_schema")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseEnrollment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EnrollmentStatus status;

    @Column(name = "progress_percent", nullable = false)
    private Double progressPercent;

    @Column(name = "enrolled_at", nullable = false)
    private LocalDateTime enrolledAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @PrePersist
    public void onCreate() {
        if (status == null) {
            status = EnrollmentStatus.ACTIVE;
        }
        if (progressPercent == null) {
            progressPercent = 0.0;
        }
        if (enrolledAt == null) {
            enrolledAt = LocalDateTime.now();
        }
    }

    @PreUpdate
    public void onUpdate() {
        if (status == EnrollmentStatus.COMPLETED && completedAt == null) {
            completedAt = LocalDateTime.now();
        }
    }
}
