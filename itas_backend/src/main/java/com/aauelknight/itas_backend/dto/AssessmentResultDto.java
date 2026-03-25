package com.aauelknight.itas_backend.dto;

import java.time.LocalDateTime;
import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssessmentResultDto {

    private Long attemptId;
    private Long assessmentId;
    private Integer attemptNumber;
    private Double score;
    private boolean passed;
    private LocalDateTime submittedAt;
    private Map<Long, String> correctAnswers;
    private CertificateDto certificate;
}
