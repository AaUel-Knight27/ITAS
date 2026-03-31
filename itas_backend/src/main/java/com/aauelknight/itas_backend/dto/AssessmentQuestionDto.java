package com.aauelknight.itas_backend.dto;

import com.aauelknight.itas_backend.modules.learning.QuestionType;
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
public class AssessmentQuestionDto {

    private Long id;
    private String questionText;
    private QuestionType questionType;
    private List<String> options;
    private Integer points;
}
