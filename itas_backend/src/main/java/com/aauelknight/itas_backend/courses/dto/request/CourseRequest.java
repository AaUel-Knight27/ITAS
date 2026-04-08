package com.aauelknight.itas_backend.courses.dto.request;
import com.aauelknight.itas_backend.courses.entity.CourseDifficulty;
import com.aauelknight.itas_backend.courses.entity.AudienceType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.Set;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CourseRequest {

    @NotBlank(message = "title is required")
    private String title;

    private String slug;

    private String description;

    @NotNull(message = "difficulty is required")
    private CourseDifficulty difficulty;

    private Integer durationMinutes;

    private String thumbnailUrl;

    private Long categoryId;

    private Set<AudienceType> targetAudience = Set.of(AudienceType.ALL);
}

