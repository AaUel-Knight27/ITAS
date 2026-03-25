package com.aauelknight.itas_backend.dto.analytics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActivityLogDto {

    private Long id;
    private String username;
    private String activityType;
    private String resourceId;
    private String timestamp;
}
