package com.aauelknight.notification.dto.request;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CampaignDto {

    private Long id;
    private String title;
    private String message;
    private String audienceType;
    private Boolean sendNow;
    private LocalDateTime scheduledAt;
    private String status;
    private String createdByUsername;
    private LocalDateTime createdAt;
    private Long deliveryCount;
}
