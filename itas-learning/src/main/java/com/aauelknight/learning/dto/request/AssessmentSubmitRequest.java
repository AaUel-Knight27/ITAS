package com.aauelknight.learning.dto.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AssessmentSubmitRequest {

    @NotNull(message = "assessmentId is required")
    private Long assessmentId;

    @NotNull(message = "answers are required")
    @NotEmpty(message = "answers cannot be empty")
    private Map<Long, String> answers;
}
