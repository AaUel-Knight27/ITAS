package com.aauelknight.learning.dto.response;

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
public class AssessmentResultDto {

    private Long attemptId;
    private Long assessmentId;
    private Double score;
    private Boolean passed;
    private Integer correctAnswers;
    private Integer incorrectAnswers;
    private Integer totalQuestions;
    private Double passingScore;
    private Integer attemptNumber;
    private Integer attemptsRemaining;
    private LocalDateTime submittedAt;
    private Long certificateId;
    private String certificateCode;
    private List<QuestionResult> questionResults;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuestionResult {
        private Long questionId;
        private String questionText;
        private String selectedAnswer;
        private String correctAnswer;
        private String explanation;
        private Boolean correct;
        private Integer points;
    }
}
