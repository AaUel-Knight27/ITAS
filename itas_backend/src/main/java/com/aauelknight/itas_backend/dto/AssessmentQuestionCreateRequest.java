package com.aauelknight.itas_backend.dto;

import com.aauelknight.itas_backend.modules.learning.QuestionType;
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
public class AssessmentQuestionCreateRequest {

    @NotBlank(message = "questionText is required")
    private String questionText;

    @NotNull(message = "questionType is required")
    private QuestionType questionType;

    private String optionsJson;

    @NotBlank(message = "correctAnswer is required")
    private String correctAnswer;

    @NotNull(message = "points is required")
    private Integer points;
}
