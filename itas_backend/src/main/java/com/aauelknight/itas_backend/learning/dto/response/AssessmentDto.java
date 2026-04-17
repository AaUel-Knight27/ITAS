package com.aauelknight.itas_backend.learning.dto.response;

import java.time.LocalDateTime;
import java.util.List;
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
public class AssessmentDto {

    private Long id;
    private Long courseId;
    private Long sectionId;
    private String title;
    private Boolean finalExam;
    private Double passingScore;
    private Integer maxAttempts;
    private LocalDateTime createdAt;
    private List<AssessmentQuestionDto> questions;
}

