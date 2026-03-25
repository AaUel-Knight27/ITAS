package com.aauelknight.itas_backend.dto.integration;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SyncLogDto {

    private Long id;
    private String systemName;
    private String syncType;
    private String status;
    private Integer recordsProcessed;
    private Integer recordsFailed;
    private String errorMessage;
    private String triggeredByUsername;
    private String startedAt;
    private String finishedAt;
    private Long durationMs;
    private String durationFormatted;
}
