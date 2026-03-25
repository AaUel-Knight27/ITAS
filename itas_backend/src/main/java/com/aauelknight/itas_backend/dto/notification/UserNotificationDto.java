package com.aauelknight.itas_backend.dto.notification;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserNotificationDto {

    private Long id;
    private String title;
    private String message;
    private Boolean readStatus;
    private LocalDateTime deliveredAt;
}
