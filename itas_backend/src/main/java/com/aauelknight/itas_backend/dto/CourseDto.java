package com.aauelknight.itas_backend.dto;

import com.aauelknight.itas_backend.modules.courses.CourseDifficulty;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import com.aauelknight.itas_backend.modules.courses.AudienceType;
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
public class CourseDto {

    private Long id;
    private String title;
    private String slug;
    private String description;
    private CourseDifficulty difficulty;
    private Integer durationMinutes;
    private String thumbnailUrl;
    private boolean published;
    private String status;
    private String archivedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long categoryId;
    private String categoryName;
    private String categoryDescription;
    private Set<AudienceType> targetAudience;
    private boolean enrolled;
    private double progressPercent;
    private List<CourseSectionDto> sections;
}
