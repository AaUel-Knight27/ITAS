package com.aauelknight.itas_backend.dto.webinar;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WebinarRequest {

    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    @NotNull(message = "Scheduled date is required")
    @Future(message = "Scheduled date must be in the future")
    private LocalDateTime scheduledAt;

    private Integer durationMinutes;

    private Integer maxAttendees;

    private String meetingLink;
}
