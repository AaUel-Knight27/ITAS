package com.aauelknight.itas_backend.dto;

import com.aauelknight.itas_backend.entity.EnrollmentStatus;
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
    private EnrollmentStatus status;
}
