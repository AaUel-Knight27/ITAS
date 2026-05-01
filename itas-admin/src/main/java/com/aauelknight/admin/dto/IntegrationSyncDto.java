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
public class IntegrationSyncDto {

    private Long id;
    private String systemName;
    private String syncType;
    private String status;
    private Integer recordsProcessed;
    private Integer recordsFailed;
    private String errorMessage;
    private String triggeredByUsername;
    private LocalDateTime startedAt;
    private LocalDateTime finishedAt;
}
