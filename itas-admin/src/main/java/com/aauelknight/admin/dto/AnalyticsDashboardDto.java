package com.aauelknight.admin.dto;

import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalyticsDashboardDto {

    private Long totalUsers;
    private Map<String, Object> usersByRole;
    private Long totalCourses;
    private Long totalEnrollments;
    private Long completedEnrollments;
    private Long totalCertificates;
    private Long totalWebinars;
    private Long totalWebinarRegistrations;
    private Long totalActivityLogs;
    private Map<String, Object> activityBreakdown;
}
