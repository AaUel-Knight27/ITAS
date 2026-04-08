package com.aauelknight.itas_backend.dto;

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
    private Integer totalLectures;
    private Integer completedLectures;
    private Double progressPercent;
    private Long nextRecommendedLectureId;
    private List<SectionProgress> sectionProgresses;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SectionProgress {
        private Long sectionId;
        private String sectionTitle;
        private Integer totalLectures;
        private Integer completedLectures;
        private Integer progressPercent;
        private Boolean unlocked;
    }
}
