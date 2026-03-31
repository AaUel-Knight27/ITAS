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
public class QuestionRequest {

    @NotBlank
    private String questionText;

    @NotNull
    private QuestionType questionType;

    private String optionsJson;

    @NotBlank
    private String correctAnswer;

    private Integer points = 1;
}
