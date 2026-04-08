package com.aauelknight.itas_backend.notifications.dto.request;

import jakarta.validation.constraints.NotBlank;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationRequest {

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Message is required")
    private String message;

    @NotBlank(message = "Audience type is required")
    private String audienceType;
    // Values: ALL, TAXPAYER, TAX_AGENT,
    //         MOR_STAFF, ALL_LEARNERS

    private Boolean sendNow = true;

    private LocalDateTime scheduledAt;
}

