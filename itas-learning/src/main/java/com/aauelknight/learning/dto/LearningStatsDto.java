package com.aauelknight.learning.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LearningStatsDto {

    private long totalEnrollments;
    private long completedEnrollments;
    private long totalCertificates;
}
