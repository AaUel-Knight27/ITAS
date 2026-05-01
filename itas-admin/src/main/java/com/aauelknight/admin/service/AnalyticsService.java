package com.aauelknight.admin.service;

import com.aauelknight.admin.client.AuthServiceClient;
import com.aauelknight.admin.client.CourseServiceClient;
import com.aauelknight.admin.client.LearningServiceClient;
import com.aauelknight.admin.client.WebinarServiceClient;
import com.aauelknight.admin.dto.AnalyticsDashboardDto;
import com.aauelknight.admin.dto.UserActivityDto;
import com.aauelknight.admin.entity.UserActivityLog;
import com.aauelknight.admin.repository.UserActivityLogRepository;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnalyticsService {

    private final AuthServiceClient authServiceClient;
    private final CourseServiceClient courseServiceClient;
    private final LearningServiceClient learningServiceClient;
    private final WebinarServiceClient webinarServiceClient;
    private final UserActivityLogRepository activityLogRepository;

    public AnalyticsDashboardDto getDashboard() {
        Map<String, Object> authStats = authServiceClient.getStats();
        Map<String, Object> courseStats = courseServiceClient.getStats();
        Map<String, Object> learningStats = learningServiceClient.getStats();
        Map<String, Object> webinarStats = webinarServiceClient.getStats();

        Map<String, Object> activityBreakdown = new LinkedHashMap<>();
        activityLogRepository.countByActivityType().forEach(row ->
                activityBreakdown.put(String.valueOf(row[0]), row[1]));

        return AnalyticsDashboardDto.builder()
                .totalUsers(toLong(authStats.get("userCount")))
                .usersByRole(asMap(authStats.get("usersByRole")))
                .totalCourses(toLong(courseStats.get("totalCourses")))
                .totalEnrollments(toLong(learningStats.get("totalEnrollments")))
                .completedEnrollments(toLong(learningStats.get("completedEnrollments")))
                .totalCertificates(toLong(learningStats.get("totalCertificates")))
                .totalWebinars(toLong(webinarStats.get("totalWebinars")))
                .totalWebinarRegistrations(toLong(webinarStats.get("totalRegistrations")))
                .totalActivityLogs(activityLogRepository.count())
                .activityBreakdown(activityBreakdown)
                .build();
    }

    @Transactional(readOnly = true)
    public Page<UserActivityDto> getActivityLogs(Pageable pageable) {
        return activityLogRepository.findAllOrdered(pageable).map(this::toDto);
    }

    @Transactional(readOnly = true)
    public List<UserActivityDto> getActivityByUser(Long userId) {
        return activityLogRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::toDto).toList();
    }

    @Transactional
    public UserActivityDto logActivity(UserActivityLog activityLog) {
        return toDto(activityLogRepository.save(activityLog));
    }

    private UserActivityDto toDto(UserActivityLog log) {
        return UserActivityDto.builder()
                .id(log.getId())
                .userId(log.getUserId())
                .username(log.getUsername())
                .activityType(log.getActivityType())
                .resourceId(log.getResourceId())
                .courseName(log.getCourseName())
                .ipAddress(log.getIpAddress())
                .createdAt(log.getCreatedAt())
                .build();
    }

    private Long toLong(Object value) {
        if (value == null) return 0L;
        if (value instanceof Number num) return num.longValue();
        try { return Long.parseLong(String.valueOf(value)); } catch (Exception e) { return 0L; }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> asMap(Object value) {
        if (value instanceof Map) return (Map<String, Object>) value;
        return Map.of();
    }
}
