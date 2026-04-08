package com.aauelknight.itas_backend.lecture.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VideoProgressDto {

    private Long id;
    private Long lectureId;
    private String lectureTitle;
    private Integer watchedSeconds;
    private Integer completionPercentage;
    private Integer lastPosition;
    private String lastWatchedAtDisplay;
    private String updatedAt;
}
