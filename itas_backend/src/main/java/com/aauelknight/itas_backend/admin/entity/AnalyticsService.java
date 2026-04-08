package com.aauelknight.itas_backend.admin.entity;

import com.aauelknight.itas_backend.admin.dto.response.ActivityLogDto;
import com.aauelknight.itas_backend.admin.dto.response.AnalyticsDashboardDto;
import com.aauelknight.itas_backend.admin.dto.response.CourseCompletionRateDto;
import com.aauelknight.itas_backend.admin.dto.response.DailyEnrollmentDto;
import com.aauelknight.itas_backend.admin.dto.response.QuizPassRateDto;
import com.aauelknight.itas_backend.admin.dto.response.RoleCountDto;
import com.aauelknight.itas_backend.learning.entity.EnrollmentStatus;
import com.aauelknight.itas_backend.learning.repository.AssessmentAttemptRepository;
import com.aauelknight.itas_backend.learning.repository.CertificateRepository;
import com.aauelknight.itas_backend.learning.repository.EnrollmentRepository;
import com.aauelknight.itas_backend.admin.repository.UserActivityLogRepository;
import com.aauelknight.itas_backend.auth.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final UserRepository userRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final CertificateRepository certificateRepository;
    private final AssessmentAttemptRepository attemptRepository;
    private final UserActivityLogRepository activityLogRepository;

    @Transactional(readOnly = true)
    public AnalyticsDashboardDto getDashboard() {
        long totalUsers = userRepository.count();

        long activeLearners;
        try {
            activeLearners = userRepository.countActiveLearners();
        } catch (Exception e) {
            activeLearners = 0;
        }

        long completions = enrollmentRepository.countByStatus(EnrollmentStatus.COMPLETED);
        long certificates = certificateRepository.count();

        Double avgScore;
        try {
            avgScore = attemptRepository.getAveragePassingScore();
        } catch (Exception e) {
            avgScore = null;
        }

        return new AnalyticsDashboardDto(
                totalUsers,
                activeLearners,
                completions,
                certificates,
                avgScore != null ? avgScore : 0.0
        );
    }

    @Transactional(readOnly = true)
    public List<DailyEnrollmentDto> getEnrollmentsOverTime(int days) {
        try {
            LocalDateTime from = LocalDateTime.now().minusDays(days);
            List<Object[]> rows = enrollmentRepository.countEnrollmentsPerDay(from);
            return rows.stream()
                    .map(r -> new DailyEnrollmentDto(
                            r[0].toString(),
                            ((Number) r[1]).longValue()))
                    .collect(Collectors.toList());
        } catch (Exception e) {
            return List.of();
        }
    }

    @Transactional(readOnly = true)
    public List<CourseCompletionRateDto> getCompletionRates() {
        try {
            Pageable top10 = PageRequest.of(0, 10);
            return enrollmentRepository.getCourseCompletionRates(top10)
                    .stream()
                    .map(r -> new CourseCompletionRateDto(
                            (String) r[0],
                            ((Number) r[1]).doubleValue()))
                    .collect(Collectors.toList());
        } catch (Exception e) {
            return List.of();
        }
    }

    @Transactional(readOnly = true)
    public List<RoleCountDto> getLearnersByRole() {
        try {
            return userRepository.countLearnersByRole()
                    .stream()
                    .map(r -> new RoleCountDto(
                            (String) r[0],
                            ((Number) r[1]).longValue()))
                    .collect(Collectors.toList());
        } catch (Exception e) {
            return List.of();
        }
    }

    @Transactional(readOnly = true)
    public List<QuizPassRateDto> getQuizPassRates() {
        try {
            return attemptRepository.getQuizPassRatesByCourse()
                    .stream()
                    .map(r -> new QuizPassRateDto(
                            (String) r[0],
                            ((Number) r[1]).doubleValue()))
                    .collect(Collectors.toList());
        } catch (Exception e) {
            return List.of();
        }
    }

    @Transactional(readOnly = true)
    public List<ActivityLogDto> getRecentActivity(int limit) {
        try {
            return activityLogRepository.findTop20ByOrderByCreatedAtDesc()
                    .stream()
                    .limit(limit)
                    .map(log -> new ActivityLogDto(
                            log.getId(),
                            log.getUser() != null ? log.getUser().getUsername() : "System",
                            log.getActivityType(),
                            log.getResourceId() != null ? log.getResourceId().toString() : null,
                            log.getCreatedAt().toString()))
                    .collect(Collectors.toList());
        } catch (Exception e) {
            return List.of();
        }
    }
}
