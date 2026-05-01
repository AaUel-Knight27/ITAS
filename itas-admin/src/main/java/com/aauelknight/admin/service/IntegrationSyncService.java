package com.aauelknight.admin.service;

import com.aauelknight.admin.dto.IntegrationSyncDto;
import com.aauelknight.admin.entity.IntegrationSyncLog;
import com.aauelknight.admin.repository.IntegrationSyncLogRepository;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
@Slf4j
public class IntegrationSyncService {

    private final IntegrationSyncLogRepository syncLogRepository;

    @Transactional(readOnly = true)
    public List<IntegrationSyncDto> getAllSyncLogs() {
        return syncLogRepository.findAllOrdered().stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public List<IntegrationSyncDto> getSyncLogsBySystem(String systemName) {
        return syncLogRepository.findBySystemNameOrderByStartedAtDesc(systemName).stream()
                .map(this::toDto).toList();
    }

    @Transactional
    public IntegrationSyncDto triggerSync(String systemName, String syncType, String username) {
        IntegrationSyncLog syncLog = IntegrationSyncLog.builder()
                .systemName(systemName)
                .syncType(syncType)
                .status("RUNNING")
                .triggeredByUsername(username)
                .build();
        syncLog = syncLogRepository.save(syncLog);

        // Simulate sync completion (in production this would be async)
        try {
            syncLog.setStatus("COMPLETED");
            syncLog.setRecordsProcessed(0);
            syncLog.setRecordsFailed(0);
            syncLog.setFinishedAt(LocalDateTime.now());
            syncLog = syncLogRepository.save(syncLog);
        } catch (Exception ex) {
            syncLog.setStatus("FAILED");
            syncLog.setErrorMessage(ex.getMessage());
            syncLog.setFinishedAt(LocalDateTime.now());
            syncLogRepository.save(syncLog);
            log.error("Sync failed for {} / {}: {}", systemName, syncType, ex.getMessage());
        }

        return toDto(syncLog);
    }

    @Transactional(readOnly = true)
    public IntegrationSyncDto getSyncLog(Long id) {
        return toDto(syncLogRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sync log not found")));
    }

    private IntegrationSyncDto toDto(IntegrationSyncLog log) {
        return IntegrationSyncDto.builder()
                .id(log.getId())
                .systemName(log.getSystemName())
                .syncType(log.getSyncType())
                .status(log.getStatus())
                .recordsProcessed(log.getRecordsProcessed())
                .recordsFailed(log.getRecordsFailed())
                .errorMessage(log.getErrorMessage())
                .triggeredByUsername(log.getTriggeredByUsername())
                .startedAt(log.getStartedAt())
                .finishedAt(log.getFinishedAt())
                .build();
    }
}
