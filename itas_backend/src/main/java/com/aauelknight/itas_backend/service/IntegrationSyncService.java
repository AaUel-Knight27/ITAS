package com.aauelknight.itas_backend.service;

import com.aauelknight.itas_backend.dto.integration.SyncLogDto;
import com.aauelknight.itas_backend.dto.integration.SyncRequestDto;
import com.aauelknight.itas_backend.dto.integration.SyncStatsDto;
import com.aauelknight.itas_backend.entity.IntegrationSyncLog;
import com.aauelknight.itas_backend.entity.User;
import com.aauelknight.itas_backend.repository.IntegrationSyncLogRepository;
import com.aauelknight.itas_backend.repository.UserRepository;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class IntegrationSyncService {

    private final IntegrationSyncLogRepository syncLogRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public Page<SyncLogDto> getAllLogs(String systemName, String status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("startedAt").descending());
        return syncLogRepository.findFiltered(systemName, status, pageable).map(this::toDto);
    }

    @Transactional(readOnly = true)
    public SyncStatsDto getStats() {
        long total = syncLogRepository.count();
        long success = syncLogRepository.countByStatus("SUCCESS");
        long failed = syncLogRepository.countByStatus("FAILED");
        long pending = syncLogRepository.countByStatus("PENDING") + syncLogRepository.countByStatus("RUNNING");

        List<SyncLogDto> latest = syncLogRepository.findLatestPerSystem()
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());

        return SyncStatsDto.builder()
                .totalSyncs(total)
                .successfulSyncs(success)
                .failedSyncs(failed)
                .pendingSyncs(pending)
                .latestPerSystem(latest)
                .build();
    }

    @Transactional(readOnly = true)
    public SyncLogDto getById(Long id) {
        return syncLogRepository.findById(id)
                .map(this::toDto)
                .orElseThrow(() -> new RuntimeException("Sync log not found: " + id));
    }

    @Transactional
    public SyncLogDto triggerSync(SyncRequestDto req, String username) {
        User triggeredBy = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));

        IntegrationSyncLog log = IntegrationSyncLog.builder()
                .systemName(req.getSystemName())
                .syncType(req.getSyncType())
                .status("RUNNING")
                .recordsProcessed(0)
                .recordsFailed(0)
                .triggeredBy(triggeredBy)
                .startedAt(LocalDateTime.now())
                .build();

        log = syncLogRepository.save(log);

        try {
            SyncResult result = performSync(req.getSystemName(), req.getSyncType());
            log.setStatus(result.isSuccess() ? "SUCCESS" : "PARTIAL");
            log.setRecordsProcessed(result.getProcessed());
            log.setRecordsFailed(result.getFailed());
            if (result.getErrorMessage() != null) {
                log.setErrorMessage(result.getErrorMessage());
            }
        } catch (Exception e) {
            log.setStatus("FAILED");
            log.setErrorMessage(e.getMessage());
        } finally {
            LocalDateTime finished = LocalDateTime.now();
            log.setFinishedAt(finished);
            log.setDurationMs(Duration.between(log.getStartedAt(), finished).toMillis());
        }

        return toDto(syncLogRepository.save(log));
    }

    @Transactional
    public SyncLogDto retrySync(Long logId, String username) {
        IntegrationSyncLog original = syncLogRepository.findById(logId)
                .orElseThrow(() -> new RuntimeException("Sync log not found: " + logId));

        SyncRequestDto req = new SyncRequestDto(original.getSystemName(), original.getSyncType());
        return triggerSync(req, username);
    }

    private SyncResult performSync(String systemName, String syncType) {
        try {
            Thread.sleep(500);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        return switch (systemName.toUpperCase()) {
            case "HR_SYSTEM" -> new SyncResult(true, 150, 0, null);
            case "TAX_RECORDS" -> new SyncResult(true, 342, 2, "2 records skipped: duplicate TIN");
            case "PAYMENT_GATEWAY" -> new SyncResult(true, 89, 0, null);
            case "DIRECTORY" -> new SyncResult(true, 210, 0, null);
            default -> new SyncResult(true, 0, 0, "Unknown system - no records to sync");
        };
    }

    @Data
    @AllArgsConstructor
    private static class SyncResult {
        private boolean success;
        private int processed;
        private int failed;
        private String errorMessage;
    }

    @Transactional(readOnly = true)
    public byte[] exportToCsv() {
        List<IntegrationSyncLog> all = syncLogRepository.findAllPaged(PageRequest.of(0, 10000)).getContent();

        StringBuilder csv = new StringBuilder();
        csv.append("id,systemName,syncType,status,recordsProcessed,recordsFailed,triggeredBy,startedAt,finishedAt,durationMs\n");

        all.forEach(log -> {
            csv.append(log.getId()).append(",");
            csv.append(log.getSystemName()).append(",");
            csv.append(log.getSyncType()).append(",");
            csv.append(log.getStatus()).append(",");
            csv.append(log.getRecordsProcessed()).append(",");
            csv.append(log.getRecordsFailed()).append(",");
            csv.append(log.getTriggeredBy() != null ? log.getTriggeredBy().getUsername() : "System").append(",");
            csv.append(log.getStartedAt()).append(",");
            csv.append(log.getFinishedAt() != null ? log.getFinishedAt() : "").append(",");
            csv.append(log.getDurationMs() != null ? log.getDurationMs() : "").append("\n");
        });

        return csv.toString().getBytes(StandardCharsets.UTF_8);
    }

    private SyncLogDto toDto(IntegrationSyncLog log) {
        String durationFormatted = "";
        if (log.getDurationMs() != null) {
            long ms = log.getDurationMs();
            if (ms < 1000) {
                durationFormatted = ms + "ms";
            } else if (ms < 60000) {
                durationFormatted = String.format("%.1fs", ms / 1000.0);
            } else {
                durationFormatted = String.format("%dm %ds", ms / 60000, (ms % 60000) / 1000);
            }
        }

        return SyncLogDto.builder()
                .id(log.getId())
                .systemName(log.getSystemName())
                .syncType(log.getSyncType())
                .status(log.getStatus())
                .recordsProcessed(log.getRecordsProcessed())
                .recordsFailed(log.getRecordsFailed())
                .errorMessage(log.getErrorMessage())
                .triggeredByUsername(log.getTriggeredBy() != null ? log.getTriggeredBy().getUsername() : "System")
                .startedAt(log.getStartedAt() != null ? log.getStartedAt().toString() : null)
                .finishedAt(log.getFinishedAt() != null ? log.getFinishedAt().toString() : null)
                .durationMs(log.getDurationMs())
                .durationFormatted(durationFormatted)
                .build();
    }
}
