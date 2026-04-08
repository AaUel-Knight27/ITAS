package com.aauelknight.itas_backend.learning.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AssessmentCreateRequest {

    @NotNull(message = "lectureId is required")
    private Long lectureId;

    @NotBlank(message = "title is required")
    private String title;

    @NotNull(message = "passingScore is required")
    private Double passingScore;

    @NotNull(message = "maxAttempts is required")
    private Integer maxAttempts;
}
