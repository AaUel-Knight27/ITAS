package com.aauelknight.course.courses.dto.request;
import com.aauelknight.course.courses.entity.CourseDifficulty;
import com.aauelknight.course.courses.entity.AudienceType;
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
public class CourseCreateRequest {

    @NotBlank(message = "title is required")
    private String title;

    private String slug;

    private String description;

    @NotNull(message = "categoryId is required")
    private Long categoryId;

    @NotNull(message = "difficulty is required")
    private CourseDifficulty difficulty;

    private String thumbnailUrl;

    private Set<AudienceType> targetAudience = Set.of(AudienceType.ALL);
}



