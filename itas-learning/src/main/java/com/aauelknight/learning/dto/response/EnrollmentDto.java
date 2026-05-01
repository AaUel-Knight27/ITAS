package com.aauelknight.learning.dto.response;

import com.aauelknight.learning.entity.EnrollmentStatus;
import java.time.LocalDateTime;
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
public class EnrollmentDto {

    private Long id;
    private Long courseId;
    private String courseTitle;
    private String courseSlug;
    private String courseThumbnail;
    private String courseThumbnailUrl;
    private String thumbnailUrl;
    private EnrollmentStatus status;
    private Double progressPercent;
    private Long lastLectureId;
    private LocalDateTime enrolledAt;
    private LocalDateTime completedAt;
}
