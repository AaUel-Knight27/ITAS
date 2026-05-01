package com.aauelknight.course.learning.dto.request;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AssessmentCreateRequest {

    private Long lectureId;

    private String title;

    private Double passingScore;

    private Integer maxAttempts;

    private Long sectionId;

    private Boolean finalExam;
}



