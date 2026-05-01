package com.aauelknight.learning.dto.response;

import com.aauelknight.learning.entity.QuestionType;
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
    private String correctAnswer;
    private String explanation;
    private Integer points;
}
