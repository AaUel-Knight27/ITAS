package com.aauelknight.itas_backend.admin.dto.request;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SyncStatsDto {

    private long totalSyncs;
    private long successfulSyncs;
    private long failedSyncs;
    private long pendingSyncs;
    private List<SyncLogDto> latestPerSystem;
}

