package com.aauelknight.itas_backend.config;

import com.aauelknight.itas_backend.entity.IntegrationSyncLog;
import com.aauelknight.itas_backend.entity.User;
import com.aauelknight.itas_backend.repository.IntegrationSyncLogRepository;
import com.aauelknight.itas_backend.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class IntegrationSyncLogSeeder implements CommandLineRunner {

    private final IntegrationSyncLogRepository syncLogRepository;
    private final UserRepository userRepository;

    @Override
    public void run(String... args) {
        seedIntegrationLogs();
    }

    private void seedIntegrationLogs() {
        User system = resolveSystemUser();

        if (syncLogRepository.count() > 0) {
            backfillMissingTriggerUsers(system);
            return;
        }

        LocalDateTime now = LocalDateTime.now();

        List<IntegrationSyncLog> logs = List.of(
                IntegrationSyncLog.builder()
                        .systemName("HR_SYSTEM")
                        .syncType("USER_SYNC")
                        .status("SUCCESS")
                        .recordsProcessed(150)
                        .recordsFailed(0)
                        .triggeredBy(system)
                        .startedAt(now.minusHours(2))
                        .finishedAt(now.minusHours(2).plusSeconds(3))
                        .durationMs(3241L)
                        .build(),
                IntegrationSyncLog.builder()
                        .systemName("TAX_RECORDS")
                        .syncType("FULL_SYNC")
                        .status("PARTIAL")
                        .recordsProcessed(342)
                        .recordsFailed(2)
                        .errorMessage("2 records skipped: duplicate TIN detected")
                        .triggeredBy(system)
                        .startedAt(now.minusDays(1))
                        .finishedAt(now.minusDays(1).plusSeconds(12))
                        .durationMs(12450L)
                        .build(),
                IntegrationSyncLog.builder()
                        .systemName("PAYMENT_GATEWAY")
                        .syncType("CERTIFICATE_SYNC")
                        .status("SUCCESS")
                        .recordsProcessed(89)
                        .recordsFailed(0)
                        .triggeredBy(system)
                        .startedAt(now.minusDays(2))
                        .finishedAt(now.minusDays(2).plusSeconds(5))
                        .durationMs(5120L)
                        .build(),
                IntegrationSyncLog.builder()
                        .systemName("DIRECTORY")
                        .syncType("USER_SYNC")
                        .status("FAILED")
                        .recordsProcessed(0)
                        .recordsFailed(0)
                        .errorMessage("Connection timeout: LDAP server unreachable at 192.168.1.100:389")
                        .triggeredBy(system)
                        .startedAt(now.minusDays(3))
                        .finishedAt(now.minusDays(3).plusSeconds(30))
                        .durationMs(30000L)
                        .build(),
                IntegrationSyncLog.builder()
                        .systemName("HR_SYSTEM")
                        .syncType("USER_SYNC")
                        .status("SUCCESS")
                        .recordsProcessed(148)
                        .recordsFailed(0)
                        .triggeredBy(system)
                        .startedAt(now.minusDays(7))
                        .finishedAt(now.minusDays(7).plusSeconds(4))
                        .durationMs(3890L)
                        .build());

        syncLogRepository.saveAll(logs);
        System.out.println("Seeded " + logs.size() + " integration sync logs");
    }

    private User resolveSystemUser() {
        User system = userRepository
                .findAll()
                .stream()
                .filter(u -> u.getRole() != null
                        && "WEB_ADMIN".equals(u.getRole().getName()))
                .findFirst()
                .orElse(null);

        if (system == null) {
            system = userRepository
                    .findAll()
                    .stream()
                    .findFirst()
                    .orElse(null);
        }

        return system;
    }

    private void backfillMissingTriggerUsers(User system) {
        if (system == null) {
            return;
        }

        List<IntegrationSyncLog> logsToUpdate = syncLogRepository.findAll()
                .stream()
                .filter(log -> log.getTriggeredBy() == null)
                .peek(log -> log.setTriggeredBy(system))
                .toList();

        if (!logsToUpdate.isEmpty()) {
            syncLogRepository.saveAll(logsToUpdate);
            System.out.println("Backfilled " + logsToUpdate.size() + " integration sync logs with a valid trigger user");
        }
    }
}
