package com.aauelknight.itas_backend.dto;

import com.aauelknight.itas_backend.entity.LectureType;
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
public class LectureRequest {

    @NotBlank(message = "title is required")
    private String title;

    private String description;

    @NotNull(message = "type is required")
    private LectureType type;

    private Integer orderIndex = 0;

    private Boolean isPreview = false;

    private String content;
}
