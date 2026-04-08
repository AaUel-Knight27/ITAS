package com.aauelknight.itas_backend.admin.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnalyticsDashboardDto {

    private long totalUsers;
    private long activeLearners;
    private long totalCompletions;
    private long totalCertificates;
    private double avgQuizScore;
}
