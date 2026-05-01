package com.aauelknight.admin.dto;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserActivityDto {

    private Long id;
    private Long userId;
    private String username;
    private String activityType;
    private String resourceId;
    private String courseName;
    private String ipAddress;
    private LocalDateTime createdAt;
}
