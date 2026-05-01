package com.aauelknight.webinar.dto.response;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WebinarDto {

    private Long id;
    private String title;
    private String description;
    private String presenterName;
    private LocalDateTime scheduledAt;
    private Integer durationMinutes;
    private Integer maxAttendees;
    private Integer registeredCount;
    private String meetingLink;
    private String status;
    private LocalDateTime createdAt;
}
