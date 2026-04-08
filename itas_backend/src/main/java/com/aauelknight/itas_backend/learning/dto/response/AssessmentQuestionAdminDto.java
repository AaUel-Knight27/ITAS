package com.aauelknight.itas_backend.learning.dto.response;
import com.aauelknight.itas_backend.learning.entity.QuestionType;
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
    private String explanation;
    private Integer points;
}

