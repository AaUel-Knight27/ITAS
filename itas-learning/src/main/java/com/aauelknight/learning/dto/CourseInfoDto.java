package com.aauelknight.learning.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseInfoDto {

    private Long id;
    private String title;
    private String slug;
    private String description;
    private String difficulty;
    private String thumbnailUrl;
    private Boolean published;
    private Long categoryId;
    private String categoryName;
    private List<SectionInfoDto> sections;
}
