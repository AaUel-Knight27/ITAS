package com.aauelknight.itas_backend.dto;

import com.aauelknight.itas_backend.modules.learning.QuestionType;
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
public class AssessmentQuestionAdminDto {

    private Long id;
    private String questionText;
    private QuestionType questionType;
    private String optionsJson;
    private String correctAnswer;
    private Integer points;
}
