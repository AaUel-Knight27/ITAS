package com.aauelknight.itas_backend.dto;

import com.aauelknight.itas_backend.modules.learning.EnrollmentStatus;
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
public class CourseProgressDto {

    private Long courseId;
    private long totalLectures;
    private long completedLectures;
    private double progressPercent;
    private List<Long> completedLectureIds;
    private Long lastLectureId;
    private EnrollmentStatus status;
}
